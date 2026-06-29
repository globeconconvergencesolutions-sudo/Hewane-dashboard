"use client";

import { useCallback, useEffect, useState } from "react";
import type { IntegrationsStatus } from "@/lib/app-config";

export function useIntegrationsStatus() {
  const [integrations, setIntegrations] = useState<IntegrationsStatus | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { integrations, loading, error, refresh };
}
