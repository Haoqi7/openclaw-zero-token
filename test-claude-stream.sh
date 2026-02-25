#!/bin/bash
# Claude Web 流式测试脚本

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/.openclaw-state/openclaw.json"

# 从配置文件读取 token
if [ -f "$CONFIG_FILE" ]; then
  GATEWAY_TOKEN=$(jq -r '.gateway.auth.token // "62b791625fa441be036acd3c206b7e14e2bb13c803355823"' "$CONFIG_FILE")
else
  GATEWAY_TOKEN="62b791625fa441be036acd3c206b7e14e2bb13c803355823"
fi

PORT=3001
MESSAGE="${1:-你好,Claude! 请用中文回答。}"

echo "=========================================="
echo "  测试 Claude Web (流式输出)"
echo "=========================================="
echo "Gateway: http://127.0.0.1:$PORT"
echo "消息: $MESSAGE"
echo ""
echo "回复："
echo "----------------------------------------"

# 流式测试
curl -N http://127.0.0.1:$PORT/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GATEWAY_TOKEN" \
  -d "{
    \"model\": \"claude-web/claude-3-5-sonnet-20241022\",
    \"messages\": [{\"role\": \"user\", \"content\": \"$MESSAGE\"}],
    \"stream\": true
  }"

echo ""
echo "----------------------------------------"
