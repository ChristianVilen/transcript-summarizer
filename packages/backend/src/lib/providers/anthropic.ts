import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";
import type { AiProvider } from "./index.js";

export function createAnthropicProvider(): AiProvider {
  const client = new Anthropic({ apiKey: config.ai.anthropicApiKey! });

  return {
    async complete(system, user, maxTokens) {
      const response = await client.messages.create({
        model: config.ai.anthropicModel,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      });
      const block = response.content[0];
      return block.type === "text" ? block.text : "";
    },

    async stream(system, user, maxTokens, onChunk) {
      let result = "";
      const stream = await client.messages.create({
        model: config.ai.anthropicModel,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
        stream: true,
      });
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          result += event.delta.text;
          await onChunk(event.delta.text);
        }
      }
      return result;
    },
  };
}
