import { UserChatPanel } from "@/components/chat/user-chat-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env, isUserAiChatEnabled } from "@/lib/env";

export default function ChatPage() {
  const enabled = isUserAiChatEnabled();
  const configured = Boolean(env().QWEN_USER_API_KEY && env().QWEN_USER_BASE_URL);

  if (!enabled || !configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Chat Unavailable</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-300">
          <p>
            User AI chat is currently disabled. Set `AI_CHAT_ENABLED=true` and configure `QWEN_USER_API_KEY` +
            `QWEN_USER_BASE_URL` to enable it.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <UserChatPanel />;
}
