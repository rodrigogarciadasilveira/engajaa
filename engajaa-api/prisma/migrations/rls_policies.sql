-- Ativar RLS em todas as tabelas de negócio
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InstagramAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IgPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScheduledPost" ENABLE ROW LEVEL SECURITY;

-- Policy: usuário só acessa registros do próprio tenant
CREATE POLICY tenant_isolation ON "User"
  USING ("tenantId"::text = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation ON "InstagramAccount"
  USING ("tenantId"::text = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation ON "IgPost"
  USING ("tenantId"::text = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation ON "ScheduledPost"
  USING ("tenantId"::text = current_setting('app.tenant_id', true));
