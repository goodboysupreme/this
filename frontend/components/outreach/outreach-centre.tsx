"use client";

import { useCallback, useEffect, useState } from "react";
import { Inbox, ListChecks, Mail, Users, FileText } from "lucide-react";
import type { Campaign, OutreachContact, OutreachTemplate } from "@/lib/types";
import { getCampaigns, getOutreachContacts, getOutreachTemplates } from "@/lib/api";
import { FadeIn } from "@/components/FadeIn";
import { cn } from "@/lib/utils";
import { ContactsPanel } from "./contacts-panel";
import { TemplatesPanel } from "./templates-panel";
import { CampaignsPanel } from "./campaigns-panel";
import { SendLogPanel } from "./send-log-panel";

type Tab = "contacts" | "templates" | "campaigns" | "sendlog";

const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: "contacts", label: "Contacts", icon: Users },
  { key: "templates", label: "Templates", icon: FileText },
  { key: "campaigns", label: "Campaigns", icon: Mail },
  { key: "sendlog", label: "Send Log", icon: ListChecks },
];

export function OutreachCentre() {
  const [tab, setTab] = useState<Tab>("contacts");
  const [contacts, setContacts] = useState<OutreachContact[] | null>(null);
  const [templates, setTemplates] = useState<OutreachTemplate[] | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refreshContacts = useCallback(async () => {
    setContacts(await getOutreachContacts());
  }, []);
  const refreshTemplates = useCallback(async () => {
    setTemplates(await getOutreachTemplates());
  }, []);
  const refreshCampaigns = useCallback(async () => {
    setCampaigns(await getCampaigns());
  }, []);

  useEffect(() => {
    void Promise.all([refreshContacts(), refreshTemplates(), refreshCampaigns()]).then(() =>
      setLoaded(true)
    );
  }, [refreshContacts, refreshTemplates, refreshCampaigns]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <FadeIn>
        <div className="flex flex-col items-start gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <Inbox className="h-6 w-6 text-white" />
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Cold Email Centre
          </h1>
          <p className="max-w-2xl text-zinc-500 dark:text-zinc-400">
            Manage referral and alumni outreach — import contacts, write templates, and send safe
            batch campaigns through your own SMTP. Dry-run mode is on by default so nothing goes
            out by accident.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1} className="mt-8">
        <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-200 bg-white p-1.5 dark:border-white/10 dark:bg-white/[0.03]">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      </FadeIn>

      <div className="mt-6">
        {tab === "contacts" && (
          <ContactsPanel contacts={contacts} loaded={loaded} onChanged={refreshContacts} />
        )}
        {tab === "templates" && (
          <TemplatesPanel templates={templates} loaded={loaded} onChanged={refreshTemplates} />
        )}
        {tab === "campaigns" && (
          <CampaignsPanel
            contacts={contacts}
            templates={templates}
            campaigns={campaigns}
            loaded={loaded}
            onChanged={refreshCampaigns}
          />
        )}
        {tab === "sendlog" && (
          <SendLogPanel campaigns={campaigns} contacts={contacts} loaded={loaded} />
        )}
      </div>
    </div>
  );
}
