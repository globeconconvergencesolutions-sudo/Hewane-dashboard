"use client";

import { useEffect, useState } from "react";
import { ContactsTable } from "@/components/dashboard/contacts-table";
import { Contact } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/contacts");
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
        toast({
          title: "Success",
          description: `Loaded ${data.length} contacts`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load contacts",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[v0] Failed to fetch contacts:", error);
      toast({
        title: "Error",
        description: "An error occurred while loading contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      if (res.ok) {
        toast({
          title: "Success",
          description: "Contacts synced to Google Sheets",
        });
        fetchContacts();
      } else {
        toast({
          title: "Error",
          description: "Failed to sync contacts",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[v0] Sync error:", error);
      toast({
        title: "Error",
        description: "An error occurred during sync",
        variant: "destructive",
      });
    }
  };

  const handleValidate = async () => {
    try {
      const res = await fetch("/api/contacts/validate", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          toast({
            title: "Success",
            description: "All contacts are valid",
          });
        } else {
          toast({
            title: "Validation Issues",
            description: `Found ${data.errors.length} error(s)`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("[v0] Validation error:", error);
      toast({
        title: "Error",
        description: "Validation failed",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Contacts</h1>
        <p className="text-slate-600 mt-2">Manage your contact list and sync with Google Sheets</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <ContactsTable
          data={contacts}
          onRefresh={fetchContacts}
          onSync={handleSync}
          onValidate={handleValidate}
          isLoading={loading}
        />
      )}
    </div>
  );
}
