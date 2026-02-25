#!/bin/bash
# 测试 Chrome 调试连接

echo "=========================================="
echo "  测试 Chrome 调试连接"
echo "=========================================="
echo ""

# 检查 Chrome 是否在调试模式运行
if ! curl -s http://127.0.0.1:9222/json/version > /dev/null 2>&1; then
    echo "✗ Chrome 调试端口未响应"
    echo ""
    echo "请先运行："
    echo "  ./start-chrome-debug.sh"
    exit 1
fi

echo "✓ Chrome 调试端口响应正常"
echo ""

# 获取 Chrome 版本信息
VERSION_INFO=$(curl -s http://127.0.0.1:9222/json/version)
echo "Chrome 信息:"
echo "$VERSION_INFO" | jq '.'
echo ""

# 获取打开的标签页
TABS=$(curl -s http://127.0.0.1:9222/json)
TAB_COUNT=$(echo "$TABS" | jq '. | length')

echo "打开的标签页数量: $TAB_COUNT"
echo ""

# 检查是否有 claude.ai 标签页
CLAUDE_TABS=$(echo "$TABS" | jq '[.[] | select(.url | contains("claude.ai"))]')
CLAUDE_COUNT=$(echo "$CLAUDE_TABS" | jq '. | length')

if [ "$CLAUDE_COUNT" -gt 0 ]; then
    echo "✓ 检测到 $CLAUDE_COUNT 个 Claude 标签页"
    echo ""
    echo "Claude 标签页:"
    echo "$CLAUDE_TABS" | jq '.[] | {title: .title, url: .url}'
else
    echo "⚠️  未检测到 Claude 标签页"
    echo ""
    echo "请在 Chrome 中打开 https://claude.ai"
fi

echo ""
echo "=========================================="
echo "一切就绪！现在可以测试 OpenClaw："
echo "  ./test-claude.sh \"你好\""
echo "=========================================="
