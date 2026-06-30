export type WhatsAppTemplateStatus = "draft" | "pending" | "approved" | "rejected" | "paused";

export type WhatsAppTemplateCategory = "MARKETING" | "UTILITY" | "AUTHENTICATION";

export type VariableSource = "name" | "segment" | "custom";

export type VariableMapping = {
  meta: string;
  source: VariableSource;
  customValue?: string;
};

export type WhatsAppTemplateRecord = {
  id: string;
  userId: string;
  displayName: string;
  metaTemplateName: string;
  body: string;
  category: WhatsAppTemplateCategory;
  language: string;
  variableMapping: VariableMapping[];
  exampleValues: string[];
  status: WhatsAppTemplateStatus;
  metaTemplateId: string | null;
  rejectionReason: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateWhatsAppTemplateInput = {
  displayName: string;
  metaTemplateName?: string;
  body: string;
  category?: WhatsAppTemplateCategory;
  language?: string;
  variableMapping?: VariableMapping[];
  exampleValues?: string[];
};

export type UpdateWhatsAppTemplateInput = Partial<
  Pick<
    CreateWhatsAppTemplateInput,
    "displayName" | "metaTemplateName" | "body" | "category" | "language" | "variableMapping" | "exampleValues"
  >
>;
