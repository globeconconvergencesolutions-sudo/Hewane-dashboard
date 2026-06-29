"use client";

import { useEffect, useState } from "react";
import type { ContactValidationReport } from "@/lib/validation";
import { loadValidationReport } from "@/lib/validation-storage";

/** Keeps validation report in sync across dashboard pages in the same tab. */
export function useValidationReport() {
  const [report, setReport] = useState<ContactValidationReport | null>(null);

  useEffect(() => {
    setReport(loadValidationReport());

    const refresh = () => setReport(loadValidationReport());
    window.addEventListener("hewane-validation-updated", refresh);
    return () => window.removeEventListener("hewane-validation-updated", refresh);
  }, []);

  return report;
}
