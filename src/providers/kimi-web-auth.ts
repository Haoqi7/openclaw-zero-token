import { chromium, type Browser, type BrowserContext } from "playwright-core";

export interface KimiWebAuthResult {
  cookie: string;
  userAgent: string;
}

export interface KimiWebAuthOptions {
  onProgress?: (message: string) => void;
  openUrl?: (url: string) => Promise<boolean>;
  headless?: boolean;
}

export async function loginKimiWeb(
  options: KimiWebAuthOptions = {},
): Promise<KimiWebAuthResult> {
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

    onProgress("Navigating to Kimi...");
    await page.goto("https://kimi.moonshot.cn/", { waitUntil: "domcontentloaded" });

    onProgress("Please login in the browser window...");
    onProgress("Waiting for authentication...");

    // Wait for login completion by checking for specific cookies or localStorage
    await page.waitForFunction(
      () => {
        return document.cookie.includes("access_token") || localStorage.getItem("access_token");
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
