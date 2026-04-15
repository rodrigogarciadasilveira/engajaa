'use strict';

const { Worker } = require('bullmq');
const { redis } = require('../config/redis');
const { prisma } = require('../config/database');
const { GrowthRadarService } = require('../modules/growth-radar/growth-radar.service');

const svc = new GrowthRadarService();

const worker = new Worker('growthRadar', async () => {
  const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });

  console.log(`[growthRadar] Gerando radar para ${tenants.length} tenant(s)...`);

  for (const tenant of tenants) {
    try {
      // Verificar se já existe relatório gerado hoje para evitar duplicatas
      const today = new Date();
      const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

      const existing = await prisma.growthReport.findFirst({
        where: {
          tenantId: tenant.id,
          createdAt: { gte: startOfDay },
        },
      });

      if (existing) {
        console.log(`[growthRadar] Tenant ${tenant.id} já tem relatório hoje. Pulando.`);
        continue;
      }

      const report = await svc.generateReport(tenant.id);
      console.log(`[growthRadar] Tenant ${tenant.id}: ${report.reportStatus} | trend=${report.trend}`);
    } catch (err) {
      // Falha em um tenant não compromete os demais
      console.error(`[growthRadar] Erro no tenant ${tenant.id}:`, err.message);
    }
  }

  console.log('[growthRadar] Job concluído.');
}, { connection: redis });

worker.on('failed', (job, err) => {
  console.error('[growthRadar] Job falhou:', err.message);
});

module.exports = worker;
