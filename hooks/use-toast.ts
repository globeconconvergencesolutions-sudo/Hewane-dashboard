"use client";

import { useCallback, useMemo } from "react";
import { toast as sonnerToast } from "sonner";

type ToastOptions = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    const { title, description, variant } = options;

    if (variant === "destructive") {
      sonnerToast.error(title, { description });
    } else {
      sonnerToast.success(title, { description });
    }
  }, []);

  return useMemo(() => ({ toast }), [toast]);
}
