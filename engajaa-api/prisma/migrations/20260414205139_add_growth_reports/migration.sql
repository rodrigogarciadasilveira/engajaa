-- CreateTable
CREATE TABLE "growth_reports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "previousPeriodStart" TIMESTAMP(3) NOT NULL,
    "previousPeriodEnd" TIMESTAMP(3) NOT NULL,
    "postsCountCurrent" INTEGER NOT NULL DEFAULT 0,
    "postsCountPrevious" INTEGER NOT NULL DEFAULT 0,
    "reachCurrent" INTEGER NOT NULL DEFAULT 0,
    "reachPrevious" INTEGER NOT NULL DEFAULT 0,
    "reachVariationPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementRateCurrent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementRatePrevious" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementVariationPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "savesCurrent" INTEGER NOT NULL DEFAULT 0,
    "savesPrevious" INTEGER NOT NULL DEFAULT 0,
    "savesVariationPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "topFormat" TEXT,
    "topFormatScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bestHourWindow" TEXT,
    "trend" TEXT NOT NULL DEFAULT 'STABLE',
    "mainDiagnosis" TEXT,
    "recommendation" TEXT,
    "summary" TEXT,
    "reportStatus" TEXT NOT NULL DEFAULT 'OK',
    "rawDataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "growth_reports_tenantId_idx" ON "growth_reports"("tenantId");

-- CreateIndex
CREATE INDEX "growth_reports_tenantId_createdAt_idx" ON "growth_reports"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "growth_reports" ADD CONSTRAINT "growth_reports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
