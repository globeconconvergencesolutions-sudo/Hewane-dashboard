import { pool } from "@/lib/db";

const CREATE_WHATSAPP_TEMPLATES_TABLE = `
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "metaTemplateName" TEXT NOT NULL UNIQUE,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'MARKETING',
  language TEXT NOT NULL DEFAULT 'en_US',
  "variableMapping" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "exampleValues" JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  "metaTemplateId" TEXT,
  "rejectionReason" TEXT,
  "submittedAt" TIMESTAMPTZ,
  "approvedAt" TIMESTAMPTZ,
  "lastSyncedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS whatsapp_templates_status_idx ON whatsapp_templates (status);
CREATE INDEX IF NOT EXISTS whatsapp_templates_user_idx ON whatsapp_templates ("userId");
`;

export async function runAppMigrations(): Promise<void> {
  await pool.query(CREATE_WHATSAPP_TEMPLATES_TABLE);
}

let migrationPromise: Promise<void> | null = null;

export function ensureAppMigrations(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = runAppMigrations().catch((error) => {
      migrationPromise = null;
      throw error;
    });
  }
  return migrationPromise;
}
