import crypto from "node:crypto";
import { chromium } from "playwright-core";
import type { BrowserContext, Page } from "playwright-core";
import type { ModelDefinitionConfig } from "../config/types.models.js";
import { getHeadersWithAuth } from "../browser/cdp.helpers.js";
import {
  launchOpenClawChrome,
  stopOpenClawChrome,
  getChromeWebSocketUrl,
  type RunningChrome,
} from "../browser/chrome.js";
import { resolveBrowserConfig, resolveProfile } from "../browser/config.js";
import { loadConfig } from "../config/io.js";

export interface ChatGPTWebClientOptions {
  accessToken: string;
  cookie?: string;
  userAgent?: string;
}

export interface ChatGPTConversation {
  id: string;
  title: string;
  created_at?: number;
}

/**
 * ChatGPT Web Client using Playwright browser context
 */
export class ChatGPTWebClientBrowser {
  private accessToken: string;
  private cookie: string;
  private userAgent: string;
  private baseUrl = "https://chatgpt.com";
  private browser: BrowserContext | null = null;
  private page: Page | null = null;
  private running: RunningChrome | null = null;

  constructor(options: ChatGPTWebClientOptions | string) {
    if (typeof options === "string") {
      const parsed = JSON.parse(options) as ChatGPTWebClientOptions;
      this.accessToken = parsed.accessToken;
      this.cookie = parsed.cookie || `__Secure-next-auth.session-token=${parsed.accessToken}`;
      this.userAgent = parsed.userAgent || "Mozilla/5.0";
    } else {
      this.accessToken = options.accessToken;
      this.cookie = options.cookie || `__Secure-next-auth.session-token=${options.accessToken}`;
      this.userAgent = options.userAgent || "Mozilla/5.0";
    }
  }

  private async ensureBrowser() {
    if (this.browser && this.page) {
      return { browser: this.browser, page: this.page };
    }

    const rootConfig = loadConfig();
    const browserConfig = resolveBrowserConfig(rootConfig.browser, rootConfig);
    const profile = resolveProfile(browserConfig, browserConfig.defaultProfile);
    if (!profile) {
      throw new Error(`Could not resolve browser profile '${browserConfig.defaultProfile}'`);
    }

    if (browserConfig.attachOnly) {
      console.log(`[ChatGPT Web Browser] Connecting to existing Chrome at ${profile.cdpUrl}`);
      
      let wsUrl: string | null = null;
      for (let i = 0; i < 10; i++) {
        wsUrl = await getChromeWebSocketUrl(profile.cdpUrl, 2000);
        if (wsUrl) {
          break;
        }
        await new Promise((r) => setTimeout(r, 500));
      }

      if (!wsUrl) {
        throw new Error(
          `Failed to connect to Chrome at ${profile.cdpUrl}. ` +
          `Make sure Chrome is running in debug mode`
        );
      }

      this.browser = await chromium.connectOverCDP(wsUrl, {
        headers: getHeadersWithAuth(wsUrl),
      }).then((b) => b.contexts()[0]);

      const pages = this.browser.pages();
      let chatgptPage = pages.find(p => p.url().includes('chatgpt.com'));
      
      if (chatgptPage) {
        console.log(`[ChatGPT Web Browser] Found existing ChatGPT page: ${chatgptPage.url()}`);
        this.page = chatgptPage;
      } else {
        console.log(`[ChatGPT Web Browser] No ChatGPT page found, creating new one...`);
        this.page = await this.browser.newPage();
        await this.page.goto('https://chatgpt.com/', { waitUntil: 'domcontentloaded' });
      }
      
      console.log(`[ChatGPT Web Browser] Connected to existing Chrome successfully`);
    } else {
      this.running = await launchOpenClawChrome(browserConfig, profile);

      const cdpUrl = `http://127.0.0.1:${this.running.cdpPort}`;
      let wsUrl: string | null = null;

      for (let i = 0; i < 10; i++) {
        wsUrl = await getChromeWebSocketUrl(cdpUrl, 2000);
        if (wsUrl) {
          break;
        }
        await new Promise((r) => setTimeout(r, 500));
      }

      if (!wsUrl) {
        throw new Error(`Failed to resolve Chrome WebSocket URL from ${cdpUrl}`);
      }

      this.browser = await chromium.connectOverCDP(wsUrl, {
        headers: getHeadersWithAuth(wsUrl),
      }).then((b) => b.contexts()[0]);

      this.page = this.browser.pages()[0] || (await this.browser.newPage());
    }

    const cookies = this.cookie.split(";").map((c) => {
      const [name, ...valueParts] = c.trim().split("=");
      return {
        name: name.trim(),
        value: valueParts.join("=").trim(),
        domain: ".chatgpt.com",
        path: "/",
      };
    });

    await this.browser.addCookies(cookies);

    return { browser: this.browser, page: this.page };
  }

