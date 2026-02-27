import { chromium, type Browser, type BrowserContext } from "playwright-core";

export interface YuanbaoWebAuthResult {
  cookie: string;
  userAgent: string;
}

export interface YuanbaoWebAuthOptions {
  onProgress?: (message: string) => void;
  openUrl?: (url: string) => Promise<boolean>;
  headless?: boolean;
}

export async function loginYuanbaoWeb(
  options: YuanbaoWebAuthOptions = {},
): Promise<YuanbaoWebAuthResult> {
  const { onProgress = console.log, headless = false } = options;

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  try {
    onProgress("Launching browser...");
    browser = await chromium.launch({ headless });

    context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();

    onProgress("Navigating to Yuanbao...");
    await page.goto("https://yuanbao.tencent.com/chat/na", { waitUntil: "domcontentloaded" });

    onProgress("Please login in the browser window...");
    onProgress("Waiting for authentication...");

    // Wait for login completion by checking for specific cookies
    await page.waitForFunction(
      () => {
        return document.cookie.includes("uin=") || document.cookie.includes("skey=");
      },
      { timeout: 300000 }, // 5 minutes
    );

    onProgress("Login detected, capturing cookies...");

    const cookies = await context.cookies();
    const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    const userAgent = await page.evaluate(() => navigator.userAgent);

    onProgress("Authentication captured successfully!");

    return {
      cookie: cookieString,
      userAgent,
    };
  } finally {
    if (context) {
      await context.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}
