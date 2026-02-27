# OpenClaw Zero Token

**Use AI Models Without API Tokens** - Access DeepSeek, Doubao, Claude, ChatGPT and more for free via browser login authentication.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | [简体中文](README_zh-CN.md)

---

## Overview

OpenClaw Zero Token is a fork of [OpenClaw](https://github.com/openclaw/openclaw) with a core mission: **eliminate API token costs** by capturing session credentials through browser automation, enabling free access to major AI platforms.

### Why Zero Token?

| Traditional Approach | Zero Token Approach |
|---------------------|---------------------|
| Requires purchasing API tokens | **Completely free** |
| Pay per API call | No usage limits |
| Credit card binding required | Only web login needed |
| Potential token leakage | Credentials stored locally |

### Supported Platforms

| Platform | Status | Models |
|----------|--------|--------|
| DeepSeek | ✅ **Tested** | deepseek-chat, deepseek-reasoner |
| Qwen (千问) | ✅ **Tested** | Qwen 3.5 Plus, Qwen 3.5 Turbo |
| Kimi | ✅ **Tested** | Moonshot v1 8K, 32K, 128K |
| Claude Web | ✅ **Tested** | claude-3-5-sonnet-20241022, claude-3-opus-20240229, claude-3-haiku-20240307 |
| Doubao (豆包) | ✅ **Tested** | doubao-seed-2.0, doubao-pro |
| ChatGPT Web | ⏳ Untested | GPT-4, GPT-4 Turbo |
| Yuanbao (元宝) | ⏳ Untested | Hunyuan Pro, Hunyuan Standard |
| Gemini Web | ⏳ Untested | Gemini Pro, Gemini Ultra |
| Grok Web | ⏳ Untested | Grok 1, Grok 2 |
| Z Web | ⏳ Untested | GLM-4, GLM-3 Turbo |
| Manus Web | ⏳ Untested | Manus 1 |
| Manus API | ⏳ Untested | Manus 1.6, Manus 1.6 Lite (API key, free tier) |

> **Note:** All web-based providers use browser automation (Playwright) for authentication and API access. Platforms marked **Tested** have been verified to work.

---

### CLI Mode

```bash
# Interactive terminal with Claude
node openclaw.mjs tui
```

---

## Configuration

### openclaw.json

```json
{
  "auth": {
    "profiles": {
      "deepseek-web:default": {
        "provider": "deepseek-web",
        "mode": "api_key"
      }
    }
  },
  "models": {
    "providers": {
      "deepseek-web": {
        "baseUrl": "https://chat.deepseek.com",
        "api": "deepseek-web",
        "models": [
          {
            "id": "deepseek-chat",
            "name": "DeepSeek Chat",
            "contextWindow": 64000,
            "maxTokens": 4096
          },
          {
            "id": "deepseek-reasoner",
            "name": "DeepSeek Reasoner",
            "reasoning": true,
            "contextWindow": 64000,
            "maxTokens": 8192
          }
        ]
      }
    }
  },
  "gateway": {
    "port": 3001,
    "auth": {
      "mode": "token",
      "token": "your-gateway-token"
    }
  }
}
```

---

## Roadmap

### Current Focus
- ✅ DeepSeek Web, Qwen, Kimi, Claude Web, Doubao — all **tested and working**
- 🔧 Improving credential capture reliability
- 📝 Documentation improvements

### Planned Features
- 🔜 ChatGPT Web authentication support
- 🔜 Auto-refresh for expired sessions

---

## Adding New Platforms

To add support for a new platform, create the following files:

### 1. Authentication Module (`src/providers/{platform}-web-auth.ts`)

```typescript
export async function loginPlatformWeb(params: {
  onProgress: (msg: string) => void;
  openUrl: (url: string) => Promise<boolean>;
}): Promise<{ cookie: string; bearer: string; userAgent: string }> {
  // Browser automation login, capture credentials
}
```

### 2. API Client (`src/providers/{platform}-web-client.ts`)

```typescript
export class PlatformWebClient {
  constructor(options: { cookie: string; bearer?: string }) {}
  
  async chatCompletions(params: ChatParams): Promise<ReadableStream> {
    // Call platform Web API
  }
}
```

### 3. Stream Handler (`src/agents/{platform}-web-stream.ts`)

```typescript
export function createPlatformWebStreamFn(credentials: string): StreamFn {
  // Handle platform-specific response format
}
```

---

## Project Structure

```
openclaw-zero-token/
├── src/
│   ├── providers/
│   │   ├── deepseek-web-auth.ts      # DeepSeek login capture
│   │   └── deepseek-web-client.ts    # DeepSeek API client
│   ├── agents/
│   │   └── deepseek-web-stream.ts    # Streaming response handler
│   ├── commands/
│   │   └── auth-choice.apply.deepseek-web.ts  # Authentication flow
│   └── browser/
│       └── chrome.ts                 # Chrome automation
├── ui/                               # Web UI (Lit 3.x)
├── .openclaw-state/                  # Local state (not committed)
│   ├── openclaw.json                 # Configuration
│   └── agents/main/agent/
│       └── auth.json                 # Credentials (sensitive)
└── .gitignore                        # Includes .openclaw-state/
```

---

## Security Notes

1. **Credential Storage**: Cookies and Bearer tokens are stored locally in `auth.json`, **never committed to Git**
2. **Session Expiry**: Web sessions may expire and require periodic re-login
3. **Rate Limits**: Web APIs may have rate limits, not suitable for high-frequency calls
4. **Compliance**: For personal learning and research only, please comply with platform terms of service

---

## Syncing with Upstream

This project is based on OpenClaw. Sync upstream updates with:

```bash
# Add upstream repository
git remote add upstream https://github.com/openclaw/openclaw.git

# Sync upstream updates
git fetch upstream
git merge upstream/main
```

---

## Contributing

Contributions are welcome, especially:
- New platform Web authentication support (Doubao, Claude, ChatGPT, etc.)
- Bug fixes
- Documentation improvements

---

## License

[MIT License](LICENSE)

---

## Acknowledgments

- [OpenClaw](https://github.com/openclaw/openclaw) - The original project
- [DeepSeek](https://deepseek.com) - Excellent AI models

---

## Disclaimer

This project is for learning and research only. When using it to access any third-party service, please comply with that service's terms of use. The developers are not responsible for any issues arising from the use of this project.

### Requirements

Node.js v18+ | npm 8.x+ | Chrome latest | macOS / Linux / Windows (WSL2)
