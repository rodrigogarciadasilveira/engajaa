'use strict';

const { prisma } = require('../../config/database');
const { GrowthRadarRulesEngine } = require('./growth-radar.rules-engine');

const engine = new GrowthRadarRulesEngine();

// ─── Helpers de período ───────────────────────────────────────────────────────

/**
 * Retorna os dois períodos de análise com base na data atual.
 * Período atual:   últimos 7 dias completos (D-7 00:00 até D-0 00:00)
 * Período anterior: 7 dias imediatamente antes
 */
function buildPeriods() {
  const now = new Date();
  // Início de hoje (00:00:00 UTC)
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const currentEnd = todayStart;
  const currentStart = new Date(currentEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previousEnd = currentStart;
  const previousStart = new Date(previousEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  return { currentStart, currentEnd, previousStart, previousEnd };
}

// ─── Agregações ───────────────────────────────────────────────────────────────

function aggregatePeriod(posts) {
  const postsCount = posts.length;
  const likes = posts.reduce((s, p) => s + p.likeCount, 0);
  const comments = posts.reduce((s, p) => s + p.commentsCount, 0);
  const reach = posts.reduce((s, p) => s + p.reach, 0);
  const saves = posts.reduce((s, p) => s + p.saved, 0);
  const shares = posts.reduce((s, p) => s + p.sharesCount, 0);
  const impressions = posts.reduce((s, p) => s + p.impressions, 0);

  const engagementRate = reach > 0
    ? parseFloat(((likes + comments + saves) / reach * 100).toFixed(2))
    : 0;

  const avgReach = postsCount > 0 ? Math.round(reach / postsCount) : 0;
  const avgEngagement = postsCount > 0
    ? parseFloat(((likes + comments + saves) / postsCount).toFixed(2))
    : 0;

  return { postsCount, likes, comments, reach, saves, shares, impressions, engagementRate, avgReach, avgEngagement };
}

function aggregateByFormat(posts) {
  const byFormat = {};
  for (const post of posts) {
    const fmt = post.mediaType;
    if (!byFormat[fmt]) {
      byFormat[fmt] = { format: fmt, postsCount: 0, reach: 0, likes: 0, comments: 0, saves: 0, shares: 0 };
    }
    byFormat[fmt].postsCount++;
    byFormat[fmt].reach += post.reach;
    byFormat[fmt].likes += post.likeCount;
    byFormat[fmt].comments += post.commentsCount;
    byFormat[fmt].saves += post.saved;
    byFormat[fmt].shares += post.sharesCount;
  }

  return Object.values(byFormat).map(f => {
    const score = f.postsCount > 0
      ? parseFloat(((f.likes + f.comments * 2 + f.saves * 3 + f.shares * 3) / f.postsCount).toFixed(2))
      : 0;
    const avgReach = f.postsCount > 0 ? Math.round(f.reach / f.postsCount) : 0;
    const avgEngagement = f.postsCount > 0
      ? parseFloat(((f.likes + f.comments + f.saves) / f.postsCount).toFixed(2))
      : 0;
    return { ...f, score, avgReach, avgEngagement };
  }).sort((a, b) => b.score - a.score);
}

/**
 * Janelas fixas de 3 horas
 */
const HOUR_WINDOWS = [
  { label: '00h–03h', start: 0 },
  { label: '03h–06h', start: 3 },
  { label: '06h–09h', start: 6 },
  { label: '09h–12h', start: 9 },
  { label: '12h–15h', start: 12 },
  { label: '15h–18h', start: 15 },
  { label: '18h–21h', start: 18 },
  { label: '21h–00h', start: 21 },
];

function aggregateByHour(posts) {
  const buckets = {};
  for (const w of HOUR_WINDOWS) {
    buckets[w.label] = { window: w.label, postsCount: 0, reachSum: 0, engagementSum: 0 };
  }

  for (const post of posts) {
    const hour = new Date(post.timestamp).getUTCHours();
    const win = HOUR_WINDOWS.find((w, i) => {
      const next = HOUR_WINDOWS[i + 1];
      return hour >= w.start && (next ? hour < next.start : true);
    });
    if (win) {
      buckets[win.label].postsCount++;
      buckets[win.label].reachSum += post.reach;
      buckets[win.label].engagementSum += post.likeCount + post.commentsCount + post.saved;
    }
  }

  return Object.values(buckets).map(b => ({
    window: b.window,
    postsCount: b.postsCount,
    avgReach: b.postsCount > 0 ? Math.round(b.reachSum / b.postsCount) : 0,
    avgEngagement: b.postsCount > 0 ? parseFloat((b.engagementSum / b.postsCount).toFixed(2)) : 0,
  }));
}

// ─── Serviço principal ────────────────────────────────────────────────────────

class GrowthRadarService {

  /**
   * Verifica se o tenant está elegível para gerar relatório.
   */
  async checkEligibility(tenantId) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || tenant.status !== 'ACTIVE') {
      return { eligible: false, reason: 'Tenant inativo.' };
    }

    const igAccount = await prisma.instagramAccount.findFirst({ where: { tenantId } });
    if (!igAccount) {
      return { eligible: false, reason: 'Nenhuma conta Instagram conectada.' };
    }

    const { previousStart } = buildPeriods();
    const totalPosts = await prisma.igPost.count({
      where: { tenantId, timestamp: { gte: previousStart } },
    });

    if (totalPosts < 2) {
      return {
        eligible: false,
        reason: 'Ainda não há dados suficientes para gerar um radar de crescimento confiável.',
      };
    }

    return { eligible: true };
  }

  /**
   * Gera (ou regenera) o relatório do radar para um tenant.
   */
  async generateReport(tenantId) {
    const eligibility = await this.checkEligibility(tenantId);

    if (!eligibility.eligible) {
      // Salvar relatório com status INSUFFICIENT_DATA para rastrear a tentativa
      const { currentStart, currentEnd, previousStart, previousEnd } = buildPeriods();
      return prisma.growthReport.create({
        data: {
          tenantId,
          periodStart: currentStart,
          periodEnd: currentEnd,
          previousPeriodStart: previousStart,
          previousPeriodEnd: previousEnd,
          reportStatus: 'INSUFFICIENT_DATA',
          trend: 'STABLE',
          mainDiagnosis: eligibility.reason,
          summary: eligibility.reason,
        },
      });
    }

    const { currentStart, currentEnd, previousStart, previousEnd } = buildPeriods();

    // ── Buscar posts dos dois períodos
    const [currentPosts, previousPosts] = await Promise.all([
      prisma.igPost.findMany({
        where: { tenantId, timestamp: { gte: currentStart, lt: currentEnd } },
      }),
      prisma.igPost.findMany({
        where: { tenantId, timestamp: { gte: previousStart, lt: previousEnd } },
      }),
    ]);

    // ── Agregar métricas
    const current = aggregatePeriod(currentPosts);
    const previous = aggregatePeriod(previousPosts);

    // ── Calcular variações
    const reachVariationPct = engine.variationPct(current.reach, previous.reach);
    const engagementVariationPct = engine.variationPct(current.engagementRate, previous.engagementRate);
    const savesVariationPct = engine.variationPct(current.saves, previous.saves);

    // ── Análises por formato e horário (período atual)
    const formatMetrics = aggregateByFormat(currentPosts);
    const hourMetrics = aggregateByHour(currentPosts);

    // ── Rules engine
    const trend = engine.evaluateTrend(reachVariationPct);
    const bestFormatObj = engine.getBestFormat(formatMetrics);
    const bestHourObj = engine.getBestHourWindow(hourMetrics);

    const topFormat = bestFormatObj?.format ?? null;
    const topFormatScore = bestFormatObj?.score ?? 0;
    const bestHourWindow = bestHourObj?.window ?? null;

    const mainDiagnosis = engine.generateDiagnosis({
      trend,
      reachVariationPct,
      postsCountCurrent: current.postsCount,
      postsCountPrevious: previous.postsCount,
      topFormat,
    });

    const recommendation = engine.generateRecommendation({ topFormat, bestHourWindow, trend });

    const summary = engine.generateSummary({
      trend,
      reachVariationPct,
      mainDiagnosis,
      topFormat,
      bestHourWindow,
    });

    // ── rawDataJson snapshot
    const rawDataJson = {
      periods: {
        current: { start: currentStart, end: currentEnd, ...current },
        previous: { start: previousStart, end: previousEnd, ...previous },
      },
      variations: { reachVariationPct, engagementVariationPct, savesVariationPct },
      formatMetrics,
      hourMetrics,
      rulesTriggered: { trend, topFormat, bestHourWindow },
    };

    return prisma.growthReport.create({
      data: {
        tenantId,
        periodStart: currentStart,
        periodEnd: currentEnd,
        previousPeriodStart: previousStart,
        previousPeriodEnd: previousEnd,
        postsCountCurrent: current.postsCount,
        postsCountPrevious: previous.postsCount,
        reachCurrent: current.reach,
        reachPrevious: previous.reach,
        reachVariationPct,
        engagementRateCurrent: current.engagementRate,
        engagementRatePrevious: previous.engagementRate,
        engagementVariationPct,
        savesCurrent: current.saves,
        savesPrevious: previous.saves,
        savesVariationPct,
        topFormat,
        topFormatScore,
        bestHourWindow,
        trend,
        mainDiagnosis,
        recommendation,
        summary,
        reportStatus: 'OK',
        rawDataJson,
      },
    });
  }

  /**
   * Retorna o relatório mais recente do tenant.
   */
  async getLatest(tenantId) {
    return prisma.growthReport.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retorna o histórico paginado de relatórios do tenant.
   */
  async getHistory(tenantId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.growthReport.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          trend: true,
          reachVariationPct: true,
          engagementVariationPct: true,
          topFormat: true,
          bestHourWindow: true,
          summary: true,
          reportStatus: true,
          createdAt: true,
          periodStart: true,
          periodEnd: true,
        },
      }),
      prisma.growthReport.count({ where: { tenantId } }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }
}

module.exports = { GrowthRadarService };
