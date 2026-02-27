# 安装指南

## 📋 前置要求

### 必需软件

1. **Node.js** (v18 或更高版本)
   ```bash
   node --version
   # 应该显示 v18.x.x 或更高
   ```

2. **npm** (通常随 Node.js 一起安装)
   ```bash
   npm --version
   # 应该显示 8.x.x 或更高
   ```

3. **Google Chrome** (用于调试浏览器)
   - macOS: 已安装
   - Linux: `sudo apt install google-chrome-stable`
   - Windows: 下载安装

### 可选软件

- **Git** (用于克隆代码)
  ```bash
  git --version
  ```

---

## 🚀 安装步骤

### 步骤 1：克隆或下载代码

**使用 Git**：
```bash
git clone <repository-url>
cd openclaw-zero-token
```

**或者直接下载**：
- 下载 ZIP 文件
- 解压到目录
- 进入目录

---

### 步骤 2：安装依赖

```bash
npm install
```

**预期输出**：
```
added 500+ packages in 30s
```

**如果遇到错误**：
```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

---

### 步骤 3：编译代码

```bash
npm run build
```

**预期输出**：
```
✔ Build complete in 7919ms
```

**验证编译成功**：
```bash
ls dist/index.mjs
# 应该看到文件存在
```

---

### 步骤 4：验证安装

```bash
# 检查编译后的文件
ls -lh dist/index.mjs

# 应该看到类似输出：
# -rw-r--r--  1 user  staff   2.5M Feb 27 10:00 dist/index.mjs
```

---

## 🔧 配置环境

### 创建配置目录

配置目录会在首次运行时自动创建，但你也可以手动创建：

```bash
mkdir -p .openclaw-state/agents/main/agent
```

### 检查配置文件

```bash
# 查看配置文件（如果存在）
cat .openclaw-state/openclaw.json

# 查看认证配置（如果存在）
cat .openclaw-state/agents/main/agent/auth-profiles.json
```

---

## ✅ 安装完成检查清单

- [ ] Node.js 已安装（v18+）
- [ ] npm 已安装
- [ ] 依赖已安装（`npm install`）
- [ ] 代码已编译（`npm run build`）
- [ ] `dist/index.mjs` 文件存在
- [ ] Google Chrome 已安装

---

## 🎯 下一步

安装完成后，继续阅读：

1. **START_HERE.md** - 快速开始指南
2. **TEST_STEPS.md** - 详细测试步骤
3. **QUICK_TEST.md** - 快速测试指南

---

## 🔧 常见问题

### Q1: npm install 失败

**A**: 尝试以下方法：
```bash
# 使用国内镜像（如果在中国）
npm config set registry https://registry.npmmirror.com

# 重新安装
npm install
```

### Q2: npm run build 失败

**A**: 检查 Node.js 版本：
```bash
node --version
# 必须是 v18 或更高

# 如果版本太低，升级 Node.js
```

### Q3: 权限错误

**A**: 不要使用 sudo：
```bash
# 错误：sudo npm install
# 正确：npm install
```

### Q4: 磁盘空间不足

**A**: 检查磁盘空间：
```bash
df -h

# node_modules 大约需要 500MB
# dist 大约需要 10MB
```

---

## 📚 相关命令

```bash
# 安装依赖
npm install

# 编译代码
npm run build

# 清理编译产物
rm -rf dist

# 重新编译
npm run build

# 查看 npm 脚本
npm run

# 检查依赖版本
npm list --depth=0
```

---

## 🎉 安装成功！

现在你可以开始测试了。继续阅读 **START_HERE.md** 开始测试流程。
