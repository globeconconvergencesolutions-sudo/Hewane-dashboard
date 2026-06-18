"use client";

import { toast as sonnerToast } from "sonner";

export function useToast() {
  return {
    toast: (options: {
      title: string;
      description?: string;
      variant?: "default" | "destructive";
    }) => {
      const { title, description, variant } = options;
      
      if (variant === "destructive") {
        sonnerToast.error(title, { description });
      } else {
        sonnerToast.success(title, { description });
      }
    },
  };
}
