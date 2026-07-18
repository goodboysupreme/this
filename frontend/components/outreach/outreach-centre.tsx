"use client";

import { useCallback, useEffect, useState } from "react";
import { ListChecks, Mail, Users, FileText } from "lucide-react";
import type { Campaign, OutreachContact, OutreachTemplate } from "@/lib/types";
import { getCampaigns, getOutreachContacts, getOutreachTemplates } from "@/lib/api";
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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Cold Email Centre</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Manage referral and alumni outreach: import contacts, write templates, and send safe
          batch campaigns through your own SMTP. Dry-run mode is on by default, so nothing goes
          out by accident.
        </p>
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap gap-2 rounded-lg border border-line bg-surface p-1.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150",
                tab === t.key
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:bg-line/50 hover:text-ink"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

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
