import { getOpenAIEnv, isOpenAIConfigured } from "@/src/lib/env";

export type ChatMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | {
      role: "user";
      content: Array<
        | { type: "text"; text: string }
        | {
            type: "file";
            file: { filename: string; file_data: string };
          }
      >;
    };

export async function createJsonCompletion<T>(
  messages: ChatMessage[],
  parse: (value: unknown) => T,
): Promise<T> {
  if (!isOpenAIConfigured()) {
    throw new Error("OPENAI_NOT_CONFIGURED");
  }

  const { apiKey, model } = getOpenAIEnv();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed: ${detail.slice(0, 240)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  return parse(JSON.parse(content));
}