  async init() {
    await this.ensureBrowser();
  }

  async chatCompletions(params: {
    conversationId?: string;
    parentMessageId?: string;
    message: string;
    model?: string;
    signal?: AbortSignal;
  }): Promise<ReadableStream<Uint8Array>> {
    const { page } = await this.ensureBrowser();

    const conversationId = params.conversationId || crypto.randomUUID();
    const parentMessageId = params.parentMessageId || crypto.randomUUID();
    const messageId = crypto.randomUUID();

    console.log(`[ChatGPT Web Browser] Sending message`);
    console.log(`[ChatGPT Web Browser] Conversation ID: ${conversationId}`);
    console.log(`[ChatGPT Web Browser] Model: ${params.model || "gpt-4"}`);

    const body = {
      action: "next",
      messages: [
        {
          id: messageId,
          author: { role: "user" },
          content: {
            content_type: "text",
            parts: [params.message],
          },
        },
      ],
      parent_message_id: parentMessageId,
      model: params.model || "gpt-4",
      timezone_offset_min: new Date().getTimezoneOffset(),
      conversation_id: conversationId === "new" ? undefined : conversationId,
      history_and_training_disabled: false,
    };

    const responseData = await page.evaluate(
      async ({ body }) => {
        const res = await fetch("https://chatgpt.com/backend-api/conversation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errorText = await res.text();
          return { ok: false, status: res.status, error: errorText };
        }

        const reader = res.body?.getReader();
        if (!reader) {
          return { ok: false, status: 500, error: "No response body" };
        }

        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
        }

        return { ok: true, data: fullText };
      },
      { body },
    );

    console.log(`[ChatGPT Web Browser] Message response: ${responseData.ok ? 200 : responseData.status}`);

    if (!responseData.ok) {
      console.error(`[ChatGPT Web Browser] Message failed: ${responseData.status} - ${responseData.error}`);

      if (responseData.status === 401) {
        throw new Error(
          "Authentication failed. Please re-run onboarding to refresh your ChatGPT session."
        );
      }
      throw new Error(`ChatGPT API error: ${responseData.status}`);
    }

    console.log(`[ChatGPT Web Browser] Response data length: ${responseData.data?.length || 0} bytes`);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(responseData.data));
        controller.close();
      },
    });

    return stream;
  }

  async close() {
    if (this.running) {
      await stopOpenClawChrome(this.running);
      this.running = null;
    }
    this.browser = null;
    this.page = null;
  }

  async discoverModels(): Promise<ModelDefinitionConfig[]> {
    return [
      {
        id: "gpt-4",
        name: "GPT-4",
        provider: "chatgpt-web",
        api: "chatgpt-web",
        contextWindow: 8192,
        maxOutputTokens: 4096,
      },
      {
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        provider: "chatgpt-web",
        api: "chatgpt-web",
        contextWindow: 128000,
        maxOutputTokens: 4096,
      },
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        provider: "chatgpt-web",
        api: "chatgpt-web",
        contextWindow: 16385,
        maxOutputTokens: 4096,
      },
    ];
  }
}
