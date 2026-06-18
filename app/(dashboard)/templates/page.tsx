"use client";

import { useEffect, useState } from "react";
import { MessageTemplate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Copy, Trash2 } from "lucide-react";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", body: "" });

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("[v0] Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!formData.name || !formData.body) return;

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          body: formData.body,
          variables: extractVariables(formData.body),
        }),
      });

      if (res.ok) {
        setFormData({ name: "", body: "" });
        setShowForm(false);
        fetchTemplates();
      }
    } catch (error) {
      console.error("[v0] Failed to create template:", error);
    }
  };

  const extractVariables = (body: string): string[] => {
    const matches = body.match(/\{\{[^}]+\}\}/g) || [];
    return [...new Set(matches)];
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Message Templates</h1>
          <p className="text-slate-600 mt-2">Create and manage message templates</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create Template</CardTitle>
              <CardDescription>{"Use {{name}}, {{segment}}, {{1}}, {{2}} for variables"}</CardDescription>
            </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Template name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <textarea
              className="w-full min-h-32 rounded-lg border border-input p-2 font-mono text-sm"
              placeholder="Message body..."
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={handleCreateTemplate}>Create</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="text-base">{template.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4 line-clamp-3">{template.body}</p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && templates.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-slate-600">No templates created yet. Create one to get started!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
