import OpenAI from "openai";
import { config } from "../config.js";
import type { AiProvider } from "./index.js";

export function createLmStudioProvider(): AiProvider {
  const client = new OpenAI({
    baseURL: `${config.ai.lmStudioUrl}/v1`,
    apiKey: "lm-studio",
  });

  return {
    async complete(system, user, maxTokens) {
      const completion = await client.chat.completions.create({
        model: config.ai.lmStudioModel,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      return completion.choices[0]?.message?.content ?? "";
    },

    async stream(system, user, maxTokens, onChunk) {
      let result = "";
      const stream = await client.chat.completions.create({
        model: config.ai.lmStudioModel,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        stream: true,
      });
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) {
          result += text;
          await onChunk(text);
        }
      }
      return result;
    },
  };
}
