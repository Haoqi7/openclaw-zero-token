# Doubao Integration Principles and Testing Guide

[English](#english) | [中文](豆包测试指南.md)

---

## English

### I. Doubao Solution Principles

#### 1. Two Approaches Comparison (doubao-proxy Recommended)

| Approach | Recommendation | Description |
|----------|----------------|-------------|
| **doubao-proxy** | ★ Recommended | Uses [doubao-free-api](https://github.com/linuxhsj/doubao-free-api) local proxy, provides OpenAI-compatible interface, more stable and easier to debug |
| **doubao-web** | Direct fallback | Directly requests Doubao web API, no extra dependencies, but SSE format may change, requires maintenance |

**doubao-proxy usage**: Run doubao-free-api proxy locally (default `http://127.0.0.1:8000`), OpenClaw calls its OpenAI-compatible `/v1/chat/completions` endpoint via `Authorization: Bearer <sessionid>`.

#### 2. Overall Architecture

Doubao integration uses **web Cookie authentication**, no official API key required. Principle:

```
Browser login to Doubao → Capture Cookie (sessionid, ttwid, etc.) → 
  doubao-proxy: Pass to local proxy, proxy internally calls Doubao API with Cookie
  doubao-web: Directly use Cookie to impersonate web requests → Call Doubao internal API
```

#### 3. Technical Details

| Component | doubao-proxy | doubao-web |
|-----------|--------------|------------|
| **API Endpoint** | Local proxy `/v1/chat/completions` (OpenAI-compatible) | `https://www.doubao.com/samantha/chat/completion` |
| **Authentication** | Bearer Token (sessionid) | Cookie (sessionid, ttwid) |
| **Request/Response** | Standard OpenAI format | Doubao custom SSE (`event_type` 2001/2003, etc.) |

#### 4. Data Flow (When Web UI Sends Message)

**doubao-proxy flow**:
```
Web UI → chat.send → runEmbeddedAttempt → authStorage.getApiKey("doubao-proxy")
  → OpenAI-compatible fetch(baseUrl/v1/chat/completions, Bearer sessionid)
  → Local proxy forwards to Doubao API → Standard SSE stream → Web UI
```

**doubao-web flow**:
```
Web UI → chat.send → runEmbeddedAttempt → authStorage.getApiKey("doubao-web")
  → createDoubaoWebStreamFn(cookie) → DoubaoWebClient.chatCompletions(stream: true)
  → fetch Doubao API → Parse custom SSE → Push text_delta → Web UI
```

#### 5. Key Paths

- **Auth Storage**: `~/.openclaw/agents/<agentId>/auth-profiles.json` with `doubao-proxy:default` or `doubao-web:default`
- **Configuration**: `openclaw.json` with `agents.defaults.model.primary` as `doubao-proxy/doubao` or `doubao-web/doubao-seed-2.0`
- **State Directory**: Default `~/.openclaw`; if `.openclaw-state` exists in project, uses project directory

---

### II. Using Current Project (Not System openclaw)

#### Method A: Project-Local State (Recommended)

Create `.openclaw-state` in project root, then `pnpm run openclaw` will automatically use it:

```bash
cd /path/to/openclawWeComzh  # Replace with actual project path

# 1. Create project-local state directory
mkdir -p .openclaw-state

# 2. pnpm run openclaw will automatically use .openclaw-state (run-node.mjs detects it)
```

#### Method B: Explicit Environment Variable

```bash
cd /path/to/openclawWeComzh  # Replace with actual project path

# Use project directory state
export OPENCLAW_STATE_DIR="$(pwd)/.openclaw-state"
pnpm run openclaw onboard
```

---

### III. Step-by-Step Testing Process

#### Step 0: Prepare Environment

```bash
cd /path/to/openclawWeComzh  # Replace with actual project path

# Ensure dependencies installed
pnpm install

# Ensure built (first time or after code changes)
pnpm build
```

#### Step 1: Create Project-Local State Directory

```bash
mkdir -p .openclaw-state
```

(Optional: For complete isolation, clear with `rm -rf .openclaw-state/*`)

#### Step 2: Run onboard, Configure Doubao

```bash
pnpm run openclaw onboard
```

In the interactive prompts:

1. Select **Model Provider** → Choose **Doubao**
2. Select **Doubao Approach**:
   - **doubao-proxy** (recommended): Requires running [doubao-free-api](https://github.com/linuxhsj/doubao-free-api) locally, then input proxy baseUrl (default `http://127.0.0.1:8000`) and sessionid
   - **doubao-web**: Direct connection to Doubao web API

**If choosing doubao-proxy**:
- First start doubao-free-api proxy (Docker: `linuxhsj/doubao-free-api:latest`, or see [linuxhsj/doubao-free-api](https://github.com/linuxhsj/doubao-free-api) README)
- In onboard, fill in baseUrl (e.g., `http://127.0.0.1:8000`) and sessionid
- Auth saved as `DOUBAO_PROXY_SESSIONID` or in `auth-profiles.json` as `doubao-proxy:default`

**If choosing doubao-web**:
- **Automated Login**: Launches Chrome, opens Doubao page, after QR code login script automatically captures Cookie
- **Use Existing Chrome**: First start Chrome in debug mode:
  ```bash
  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
  ```
  Then login to https://www.doubao.com/chat/ in Chrome, then select "Use Existing Chrome" in onboard
- **Manual Paste**: In browser DevTools → Application → Cookies, copy `sessionid` and `ttwid` and paste

#### Step 3: Verify Auth Written

```bash
# View auth-profiles (path depends on your agentId, usually main)
cat .openclaw-state/agents/main/agent/auth-profiles.json | head -80
```

Should see `doubao-proxy:default` or `doubao-web:default` with corresponding credentials.

#### Step 4: Confirm Default Model is Doubao

```bash
cat .openclaw-state/openclaw.json
```

Check `agents.defaults.model.primary`:
- doubao-proxy: Should be `doubao-proxy/doubao`
- doubao-web: Should be `doubao-web/doubao-seed-2.0`

#### Step 5: Test Doubao API Separately (Bypass OpenClaw Flow)

**doubao-proxy**: Test proxy with curl:
```bash
curl -N -X POST "http://127.0.0.1:8000/v1/chat/completions" \
  -H "Authorization: Bearer <your_sessionid>" \
  -H "Content-Type: application/json" \
  -d '{"model":"doubao","messages":[{"role":"user","content":"Hello"}],"stream":true}'
```

**doubao-web**: Modify `TEST_AUTH` in `test-doubao-integration.js` with your sessionid, then:
```bash
node test-doubao-integration.js
```

If streaming content returns normally, API and auth are fine, issue is in OpenClaw internal flow.

#### Step 6: Start Gateway and Web UI

```bash
pnpm run gateway:dev
```

Console will print port (usually 19001), open in browser (e.g., `http://localhost:19001`).

#### Step 7: Test in Web UI

1. Create or select a session
2. Confirm current model is Doubao (select Doubao-Seed 2.0 in model selector)
3. Send a simple message like "Hello"

#### Step 8: Check Logs for Troubleshooting

When sending message, observe terminal output running `gateway:dev`, look for:

- `[DoubaoWebStream] Auth options keys: ...` — Does it have `sessionid`?
- `[DoubaoWebClient] Sending request to: ...` — Is request sent?
- `[DoubaoWebClient] Received N SSE events but no text parsed` — If appears, Doubao response format doesn't match parsing logic
- Any `Error` or `❌` — Specific error messages

---

### IV. Common Failure Causes

| Symptom | Possible Cause | Suggested Action |
|---------|----------------|------------------|
| Web UI no response | 1. Auth not configured or sessionid expired<br>2. Model not selected as Doubao<br>3. doubao-proxy: Proxy not started or baseUrl wrong | Re-run onboard, confirm model, check doubao-proxy running |
| `No API key found for doubao-web` / `doubao-proxy` | No Doubao config in auth-profiles | Re-run onboard and select corresponding approach |
| doubao-proxy connection failed | Proxy not started or baseUrl misconfigured | Confirm doubao-free-api is running, check baseUrl in `openclaw.json` |
| `Received N SSE events but no text parsed` | doubao-web only: Doubao SSE format doesn't match parsing logic | Need to update `doubao-web-client.ts`; or switch to doubao-proxy |
| `710022004` or rate limit | Doubao rate limiting | Wait 1-2 hours and retry |
| Running system openclaw | Using globally installed openclaw | Use `pnpm run openclaw` and ensure `.openclaw-state` exists or set `OPENCLAW_STATE_DIR` |

---

### V. State Directory Explanation

- **Default**: `~/.openclaw` (shared with system global openclaw)
- **Project-local**: When `.openclaw-state` exists in project root, `run-node.mjs` sets `OPENCLAW_STATE_DIR`, configs and sessions saved in `.openclaw-state/`

If you previously configured Doubao with system openclaw but now running project version, you need to:

- Either re-run onboard in project (using `.openclaw-state`)
- Or copy Doubao-related entries from `~/.openclaw/agents/main/agent/auth-profiles.json` to `.openclaw-state/agents/main/agent/auth-profiles.json`

---

## Quick Reference

### doubao-proxy Setup (Recommended)

```bash
# 1. Start doubao-free-api proxy
docker run -d -p 8000:8000 linuxhsj/doubao-free-api:latest

# 2. Get sessionid from https://www.doubao.com (F12 → Cookies)

# 3. Configure OpenClaw
pnpm run openclaw onboard
# Select: Doubao → doubao-proxy
# Input: baseUrl (http://127.0.0.1:8000) and sessionid

# 4. Test
curl -N -X POST "http://127.0.0.1:8000/v1/chat/completions" \
  -H "Authorization: Bearer <sessionid>" \
  -H "Content-Type: application/json" \
  -d '{"model":"doubao","messages":[{"role":"user","content":"Hello"}],"stream":true}'
```

### doubao-web Setup (Direct)

```bash
# 1. Configure OpenClaw
pnpm run openclaw onboard
# Select: Doubao → doubao-web → Automated Login
# Browser will open, scan QR code to login

# 2. Start Gateway
pnpm run gateway:dev

# 3. Test in Web UI
# Open http://localhost:19001
```

