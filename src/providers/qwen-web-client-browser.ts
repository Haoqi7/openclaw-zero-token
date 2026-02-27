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

export interface QwenWebClientOptions {
  sessionToken: string;
  cookie?: string;
  userAgent?: string;
}

/**
 * Qwen Web Client using Playwright browser context
 */
export class QwenWebClientBrowser {
  private sessionToken: string;
  private cookie: string;
  private userAgent: string;
  private baseUrl = "https://chat.qwen.ai";
  private browser: BrowserContext | null = null;
  private page: Page | null = null;
  private running: RunningChrome | null = null;

  constructor(options: QwenWebClientOptions | string) {
    if (typeof options === "string") {
      const parsed = JSON.parse(options) as QwenWebClientOptions;
      this.sessionToken = parsed.sessionToken;
      this.cookie = parsed.cookie || `qwen_session=${parsed.sessionToken}`;
      this.userAgent = parsed.userAgent || "Mozilla/5.0";
    } else {
      this.sessionToken = options.sessionToken;
      this.cookie = options.cookie || `qwen_session=${options.sessionToken}`;
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
      console.log(`[Qwen Web Browser] Connecting to existing Chrome at ${profile.cdpUrl}`);
      
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
      let qwenPage = pages.find(p => p.url().includes('qwen.ai'));
      
      if (qwenPage) {
        console.log(`[Qwen Web Browser] Found existing Qwen page`);
        this.page = qwenPage;
      } else {
        console.log(`[Qwen Web Browser] Creating new page`);
        this.page = await this.browser.newPage();
        await this.page.goto('https://chat.qwen.ai/', { waitUntil: 'domcontentloaded' });
      }
      
      console.log(`[Qwen Web Browser] Connected successfully`);
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
        domain: ".qwen.ai",
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
    message: string;
    model?: string;
    signal?: AbortSignal;
  }): Promise<ReadableStream<Uint8Array>> {
    const { page } = await this.ensureBrowser();

    const conversationId = params.conversationId || crypto.randomUUID();

    console.log(`[Qwen Web Browser] Sending message`);
    console.log(`[Qwen Web Browser] Conversation ID: ${conversationId}`);
    console.log(`[Qwen Web Browser] Model: ${params.model || "qwen-max"}`);
    console.log(`[Qwen Web Browser] Message: ${params.message.substring(0, 100)}...`);

    // Try different API endpoints and formats
    const apiEndpoints = [
      "/api/chat/completions",
      "/api/v1/chat/completions",
      "/api/chat",
    ];

    let responseData: any = null;
    let successEndpoint = "";

    for (const endpoint of apiEndpoints) {
      console.log(`[Qwen Web Browser] Trying endpoint: ${endpoint}`);
      
      const body = {
        model: params.model || "qwen-max",
        messages: [
          {
            role: "user",
            content: params.message,
          },
        ],
        stream: true,
      };

      responseData = await page.evaluate(
        async ({ baseUrl, endpoint, body }) => {
          try {
            const url = `${baseUrl}${endpoint}`;
            console.log(`[Browser] Fetching: ${url}`);
            
            const res = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
              },
              body: JSON.stringify(body),
            });

            console.log(`[Browser] Response status: ${res.status}`);
            console.log(`[Browser] Response headers:`, Object.fromEntries(res.headers.entries()));

            if (!res.ok) {
              const errorText = await res.text();
              console.log(`[Browser] Error response: ${errorText.substring(0, 500)}`);
              return { ok: false, status: res.status, error: errorText, endpoint };
            }

            const reader = res.body?.getReader();
            if (!reader) {
              return { ok: false, status: 500, error: "No response body", endpoint };
            }

            const decoder = new TextDecoder();
            let fullText = "";
            let chunkCount = 0;

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              fullText += chunk;
              chunkCount++;
              if (chunkCount <= 3) {
                console.log(`[Browser] Chunk ${chunkCount}: ${chunk.substring(0, 200)}`);
              }
            }

            console.log(`[Browser] Total chunks: ${chunkCount}, Total length: ${fullText.length}`);
            return { ok: true, data: fullText, endpoint };
          } catch (err) {
            console.error(`[Browser] Fetch error:`, err);
            return { ok: false, status: 500, error: String(err), endpoint };
          }
        },
        { baseUrl: this.baseUrl, endpoint, body },
      );

      if (responseData.ok) {
        successEndpoint = endpoint;
        console.log(`[Qwen Web Browser] Success with endpoint: ${endpoint}`);
        break;
      } else {
        console.log(`[Qwen Web Browser] Failed with endpoint ${endpoint}: ${responseData.status} - ${responseData.error?.substring(0, 200)}`);
      }
    }

    if (!responseData || !responseData.ok) {
      console.error(`[Qwen Web Browser] All endpoints failed`);
      console.error(`[Qwen Web Browser] Last error: ${responseData?.status} - ${responseData?.error}`);

      if (responseData?.status === 401 || responseData?.status === 403) {
        throw new Error(
          "Authentication failed. Please re-run onboarding to refresh your Qwen session."
        );
      }
      throw new Error(`Qwen API error: ${responseData?.status || 'unknown'} - ${responseData?.error || 'All endpoints failed'}`);
    }

    console.log(`[Qwen Web Browser] Response data length: ${responseData.data?.length || 0} bytes`);
    console.log(`[Qwen Web Browser] Response preview: ${responseData.data?.substring(0, 300) || 'empty'}`);

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
        id: "qwen-max",
        name: "Qwen Max",
        provider: "qwen-web",
        api: "qwen-web",
        contextWindow: 8192,
        maxOutputTokens: 4096,
      },
      {
        id: "qwen-plus",
        name: "Qwen Plus",
        provider: "qwen-web",
        api: "qwen-web",
        contextWindow: 32768,
        maxOutputTokens: 4096,
      },
      {
        id: "qwen-turbo",
        name: "Qwen Turbo",
        provider: "qwen-web",
        api: "qwen-web",
        contextWindow: 8192,
        maxOutputTokens: 4096,
      },
    ];
  }
}
