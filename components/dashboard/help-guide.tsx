"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  LayoutDashboard,
  MessageSquare,
  Search,
  Send,
  Sheet,
  Sparkles,
  Users,
  Workflow,
  Wrench,
} from "lucide-react";
import { PageHero } from "@/components/dashboard/page-hero";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ADMIN_CHECKLIST,
  HELP_CATEGORIES,
  QUICK_START_STEPS,
  SYSTEM_WORKFLOW,
  filterHelpArticles,
  type HelpCategory,
  type HelpArticle,
} from "@/lib/help-content";

const QUICK_LINKS = [
  {
    title: "First-time setup",
    description: "Environment, sheets, and n8n checklist",
    href: "#admin-checklist",
    icon: Wrench,
    color: "text-[#E8B825]",
    bg: "bg-[#E8B825]/10",
  },
  {
    title: "Send a broadcast",
    description: "Step-by-step campaign guide",
    href: "/broadcast",
    icon: Send,
    color: "text-[#7D3F7E]",
    bg: "bg-[#7D3F7E]/10",
  },
  {
    title: "Manage contacts",
    description: "Sync, validate, and search",
    href: "/contacts",
    icon: Users,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    title: "Browse all FAQs",
    description: "Search answers below",
    href: "#faq",
    icon: CircleHelp,
    color: "text-emerald-700",
    bg: "bg-emerald-100",
  },
] as const;

function workflowIcon(icon: (typeof SYSTEM_WORKFLOW)[number]["icon"]) {
  switch (icon) {
    case "dashboard":
      return LayoutDashboard;
    case "n8n":
      return Workflow;
    case "sheets":
      return Sheet;
    case "whatsapp":
      return MessageSquare;
  }
}

function FaqItem({ article, defaultOpen }: { article: HelpArticle; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const categoryLabel = HELP_CATEGORIES.find((c) => c.id === article.category)?.label;

  return (
    <div className="rounded-xl border border-border/80 bg-background transition-colors hover:border-primary/15">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-start gap-3 px-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="mt-0.5 rounded-lg bg-muted/60 p-1.5 text-muted-foreground">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </span>
        <span className="flex-1">
          <span className="block font-medium text-foreground">{article.question}</span>
          {categoryLabel ? (
            <Badge variant="muted" className="mt-2">
              {categoryLabel}
            </Badge>
          ) : null}
        </span>
      </button>

      {open ? (
        <div className="border-t border-border/60 px-4 pb-4 pt-3 pl-12 text-sm text-muted-foreground">
          {article.answer.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="mb-3 last:mb-0">
              {paragraph}
            </p>
          ))}
          {article.bullets?.length ? (
            <ul className="mb-3 list-disc space-y-1.5 pl-5">
              {article.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {article.relatedLinks?.length ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {article.relatedLinks.map((link) => (
                <Button key={link.href + link.label} variant="outline" size="sm" asChild>
                  <Link href={link.href}>
                    {link.label}
                    <ExternalLink className="ml-1.5 size-3" />
                  </Link>
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function HelpGuide() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<HelpCategory | "all">("all");

  const filteredArticles = useMemo(
    () => filterHelpArticles(query, category),
    [query, category]
  );

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Staff guide"
        title="Help & Guide"
        description="Everything you need to run Hewane contacts, templates, and WhatsApp broadcasts with confidence."
        actions={
          <Button
            asChild
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <a href="mailto:support@hewane.com">Email support</a>
          </Button>
        }
      />

      {/* Search */}
      <Card className="border-primary/15 shadow-sm">
        <CardContent className="p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help… e.g. sync, broadcast, templates, login"
              className="h-11 pl-10"
              aria-label="Search help articles"
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {filteredArticles.length} article{filteredArticles.length === 1 ? "" : "s"} found
            {category !== "all" ? ` in ${HELP_CATEGORIES.find((c) => c.id === category)?.label}` : ""}
          </p>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.title}
            href={link.href}
            className="group rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
          >
            <div className={cn("mb-4 inline-flex rounded-xl p-3", link.bg, link.color)}>
              <link.icon className="size-5" />
            </div>
            <p className="font-semibold text-foreground group-hover:text-primary">{link.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
          </Link>
        ))}
      </div>

      {/* Quick start */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-[#E8B825]" />
            Quick start — your first campaign
          </CardTitle>
          <CardDescription>
            Follow these six steps from sign-in to analytics review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {QUICK_START_STEPS.map((item) => (
              <li
                key={item.step}
                className="flex gap-4 rounded-xl border border-border/60 bg-muted/20 p-4"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7D3F7E] to-[#9a4f9b] text-sm font-bold text-white">
                  {item.step}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  {item.href && item.hrefLabel ? (
                    <Button variant="link" className="mt-2 h-auto p-0" asChild>
                      <Link href={item.href}>{item.hrefLabel} →</Link>
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* System workflow */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            How the system works
          </CardTitle>
          <CardDescription>
            Data flows from your dashboard through n8n to Google Sheets and WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {SYSTEM_WORKFLOW.map((stage, index) => {
              const Icon = workflowIcon(stage.icon);
              return (
                <div key={stage.title} className="relative rounded-xl border border-border/80 p-4">
                  {index < SYSTEM_WORKFLOW.length - 1 ? (
                    <span className="absolute -right-2 top-1/2 hidden size-4 -translate-y-1/2 text-muted-foreground xl:block">
                      →
                    </span>
                  ) : null}
                  <div className="mb-3 inline-flex rounded-xl bg-primary/10 p-2.5 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <p className="font-semibold">{stage.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{stage.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Admin checklist */}
      <Card id="admin-checklist" className="border-[#E8B825]/20 bg-[#E8B825]/5 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1a1a2e]">
            <Wrench className="size-5 text-[#E8B825]" />
            Administrator checklist
          </CardTitle>
          <CardDescription>
            For IT staff deploying or maintaining the dashboard, n8n, and Google Sheets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2">
            {ADMIN_CHECKLIST.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 rounded-lg border border-[#E8B825]/20 bg-background/80 px-3 py-2.5 text-sm"
              >
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#E8B825]" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* FAQ */}
      <div id="faq" className="scroll-mt-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Frequently asked questions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Filter by topic or search above to find answers fast.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              category === "all"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted/50"
            )}
          >
            All topics
          </button>
          {HELP_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                category === cat.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted/50"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {filteredArticles.length > 0 ? (
          <div className="space-y-3">
            {filteredArticles.map((article, index) => (
              <FaqItem key={article.id} article={article} defaultOpen={index === 0 && Boolean(query)} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <CircleHelp className="mx-auto mb-3 size-10 text-muted-foreground" />
              <p className="font-medium">No articles match your search</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try different keywords or clear filters.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                }}
              >
                Clear search
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Support footer */}
      <Card className="border-primary/10 bg-gradient-to-br from-[#1a1a2e]/5 via-[#7D3F7E]/5 to-transparent shadow-sm">
        <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-foreground">Still need help?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Contact your administrator or email{" "}
              <a href="mailto:support@hewane.com" className="font-medium text-primary hover:underline">
                support@hewane.com
              </a>{" "}
              with screenshots and steps to reproduce the issue.
            </p>
          </div>
          <Button asChild className="shrink-0 bg-[#7D3F7E] hover:bg-[#6a356b]">
            <Link href="/settings">Open settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
