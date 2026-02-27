type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
};

type ChatTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

type ChatCompletionInput = {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: ChatMessage[];
  tools?: ChatTool[];
  temperature?: number;
};

export async function createChatCompletion(input: ChatCompletionInput) {
  const endpoint = `${input.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: input.model,
      messages: input.messages,
      tools: input.tools,
      tool_choice: input.tools?.length ? "auto" : undefined,
      temperature: input.temperature ?? 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI provider request failed with ${response.status}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: ChatMessage }>;
  };
  const message = json.choices?.[0]?.message;
  if (!message) {
    throw new Error("AI provider returned an empty response");
  }

  return message;
}

export type { ChatMessage, ChatTool };
