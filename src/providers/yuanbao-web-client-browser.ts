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

export interface YuanbaoWebClientOptions {
  cookie: string;
  userAgent?: string;
}

/**
 * Yuanbao Web Client using CDP attach (same pattern as Qwen/ChatGPT)
 * 使用 DOM 模拟发送消息，因 fetch 会返回 404
 */
export class YuanbaoWebClientBrowser {
  private cookie: string;
  private userAgent: string;
  private baseUrl = "https://yuanbao.tencent.com";
  private chatUrl = "https://yuanbao.tencent.com/chat/na";
  private browser: BrowserContext | null = null;
  private page: Page | null = null;
  private running: RunningChrome | null = null;

  constructor(options: YuanbaoWebClientOptions | string) {
    if (typeof options === "string") {
      try {
        const parsed = JSON.parse(options) as YuanbaoWebClientOptions;
        this.cookie = parsed.cookie;
        this.userAgent = parsed.userAgent || "Mozilla/5.0";
      } catch {
        this.cookie = options;
        this.userAgent = "Mozilla/5.0";
      }
    } else {
      this.cookie = options.cookie;
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
      let wsUrl: string | null = null;
      for (let i = 0; i < 10; i++) {
        wsUrl = await getChromeWebSocketUrl(profile.cdpUrl, 2000);
        if (wsUrl) break;
        await new Promise((r) => setTimeout(r, 500));
      }
      if (!wsUrl) {
        throw new Error(
          `Failed to connect to Chrome at ${profile.cdpUrl}. Make sure Chrome is running in debug mode (./start-chrome-debug.sh)`
        );
      }

      this.browser = await chromium
        .connectOverCDP(wsUrl, { headers: getHeadersWithAuth(wsUrl) })
        .then((b) => b.contexts()[0]);

      const pages = this.browser.pages();
      let yuanbaoPage = pages.find((p) => p.url().includes("yuanbao.tencent.com"));
      if (yuanbaoPage) {
        this.page = yuanbaoPage;
      } else {
        this.page = await this.browser.newPage();
        await this.page.goto(this.chatUrl, { waitUntil: "domcontentloaded" });
      }
    } else {
      this.running = await launchOpenClawChrome(browserConfig, profile);
      const cdpUrl = `http://127.0.0.1:${this.running.cdpPort}`;
      let wsUrl: string | null = null;
      for (let i = 0; i < 10; i++) {
        wsUrl = await getChromeWebSocketUrl(cdpUrl, 2000);
        if (wsUrl) break;
        await new Promise((r) => setTimeout(r, 500));
      }
      if (!wsUrl) throw new Error(`Failed to resolve Chrome WebSocket URL from ${cdpUrl}`);

      this.browser = await chromium
        .connectOverCDP(wsUrl, { headers: getHeadersWithAuth(wsUrl) })
        .then((b) => b.contexts()[0]);
      this.page = this.browser.pages()[0] || (await this.browser.newPage());
    }

    if (this.cookie.trim()) {
      const cookies = this.cookie.split(";").map((c) => {
        const [name, ...valueParts] = c.trim().split("=");
        return {
          name: name.trim(),
          value: valueParts.join("=").trim(),
          domain: ".tencent.com",
          path: "/",
        };
      });
      await this.browser.addCookies(cookies);
    }

    return { browser: this.browser, page: this.page };
  }

  async init() {
    await this.ensureBrowser();
  }

  async chatCompletions(params: {
    conversationId?: string;
    message: string;
    model: string;
    signal?: AbortSignal;
  }): Promise<ReadableStream<Uint8Array>> {
    const { page } = await this.ensureBrowser();

    const sent = await page.evaluate(
      async (msg) => {
        const sel = 'textarea, [contenteditable="true"], [data-placeholder], input[type="text"]';
        const ed = document.querySelector(sel);
        if (!ed) return false;
        ed.focus();
        if (ed.tagName === "TEXTAREA" || ed.tagName === "INPUT") {
          (ed as HTMLTextAreaElement).value = msg;
          ed.dispatchEvent(new Event("input", { bubbles: true }));
        } else {
          (ed as HTMLElement).textContent = msg;
          ed.dispatchEvent(new Event("input", { bubbles: true }));
        }
        const btn =
          document.querySelector('button[type="submit"]') ||
          document.querySelector('button[aria-label*="发送"]') ||
          document.querySelector('button[aria-label*="Send"]') ||
          document.querySelector('[class*="send"]') ||
          document.querySelector("form button");
        if (btn) {
          (btn as HTMLElement).click();
          return true;
        }
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 13, bubbles: true }));
        return true;
      },
      params.message
    );

    if (!sent) {
      throw new Error("Yuanbao: 无法找到输入框或发送按钮，请确保在 yuanbao.tencent.com/chat/... 聊天页");
    }

    await new Promise((r) => setTimeout(r, 12000));

    const extractedText = await page.evaluate(() => {
      const els = document.querySelectorAll(
        '[class*="message"], [class*="assistant"], [class*="markdown"], [data-role="assistant"]'
      );
      return els.length > 0 ? (els[els.length - 1]?.textContent ?? "").trim() : "";
    });

    if (!extractedText) {
      throw new Error("Yuanbao: 未检测到回复，请确保已登录 yuanbao.tencent.com");
    }

    const escaped = JSON.stringify(extractedText);
    const fakeSse = `data: {"text":${escaped}}\n\ndata: [DONE]\n\n`;
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(fakeSse));
        controller.close();
      },
    });
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
      { id: "hunyuan-pro", name: "Hunyuan Pro", provider: "yuanbao-web", api: "yuanbao-web", contextWindow: 32000, maxOutputTokens: 4096 },
      { id: "hunyuan-standard", name: "Hunyuan Standard", provider: "yuanbao-web", api: "yuanbao-web", contextWindow: 32000, maxOutputTokens: 4096 },
    ];
  }
}
