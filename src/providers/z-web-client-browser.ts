import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";

export interface ZWebClientOptions {
  cookie: string;
  userAgent: string;
  headless?: boolean;
}

export class ZWebClientBrowser {
  private options: ZWebClientOptions;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private initialized = false;

  constructor(options: ZWebClientOptions) {
    this.options = options;
  }

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.browser = await chromium.launch({
      headless: this.options.headless ?? true,
    });

    this.context = await this.browser.newContext({
      userAgent: this.options.userAgent,
    });

    await this.context.addCookies(
      this.options.cookie.split(";").map((cookie) => {
        const [name, ...valueParts] = cookie.trim().split("=");
        return {
          name: name.trim(),
          value: valueParts.join("=").trim(),
          domain: ".z.ai",
          path: "/",
        };
      }),
    );

    this.page = await this.context.newPage();
    await this.page.goto("https://chat.z.ai", { waitUntil: "domcontentloaded" });

    this.initialized = true;
  }

  async chatCompletions(params: {
    conversationId?: string;
    message: string;
    model: string;
    signal?: AbortSignal;
  }): Promise<ReadableStream<Uint8Array>> {
    if (!this.page) {
      throw new Error("ZWebClientBrowser not initialized");
    }

    const { conversationId, message, model } = params;

    const streamResponse = await this.page.evaluate(
      async ({ conversationId, message, model }) => {
        const response = await fetch("https://chat.z.ai/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversation_id: conversationId || undefined,
            message,
            model,
          }),
        });

        if (!response.ok) {
          throw new Error(`Z API error: ${response.status} ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const chunks: number[][] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(Array.from(value));
        }

        return chunks;
      },
      { conversationId, message, model },
    );

    let index = 0;
    return new ReadableStream({
      pull(controller) {
        if (index < streamResponse.length) {
          controller.enqueue(new Uint8Array(streamResponse[index]));
          index++;
        } else {
          controller.close();
        }
      },
    });
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.initialized = false;
  }
}
