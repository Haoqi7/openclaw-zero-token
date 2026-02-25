#!/bin/bash
# 启动 Chrome 调试模式（用于 OpenClaw 连接）

echo "=========================================="
echo "  启动 Chrome 调试模式"
echo "=========================================="
echo ""

# 检测操作系统和 Chrome 路径
if [ -f "/opt/apps/cn.google.chrome-pre/files/google/chrome/google-chrome" ]; then
    # Deepin 系统
    CHROME_PATH="/opt/apps/cn.google.chrome-pre/files/google/chrome/google-chrome"
    USER_DATA_DIR="$HOME/.config/chrome-openclaw-debug"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CHROME_PATH="google-chrome"
    USER_DATA_DIR="$HOME/.config/chrome-openclaw-debug"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    USER_DATA_DIR="$HOME/Library/Application Support/Chrome-OpenClaw-Debug"
else
    echo "不支持的操作系统: $OSTYPE"
    exit 1
fi

# 检查 Chrome 是否已经在运行
if pgrep -f "chrome.*remote-debugging-port=9222" > /dev/null; then
    echo "✓ Chrome 调试模式已经在运行"
    echo ""
    
    # 测试连接
    if curl -s http://127.0.0.1:9222/json/version > /dev/null 2>&1; then
        echo "✓ 调试端口响应正常"
        echo ""
        VERSION_INFO=$(curl -s http://127.0.0.1:9222/json/version | jq -r '.Browser' 2>/dev/null || echo "未知版本")
        echo "Chrome 版本: $VERSION_INFO"
        echo "调试端口: http://127.0.0.1:9222"
        echo ""
        echo "如果需要重启，请运行："
        echo "  pkill -f 'chrome.*remote-debugging-port=9222'"
        echo "  然后重新运行此脚本"
    else
        echo "✗ 调试端口无响应，可能需要重启"
        echo ""
        read -p "是否重启 Chrome 调试模式? [y/N]: " restart
        if [[ "$restart" =~ ^[Yy]$ ]]; then
            pkill -f "chrome.*remote-debugging-port=9222"
            sleep 2
        else
            exit 0
        fi
    fi
    
    if curl -s http://127.0.0.1:9222/json/version > /dev/null 2>&1; then
        exit 0
    fi
fi

# 检查普通 Chrome 是否在运行（检查调试模式的 Chrome）
if pgrep -f "chrome.*remote-debugging-port=9222" > /dev/null; then
    echo "⚠️  检测到调试模式的 Chrome 正在运行"
    echo ""
    echo "选项："
    echo "  1) 自动关闭并重启（推荐）"
    echo "  2) 手动关闭后再运行"
    echo "  3) 取消"
    echo ""
    read -p "请选择 [1-3]: " choice
    
    case $choice in
        1)
            echo ""
            echo "正在关闭调试模式的 Chrome..."
            pkill -f "chrome.*remote-debugging-port=9222" 2>/dev/null
            sleep 2
            
            # 确认已关闭
            if pgrep -f "chrome.*remote-debugging-port=9222" > /dev/null; then
                echo "✗ Chrome 未能完全关闭，尝试强制关闭..."
                pkill -9 -f "chrome.*remote-debugging-port=9222" 2>/dev/null
                sleep 1
            fi
            
            echo "✓ Chrome 已关闭"
            echo ""
            ;;
        2)
            echo ""
            echo "请手动关闭调试模式的 Chrome，然后重新运行此脚本"
            echo "命令: pkill -f 'chrome.*remote-debugging-port=9222'"
            exit 0
            ;;
        *)
            echo "取消操作"
            exit 0
            ;;
    esac
fi

echo "正在启动 Chrome 调试模式..."
echo "端口: 9222"
echo "用户数据目录: $USER_DATA_DIR"
echo ""

# 检查 Chrome 路径是否存在
if [ ! -f "$CHROME_PATH" ]; then
    echo "✗ Chrome 未找到: $CHROME_PATH"
    echo ""
    echo "请检查 Chrome 是否已安装"
    exit 1
fi

# 启动 Chrome（添加更多参数确保调试端口正常工作）
"$CHROME_PATH" \
  --remote-debugging-port=9222 \
  --user-data-dir="$USER_DATA_DIR" \
  --disable-gpu-driver-bug-workarounds \
  --no-first-run \
  --no-default-browser-check \
  --disable-background-networking \
  --disable-sync \
  --disable-translate \
  --disable-features=TranslateUI \
  --remote-allow-origins=* \
  > /tmp/chrome-debug.log 2>&1 &

CHROME_PID=$!

echo "Chrome 日志: /tmp/chrome-debug.log"

# 等待 Chrome 启动
echo "等待 Chrome 启动..."
for i in {1..15}; do
    if curl -s http://127.0.0.1:9222/json/version > /dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 1
done
echo ""
echo ""

# 检查是否成功启动
if curl -s http://127.0.0.1:9222/json/version > /dev/null 2>&1; then
    VERSION_INFO=$(curl -s http://127.0.0.1:9222/json/version | jq -r '.Browser' 2>/dev/null || echo "未知版本")
    
    echo "✓ Chrome 调试模式启动成功！"
    echo ""
    echo "Chrome PID: $CHROME_PID"
    echo "Chrome 版本: $VERSION_INFO"
    echo "调试端口: http://127.0.0.1:9222"
    echo "用户数据目录: $USER_DATA_DIR"
    echo ""
    echo "正在打开 Claude.ai..."
    
    # 使用 Chrome 打开 Claude.ai
    "$CHROME_PATH" --remote-debugging-port=9222 --user-data-dir="$USER_DATA_DIR" "https://claude.ai/new" > /dev/null 2>&1 &
    
    sleep 2
    
    echo "✓ Claude.ai 已打开"
    echo ""
    echo "=========================================="
    echo "下一步操作："
    echo "=========================================="
    echo "1. 等待 Claude 页面加载完成（应该会自动登录）"
    echo "2. 测试连接: ./test-chrome-connection.sh"
    echo "3. 测试 Claude: ./test-claude.sh \"你好\""
    echo ""
    echo "停止调试模式："
    echo "  pkill -f 'chrome.*remote-debugging-port=9222'"
    echo "=========================================="
else
    echo "✗ Chrome 启动失败"
    echo ""
    echo "请检查："
    echo "  1. Chrome 路径: $CHROME_PATH"
    echo "  2. 端口 9222 是否被占用: lsof -i:9222"
    echo "  3. 用户数据目录权限: $USER_DATA_DIR"
    echo ""
    echo "尝试手动启动："
    echo "  \"$CHROME_PATH\" --remote-debugging-port=9222 --user-data-dir=\"$USER_DATA_DIR\""
    exit 1
fi
