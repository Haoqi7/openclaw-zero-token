# OpenClaw Web 平台扩展

支持 10 个 Web 平台的 AI 对话服务，完全免费使用。

## 🎯 支持的平台

### 已测试平台（2 个）
- ✅ **Claude Web** - claude.ai
- ✅ **Doubao Web** - doubao.com

### 新增平台（8 个）
- 🆕 **ChatGPT Web** - chatgpt.com
- 🆕 **Qwen Web** - chat.qwen.ai
- 🆕 **Yuanbao Web** - yuanbao.tencent.com
- 🆕 **Kimi Web** - kimi.moonshot.cn
- 🆕 **Gemini Web** - gemini.google.com
- 🆕 **Grok Web** - grok.com
- 🆕 **Z Web** - chat.z.ai
- 🆕 **Manus Web** - manus.im

**总计：10 个平台，23 个模型**

---

## 🚀 快速开始

### ⚠️ 重要：首次使用必须先编译

如果你是首次下载代码，或者修改了源代码，必须先执行编译步骤：

```bash
# 安装依赖
npm install

# 编译代码
npm run build
```

**验证编译成功**：
```bash
ls dist/index.mjs
# 应该看到文件存在
```

详细安装指南：**INSTALLATION.md**

---

### 1. 安装

```bash
# 安装依赖
npm install

# 编译代码
npm run build
```

详细安装指南：**INSTALLATION.md**

### 2. 测试

```bash
# 关闭系统 Gateway
openclaw gateway stop

# 启动 Chrome 调试
./start-chrome-debug.sh

# 配置认证
./onboard.sh

# 启动 Web UI
./server.sh start
```

详细测试步骤：**START_HERE.md** 或 **TEST_STEPS.md**

---

## 📚 文档

### 必读文档
1. **INSTALLATION.md** - 安装指南（首次使用）
2. **START_HERE.md** - 快速开始
3. **TEST_STEPS.md** - 完整测试步骤

### 参考文档
- **QUICK_TEST.md** - 快速测试指南
- **README_TESTING.md** - 测试准备说明
- **IMPLEMENTATION_COMPLETE.md** - 实现完成报告
- **WEB_PLATFORMS_STATUS.md** - 当前状态

---

## 🏗️ 技术架构

### 统一的浏览器方案

所有平台都采用相同的架构：

1. **使用 Playwright** 连接到 Chrome 调试浏览器
2. **在浏览器上下文中执行请求** (`page.evaluate()`)
3. **自动绕过反爬虫检测** (Cloudflare, 验证码等)
4. **最小化配置参数** (只需 cookie/token)

### 代码结构

每个平台包含 4 个核心文件：

```
src/
├── providers/
│   ├── {platform}-web-client-browser.ts  # 浏览器客户端
│   └── {platform}-web-auth.ts            # 认证处理
├── agents/
│   └── {platform}-web-stream.ts          # 流式响应
└── commands/
    └── auth-choice.apply.{platform}-web.ts  # 认证配置
```

---

## 📊 统计数据

- **平台数量**: 10 个
- **模型数量**: 23 个
- **代码文件**: 32 个核心文件
- **代码行数**: 约 4000 行
- **配置文件**: 6 个

---

## 🎯 特性

- ✅ 完全免费（使用 Web 版本）
- ✅ 统一的浏览器方案
- ✅ 自动绕过反爬虫
- ✅ 流式响应支持
- ✅ 最小化配置
- ✅ 易于扩展

---

## 🔧 系统要求

- **Node.js**: v18 或更高
- **npm**: 8.x 或更高
- **Google Chrome**: 最新版本
- **操作系统**: macOS, Linux, Windows (WSL2)

---

## 📝 使用流程

```
1. 安装依赖并编译
   ↓
2. 启动 Chrome 调试浏览器
   ↓
3. 登录所有平台
   ↓
4. 配置认证信息
   ↓
5. 启动 Web UI
   ↓
6. 开始使用
```

---

## 🤝 贡献

欢迎贡献代码！添加新平台只需：

1. 创建 4 个核心文件（参考现有平台）
2. 更新配置文件
3. 添加 API 类型定义
4. 编译并测试

---

## 📄 许可证

[添加你的许可证信息]

---

## 🎉 开始使用

阅读 **START_HERE.md** 开始你的第一次测试！
