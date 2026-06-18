"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signOut } from "next-auth/react";
import { TIMEZONE } from "@/lib/constants";

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("Hewane School of Music");
  const [adminEmail, setAdminEmail] = useState("admin@hewaneschoolofmusic.com");
  const [timezone, setTimezone] = useState(TIMEZONE);
  const [notifyOnComplete, setNotifyOnComplete] = useState(true);
  const [notifyOnError, setNotifyOnError] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  const handleSaveSettings = async () => {
    setSaveLoading(true);
    // TODO: Save to backend
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaveLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-2">Configure your dashboard and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Organization information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Organization Name</label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">WhatsApp Business Number</label>
                <Input
                  value="+254712345678"
                  disabled
                  className="mt-1 bg-slate-100"
                />
                <p className="text-xs text-slate-600 mt-1">Configured by your administrator</p>
              </div>

              <div>
                <label className="text-sm font-medium">Timezone</label>
                <select className="w-full rounded-lg border border-input p-2 text-sm mt-1">
                  <option value={TIMEZONE}>{TIMEZONE}</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Admin Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Account</CardTitle>
              <CardDescription>Your login credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Admin Email</label>
                <Input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Change Password</label>
                <Input
                  type="password"
                  placeholder="New password"
                  className="mt-1"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">Enable Two-Factor Authentication</span>
              </label>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Email notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOnComplete}
                  onChange={(e) => setNotifyOnComplete(e.target.checked)}
                />
                <span className="text-sm">Notify when broadcast completes</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOnError}
                  onChange={(e) => setNotifyOnError(e.target.checked)}
                />
                <span className="text-sm">Notify on sync or broadcast errors</span>
              </label>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleSaveSettings} disabled={saveLoading}>
              {saveLoading ? "Saving..." : "Save Settings"}
            </Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-slate-600">Version</p>
                <p className="font-medium">1.0.0</p>
              </div>
              <div>
                <p className="text-slate-600">Last Updated</p>
                <p className="font-medium">June 18, 2026</p>
              </div>
              <div>
                <p className="text-slate-600">Support</p>
                <p className="font-medium">support@hewane.com</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="destructive"
                className="w-full"
                onClick={async () => {
                  await signOut({ redirect: true, redirectUrl: "/login" });
                }}
              >
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
