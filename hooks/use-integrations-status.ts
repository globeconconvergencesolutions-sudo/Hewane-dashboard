"use client";

import { useCallback, useEffect, useState } from "react";
import type { IntegrationsStatus } from "@/lib/app-config";

export function useIntegrationsStatus() {
  const [integrations, setIntegrations] = useState<IntegrationsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyingMeta, setVerifyingMeta] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/status");
      if (!res.ok) throw new Error("Could not load integration status");
      setIntegrations((await res.json()) as IntegrationsStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load integrations");
      setIntegrations(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyMetaConnection = useCallback(async () => {
    setVerifyingMeta(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/meta/verify", { method: "POST" });
      const payload = (await res.json()) as {
        error?: string;
        details?: string;
        message?: string;
        meta?: IntegrationsStatus["meta"];
      };

      if (payload.meta) {
        setIntegrations((current) =>
          current ? { ...current, meta: payload.meta! } : current
        );
      }

      if (!res.ok) {
        throw new Error(payload.details || payload.error || "Meta connection test failed");
      }

      await refresh();
      return payload.message ?? "Meta WhatsApp connection verified.";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Meta connection test failed";
      setError(message);
      throw err;
    } finally {
      setVerifyingMeta(false);
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    integrations,
    loading,
    verifyingMeta,
    error,
    refresh,
    verifyMetaConnection,
  };
}
