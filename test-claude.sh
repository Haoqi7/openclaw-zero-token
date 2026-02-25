#!/bin/bash
# Claude Web 测试脚本

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/.openclaw-state/openclaw.json"

# 从配置文件读取 token
if [ -f "$CONFIG_FILE" ]; then
  GATEWAY_TOKEN=$(jq -r '.gateway.auth.token // "62b791625fa441be036acd3c206b7e14e2bb13c803355823"' "$CONFIG_FILE")
else
  GATEWAY_TOKEN="62b791625fa441be036acd3c206b7e14e2bb13c803355823"
fi

PORT=3001
MESSAGE="${1:-你好,Claude!}"

echo "=========================================="
echo "  测试 Claude Web"
echo "=========================================="
echo "Gateway: http://127.0.0.1:$PORT"
echo "Token: ${GATEWAY_TOKEN:0:20}..."
echo "消息: $MESSAGE"
echo ""

# 非流式测试
echo "发送请求..."
RESPONSE=$(curl -s http://127.0.0.1:$PORT/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GATEWAY_TOKEN" \
  -d "{
    \"model\": \"claude-web/claude-3-5-sonnet-20241022\",
    \"messages\": [{\"role\": \"user\", \"content\": \"$MESSAGE\"}],
    \"stream\": false
  }")

# 检查响应
if echo "$RESPONSE" | jq -e '.choices[0].message.content' > /dev/null 2>&1; then
  echo "✓ 成功！"
  echo ""
  echo "完整响应："
  echo "$RESPONSE" | jq '.'
  echo ""
  echo "Claude 回复："
  echo "$RESPONSE" | jq -r '.choices[0].message.content'
else
  echo "✗ 失败！"
  echo ""
  echo "错误响应："
  echo "$RESPONSE" | jq '.'
fi

echo ""
echo "=========================================="
echo "提示："
echo "  - 修改消息: ./test-claude.sh \"你的消息\""
echo "  - 流式输出: ./test-claude-stream.sh"
echo "=========================================="
