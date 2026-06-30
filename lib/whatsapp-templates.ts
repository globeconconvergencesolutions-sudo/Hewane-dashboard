import { eq, desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { ensureAppMigrations } from "@/lib/db/migrate-app";
import { whatsappTemplates } from "@/lib/db/schema";
import {
  createMessageTemplate,
  getMessageTemplateByName,
  mapMetaStatusToLocal,
} from "@/lib/meta-whatsapp";
import {
  buildDefaultExampleValues,
  buildDefaultVariableMapping,
  slugifyMetaTemplateName,
  validateTemplateDraft,
} from "@/lib/whatsapp-template-utils";
import type {
  CreateWhatsAppTemplateInput,
  UpdateWhatsAppTemplateInput,
  WhatsAppTemplateRecord,
  WhatsAppTemplateStatus,
} from "@/lib/whatsapp-template-types";
import logger from "@/lib/logger";

function rowToRecord(row: typeof whatsappTemplates.$inferSelect): WhatsAppTemplateRecord {
  return {
    id: row.id,
    userId: row.userId,
    displayName: row.displayName,
    metaTemplateName: row.metaTemplateName,
    body: row.body,
    category: row.category as WhatsAppTemplateRecord["category"],
    language: row.language,
    variableMapping: row.variableMapping ?? [],
    exampleValues: row.exampleValues ?? [],
    status: row.status as WhatsAppTemplateStatus,
    metaTemplateId: row.metaTemplateId,
    rejectionReason: row.rejectionReason,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listWhatsAppTemplates(status?: WhatsAppTemplateStatus): Promise<WhatsAppTemplateRecord[]> {
  await ensureAppMigrations();
  const rows = status
    ? await db
        .select()
        .from(whatsappTemplates)
        .where(eq(whatsappTemplates.status, status))
        .orderBy(desc(whatsappTemplates.updatedAt))
    : await db.select().from(whatsappTemplates).orderBy(desc(whatsappTemplates.updatedAt));

  return rows.map(rowToRecord);
}

export async function getWhatsAppTemplateById(id: string): Promise<WhatsAppTemplateRecord | null> {
  const rows = await db.select().from(whatsappTemplates).where(eq(whatsappTemplates.id, id)).limit(1);
  return rows[0] ? rowToRecord(rows[0]) : null;
}

export async function createWhatsAppTemplate(
  userId: string,
  input: CreateWhatsAppTemplateInput
): Promise<WhatsAppTemplateRecord> {
  await ensureAppMigrations();
  const variableMapping = input.variableMapping ?? buildDefaultVariableMapping(input.body);
  const exampleValues = buildDefaultExampleValues(variableMapping, input.exampleValues);
  const metaTemplateName = input.metaTemplateName?.trim() || slugifyMetaTemplateName(input.displayName);

  const validationError = validateTemplateDraft({
    displayName: input.displayName,
    metaTemplateName,
    body: input.body,
    exampleValues,
    variableMapping,
  });
  if (validationError) throw new Error(validationError);

  const id = `wtpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date();

  const [row] = await db
    .insert(whatsappTemplates)
    .values({
      id,
      userId,
      displayName: input.displayName.trim(),
      metaTemplateName,
      body: input.body.trim(),
      category: input.category ?? "MARKETING",
      language: input.language ?? "en_US",
      variableMapping,
      exampleValues,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return rowToRecord(row);
}

export async function updateWhatsAppTemplate(
  id: string,
  input: UpdateWhatsAppTemplateInput
): Promise<WhatsAppTemplateRecord> {
  const existing = await getWhatsAppTemplateById(id);
  if (!existing) throw new Error("Template not found.");
  if (existing.status !== "draft" && existing.status !== "rejected") {
    throw new Error("Only draft or rejected templates can be edited.");
  }

  const body = input.body?.trim() ?? existing.body;
  const variableMapping = input.variableMapping ?? buildDefaultVariableMapping(body);
  const exampleValues = buildDefaultExampleValues(variableMapping, input.exampleValues ?? existing.exampleValues);
  const metaTemplateName = input.metaTemplateName?.trim() ?? existing.metaTemplateName;
  const displayName = input.displayName?.trim() ?? existing.displayName;

  const validationError = validateTemplateDraft({
    displayName,
    metaTemplateName,
    body,
    exampleValues,
    variableMapping,
  });
  if (validationError) throw new Error(validationError);

  const [row] = await db
    .update(whatsappTemplates)
    .set({
      displayName,
      metaTemplateName,
      body,
      category: input.category ?? existing.category,
      language: input.language ?? existing.language,
      variableMapping,
      exampleValues,
      status: existing.status === "rejected" ? "draft" : existing.status,
      rejectionReason: existing.status === "rejected" ? null : existing.rejectionReason,
      updatedAt: new Date(),
    })
    .where(eq(whatsappTemplates.id, id))
    .returning();

  return rowToRecord(row);
}

export async function duplicateWhatsAppTemplate(
  userId: string,
  sourceId: string
): Promise<WhatsAppTemplateRecord> {
  const source = await getWhatsAppTemplateById(sourceId);
  if (!source) throw new Error("Template not found.");

  const baseName = `${source.metaTemplateName}_copy`;
  let metaTemplateName = baseName;
  let suffix = 2;
  while (await getWhatsAppTemplateByMetaName(metaTemplateName)) {
    metaTemplateName = `${baseName}_${suffix}`;
    suffix += 1;
  }

  return createWhatsAppTemplate(userId, {
    displayName: `${source.displayName} (copy)`,
    metaTemplateName,
    body: source.body,
    category: source.category,
    language: source.language,
    variableMapping: source.variableMapping,
    exampleValues: source.exampleValues,
  });
}

async function getWhatsAppTemplateByMetaName(name: string) {
  const rows = await db
    .select()
    .from(whatsappTemplates)
    .where(eq(whatsappTemplates.metaTemplateName, name))
    .limit(1);
  return rows[0] ?? null;
}

export async function submitWhatsAppTemplate(id: string): Promise<WhatsAppTemplateRecord> {
  const existing = await getWhatsAppTemplateById(id);
  if (!existing) throw new Error("Template not found.");
  if (existing.status !== "draft" && existing.status !== "rejected") {
    throw new Error("Only draft or rejected templates can be submitted to Meta.");
  }

  const validationError = validateTemplateDraft({
    displayName: existing.displayName,
    metaTemplateName: existing.metaTemplateName,
    body: existing.body,
    exampleValues: existing.exampleValues,
    variableMapping: existing.variableMapping,
  });
  if (validationError) throw new Error(validationError);

  const metaResult = await createMessageTemplate({
    name: existing.metaTemplateName,
    language: existing.language,
    category: existing.category,
    body: existing.body,
    exampleValues: existing.exampleValues,
  });

  const localStatus = mapMetaStatusToLocal(metaResult.status);
  const now = new Date();

  const [row] = await db
    .update(whatsappTemplates)
    .set({
      status: localStatus,
      metaTemplateId: metaResult.id,
      rejectionReason: null,
      submittedAt: now,
      approvedAt: localStatus === "approved" ? now : null,
      lastSyncedAt: now,
      updatedAt: now,
    })
    .where(eq(whatsappTemplates.id, id))
    .returning();

  logger.info("[Templates] Submitted to Meta", { id, metaTemplateName: existing.metaTemplateName });
  return rowToRecord(row);
}

export async function syncWhatsAppTemplateStatus(id: string): Promise<WhatsAppTemplateRecord> {
  const existing = await getWhatsAppTemplateById(id);
  if (!existing) throw new Error("Template not found.");
  if (existing.status === "draft") {
    throw new Error("Draft templates have not been submitted to Meta yet.");
  }

  const metaTemplate = await getMessageTemplateByName(existing.metaTemplateName);
  if (!metaTemplate) {
    throw new Error(`Meta template "${existing.metaTemplateName}" was not found. It may still be processing.`);
  }

  const localStatus = mapMetaStatusToLocal(metaTemplate.status);
  const now = new Date();

  const [row] = await db
    .update(whatsappTemplates)
    .set({
      status: localStatus,
      metaTemplateId: metaTemplate.id,
      rejectionReason: metaTemplate.rejected_reason ?? null,
      approvedAt: localStatus === "approved" ? existing.approvedAt ?? now : null,
      lastSyncedAt: now,
      updatedAt: now,
    })
    .where(eq(whatsappTemplates.id, id))
    .returning();

  return rowToRecord(row);
}

export async function syncAllPendingWhatsAppTemplates(): Promise<WhatsAppTemplateRecord[]> {
  const pendingRows = await db
    .select()
    .from(whatsappTemplates)
    .where(inArray(whatsappTemplates.status, ["pending", "paused"]))
    .orderBy(desc(whatsappTemplates.updatedAt));

  const updated: WhatsAppTemplateRecord[] = [];
  for (const row of pendingRows) {
    try {
      updated.push(await syncWhatsAppTemplateStatus(row.id));
    } catch (error) {
      logger.warn("[Templates] Sync skipped", {
        id: row.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return updated;
}

export async function getApprovedWhatsAppTemplateForBroadcast(
  id: string
): Promise<WhatsAppTemplateRecord> {
  const template = await getWhatsAppTemplateById(id);
  if (!template) throw new Error("Template not found.");
  if (template.status !== "approved") {
    throw new Error("Only Meta-approved templates can be used for broadcast.");
  }
  return template;
}
