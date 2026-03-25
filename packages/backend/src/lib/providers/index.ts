import { config } from "../config.js";
import { createAnthropicProvider } from "./anthropic.js";
import { createLmStudioProvider } from "./lm-studio.js";

export interface AiProvider {
  complete(system: string, user: string, maxTokens: number): Promise<string>;
  stream(
    system: string,
    user: string,
    maxTokens: number,
    onChunk: (text: string) => Promise<void> | void,
  ): Promise<string>;
}

function initProvider(): AiProvider {
  switch (config.ai.provider) {
    case "anthropic":
      return createAnthropicProvider();
    case "lm-studio":
      return createLmStudioProvider();
  }
}

export const provider = initProvider();
