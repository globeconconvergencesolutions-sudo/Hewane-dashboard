import { TIMEZONE } from "@/lib/constants";

export type DashboardSettings = {
  companyName: string;
  timezone: string;
  notifyOnComplete: boolean;
  notifyOnError: boolean;
};

const STORAGE_KEY = "hewane-dashboard-settings";

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  companyName: "Hewane School of Music",
  timezone: TIMEZONE,
  notifyOnComplete: true,
  notifyOnError: true,
};

export function loadDashboardSettings(): DashboardSettings {
  if (typeof window === "undefined") return DEFAULT_DASHBOARD_SETTINGS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DASHBOARD_SETTINGS;
    return { ...DEFAULT_DASHBOARD_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DASHBOARD_SETTINGS;
  }
}

export function saveDashboardSettings(settings: DashboardSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
