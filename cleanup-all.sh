#!/bin/bash

# 清理不必要的文档和脚本

echo "开始清理不必要的文档和脚本..."

# 要删除的文档
DOCS_TO_DELETE=(
    "CHECKLIST.md"
    "CHROME_DEBUG_MODE.md"
    "CHROME_DEBUG_MODE_EN.md"
    "DOCS_INDEX.md"
    "DOCS_README.md"
    "FINAL_TEST_GUIDE.md"
    "IMPLEMENTATION_COMPLETE.md"
    "QUICK_TEST.md"
    "README_TESTING.md"
    "README_zh-CN.md"
    "SUMMARY.md"
    "TESTING_GUIDE.md"
    "WEB_PLATFORMS_COMPLETE_GUIDE.md"
    "WEB_PLATFORMS_IMPLEMENTATION_PLAN.md"
    "WEB_PLATFORMS_STATUS.md"
)

# 要删除的脚本
SCRIPTS_TO_DELETE=(
    "check-mac-setup.sh"
    "check-models.sh"
    "check-web-ui-models.sh"
    "cleanup-docs.sh"
    "diagnose-doubao.sh"
    "generate-platforms.sh"
    "restart-gateway.sh"
    "test-chatgpt-manual.sh"
    "test-chrome-connection.sh"
    "test-claude.sh"
    "test-doubao.sh"
)

# 删除文档
echo ""
echo "删除不必要的文档..."
for doc in "${DOCS_TO_DELETE[@]}"; do
    if [ -f "$doc" ]; then
        rm "$doc"
        echo "  ✓ 删除: $doc"
    fi
done

# 删除脚本
echo ""
echo "删除不必要的脚本..."
for script in "${SCRIPTS_TO_DELETE[@]}"; do
    if [ -f "$script" ]; then
        rm "$script"
        echo "  ✓ 删除: $script"
    fi
done

echo ""
echo "保留的核心文档："
echo "  - README.md"
echo "  - INSTALLATION.md"
echo "  - TEST_STEPS.md"
echo "  - START_HERE.md"

echo ""
echo "保留的核心脚本："
echo "  - start-chrome-debug.sh"
echo "  - onboard.sh"
echo "  - server.sh"
echo "  - check-setup.sh"

echo ""
echo "清理完成！"
