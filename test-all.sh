#!/bin/bash
# 一键测试 Claude Web 完整流程

set -e

echo "=========================================="
echo "  Claude Web 完整测试流程"
echo "=========================================="
echo ""

# 随机选择一个测试消息
if [ -f "test-messages.txt" ]; then
    TEST_MESSAGE=$(shuf -n 1 test-messages.txt)
    echo "📝 随机测试消息: $TEST_MESSAGE"
    echo ""
else
    TEST_MESSAGE="${1:-你好}"
fi

# 1. 停止并重启 Chrome 调试模式
echo "1. 重启 Chrome 调试模式..."
pkill -f "chrome.*remote-debugging-port=9222" 2>/dev/null || true
sleep 2

./start-chrome-debug.sh
if [ $? -ne 0 ]; then
    echo "✗ Chrome 启动失败"
    exit 1
fi
echo ""

# 2. 等待 Claude 页面加载
echo "2. 等待 Claude 页面加载..."
sleep 5

# 3. 测试 Chrome 连接
echo "3. 测试 Chrome 连接..."
./test-chrome-connection.sh
if [ $? -ne 0 ]; then
    echo "✗ Chrome 连接失败"
    exit 1
fi
echo ""

# 4. 重启 Gateway（不打开浏览器）
echo "4. 重启 Gateway 服务..."
./server.sh stop
sleep 2

# 手动启动 gateway，不打开浏览器
export OPENCLAW_CONFIG_PATH="$PWD/.openclaw-state/openclaw.json"
export OPENCLAW_STATE_DIR="$PWD/.openclaw-state"
nohup node "$PWD/dist/index.mjs" gateway > /tmp/openclaw-gateway.log 2>&1 &
GATEWAY_PID=$!
echo "$GATEWAY_PID" > .gateway.pid

echo "Gateway 已启动 (PID: $GATEWAY_PID)"
echo "等待 Gateway 初始化..."
sleep 5
echo ""

# 5. 测试 Claude
echo "5. 测试 Claude API..."
./test-claude.sh "$TEST_MESSAGE"
echo ""

# 6. 查看日志
echo "=========================================="
echo "最近的日志："
echo "=========================================="
tail -30 /tmp/openclaw-gateway.log | grep -i "claude\|browser" || echo "无相关日志"
echo ""

echo "=========================================="
echo "测试完成！"
echo "=========================================="
echo ""

# 7. 打开 Web UI
WEBUI_URL="http://127.0.0.1:3001/#token=62b791625fa441be036acd3c206b7e14e2bb13c803355823"
echo "正在打开 Web UI..."
echo "URL: $WEBUI_URL"
echo ""

if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$WEBUI_URL" 2>/dev/null &
elif command -v open >/dev/null 2>&1; then
    open "$WEBUI_URL" 2>/dev/null &
else
    echo "请手动打开浏览器访问："
    echo "$WEBUI_URL"
fi

echo "=========================================="
echo "✓ 一切就绪！现在可以在 Web UI 中使用 Claude 了"
echo "=========================================="
