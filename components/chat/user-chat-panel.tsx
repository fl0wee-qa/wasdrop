"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function UserChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Ask for deals or news, for example: best RPG deals under $15, Steam freebies, or recent hardware news.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage() {
    const content = draft.trim();
    if (!content || pending) {
      return;
    }

    const nextMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setPending(true);

    const response = await fetch("/api/chat/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextMessages }),
    });

    const payload = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
    setPending(false);

    if (!response.ok) {
      setError(payload.error ?? "Failed to get AI response.");
      return;
    }

    setMessages((prev) => [...prev, { role: "assistant", content: payload.message ?? "No response." }]);
  }

  return (
    <Card className="border-white/10 bg-[#111827]/80">
      <CardHeader>
        <CardTitle>WASDrop AI Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[480px] space-y-3 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950/70 p-3">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-md p-3 text-sm ${
                message.role === "assistant"
                  ? "border border-cyan-300/20 bg-cyan-300/5 text-zinc-200"
                  : "border border-zinc-700 bg-zinc-900 text-zinc-100"
              }`}
            >
              <p className="mb-1 text-[11px] uppercase tracking-wide text-zinc-500">{message.role}</p>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about deals, freebies, or gaming news..."
            className="min-h-24"
            maxLength={2000}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">Grounded responses use WASDrop deals/news database only.</p>
            <Button onClick={() => void sendMessage()} disabled={pending || !draft.trim()}>
              {pending ? "Thinking..." : "Send"}
            </Button>
          </div>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
