"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Proposal = {
  type: string;
  [key: string]: unknown;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function AdminAiConsole() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Describe what you want to optimize: curated lists, news categorization, cleanup, or sync suggestions.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");

  async function sendMessage() {
    const content = draft.trim();
    if (!content || pending) {
      return;
    }

    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setDraft("");
    setPending(true);
    setStatus("");

    const response = await fetch("/api/admin/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextMessages }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      reply?: string;
      proposals?: Proposal[];
      error?: string;
    };
    setPending(false);

    if (!response.ok) {
      setStatus(payload.error ?? "Admin AI request failed.");
      return;
    }

    setMessages((prev) => [...prev, { role: "assistant", content: payload.reply ?? "No response." }]);
    setProposals(payload.proposals ?? []);
  }

  async function applyProposal(proposal: Proposal) {
    setStatus("Applying proposal...");
    const response = await fetch("/api/admin/ai/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposal }),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setStatus(payload.error ?? "Failed to apply proposal.");
      return;
    }

    setStatus("Proposal applied and logged to audit log.");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin AI Assistant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950/70 p-3">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className="rounded-md border border-zinc-800 bg-zinc-900 p-3 text-sm">
                <p className="mb-1 text-[11px] uppercase tracking-wide text-zinc-500">{message.role}</p>
                <p className="whitespace-pre-wrap text-zinc-200">{message.content}</p>
              </div>
            ))}
          </div>

          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Example: propose 3 featured RPG collections and cleanup expired EU deals."
            className="min-h-24"
            maxLength={3000}
          />
          <div className="flex justify-end">
            <Button onClick={() => void sendMessage()} disabled={pending || !draft.trim()}>
              {pending ? "Thinking..." : "Send"}
            </Button>
          </div>
          {status ? <p className="text-sm text-zinc-400">{status}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proposed Actions (Preview)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {proposals.length === 0 ? <p className="text-sm text-zinc-500">No proposals yet.</p> : null}
          {proposals.map((proposal, index) => (
            <div key={`${proposal.type}-${index}`} className="space-y-2 rounded-md border border-zinc-800 bg-zinc-950/70 p-3">
              <pre className="overflow-x-auto text-xs text-zinc-300">{JSON.stringify(proposal, null, 2)}</pre>
              <Button variant="secondary" onClick={() => void applyProposal(proposal)}>
                Apply
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
