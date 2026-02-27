import type { OpenClawConfig } from "../config/config.js";
import type { RuntimeEnv } from "../runtime.js";
import type { WizardPrompter } from "../wizard/prompts.js";
import { applyAuthChoiceAnthropic } from "./auth-choice.apply.anthropic.js";
import { applyAuthChoiceApiProviders } from "./auth-choice.apply.api-providers.js";
import { applyAuthChoiceClaudeWeb } from "./auth-choice.apply.claude-web.js";
import { applyAuthChoiceChatGPTWeb } from "./auth-choice.apply.chatgpt-web.js";
import { applyAuthChoiceQwenWeb } from "./auth-choice.apply.qwen-web.js";
import { applyAuthChoiceYuanbaoWeb } from "./auth-choice.apply.yuanbao-web.js";
import { applyAuthChoiceKimiWeb } from "./auth-choice.apply.kimi-web.js";
import { applyAuthChoiceGeminiWeb } from "./auth-choice.apply.gemini-web.js";
import { applyAuthChoiceGrokWeb } from "./auth-choice.apply.grok-web.js";
import { applyAuthChoiceZWeb } from "./auth-choice.apply.z-web.js";
import { applyAuthChoiceManusApi } from "./auth-choice.apply.manus-api.js";
import { applyAuthChoiceManusWeb } from "./auth-choice.apply.manus-web.js";
import { applyAuthChoiceCopilotProxy } from "./auth-choice.apply.copilot-proxy.js";
import { applyAuthChoiceDeepseekWeb } from "./auth-choice.apply.deepseek-web.js";
import { applyAuthChoiceDoubaoWeb } from "./auth-choice.apply.doubao-web.js";
import { applyAuthChoiceGitHubCopilot } from "./auth-choice.apply.github-copilot.js";
import { applyAuthChoiceGoogleAntigravity } from "./auth-choice.apply.google-antigravity.js";
import { applyAuthChoiceGoogleGeminiCli } from "./auth-choice.apply.google-gemini-cli.js";
import { applyAuthChoiceMiniMax } from "./auth-choice.apply.minimax.js";
import { applyAuthChoiceOAuth } from "./auth-choice.apply.oauth.js";
import { applyAuthChoiceOpenAI } from "./auth-choice.apply.openai.js";
import { applyAuthChoiceQwenPortal } from "./auth-choice.apply.qwen-portal.js";
import { applyAuthChoiceVllm } from "./auth-choice.apply.vllm.js";
import { applyAuthChoiceXAI } from "./auth-choice.apply.xai.js";
import type { AuthChoice } from "./onboard-types.js";

export type ApplyAuthChoiceParams = {
  authChoice: AuthChoice;
  config: OpenClawConfig;
  prompter: WizardPrompter;
  runtime: RuntimeEnv;
  agentDir?: string;
  setDefaultModel: boolean;
  agentId?: string;
  opts?: {
    tokenProvider?: string;
    token?: string;
    cloudflareAiGatewayAccountId?: string;
    cloudflareAiGatewayGatewayId?: string;
    cloudflareAiGatewayApiKey?: string;
    xaiApiKey?: string;
    siliconflowGlobalApiKey?: string;
    siliconflowCnApiKey?: string;
    deepseekWebCookie?: string;
    doubaoWebCookie?: string;
    chatgptWebCookie?: string;
    qwenWebCookie?: string;
    yuanbaoWebCookie?: string;
    kimiWebCookie?: string;
    geminiWebCookie?: string;
    grokWebCookie?: string;
    zWebCookie?: string;
    manusWebCookie?: string;
    manusApiKey?: string;
  };
};

export type ApplyAuthChoiceResult = {
  config: OpenClawConfig;
  agentModelOverride?: string;
};

export async function applyAuthChoice(
  params: ApplyAuthChoiceParams,
): Promise<ApplyAuthChoiceResult> {
  const handlers: Array<(p: ApplyAuthChoiceParams) => Promise<ApplyAuthChoiceResult | null>> = [
    applyAuthChoiceAnthropic,
    applyAuthChoiceVllm,
    applyAuthChoiceOpenAI,
    applyAuthChoiceOAuth,
    applyAuthChoiceApiProviders,
    applyAuthChoiceMiniMax,
    applyAuthChoiceGitHubCopilot,
    applyAuthChoiceGoogleAntigravity,
    applyAuthChoiceGoogleGeminiCli,
    applyAuthChoiceCopilotProxy,
    applyAuthChoiceQwenPortal,
    applyAuthChoiceDeepseekWeb,
    applyAuthChoiceDoubaoWeb,
    applyAuthChoiceClaudeWeb,
    applyAuthChoiceChatGPTWeb,
    applyAuthChoiceQwenWeb,
    applyAuthChoiceYuanbaoWeb,
    applyAuthChoiceKimiWeb,
    applyAuthChoiceGeminiWeb,
    applyAuthChoiceGrokWeb,
    applyAuthChoiceZWeb,
    applyAuthChoiceManusApi,
    applyAuthChoiceManusWeb,
    applyAuthChoiceXAI,
  ];

  for (const handler of handlers) {
    const result = await handler(params);
    if (result) {
      return result;
    }
  }

  return { config: params.config };
}
