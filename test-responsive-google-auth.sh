#!/bin/bash

# Google 響應式登錄完整測試腳本

echo "🚀 Google 響應式登錄完整測試"
echo "================================"

# 檢查前端服務
echo "📡 檢查前端服務狀態..."
if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ 前端服務運行正常 (端口 3000)"
else
    echo "❌ 前端服務未運行"
    echo "請先啟動: cd /Users/liyu/Programing/aws/chainy-web && npm run dev"
    exit 1
fi

# 檢查OAuth配置
echo ""
echo "🔧 檢查OAuth配置..."
CLIENT_ID="1079648073253-kueo7mpri415h10dsc0fldeoecp878l6.apps.googleusercontent.com"

# 測試OAuth授權URL
echo "測試OAuth授權URL..."
OAUTH_TEST_URL="https://accounts.google.com/o/oauth2/v2/auth?client_id=$CLIENT_ID&response_type=code&scope=openid%20email%20profile&redirect_uri=http://localhost:3000/callback"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -I "$OAUTH_TEST_URL")

if [ "$HTTP_STATUS" = "302" ] || [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ OAuth配置正常 (HTTP $HTTP_STATUS)"
else
    echo "❌ OAuth配置有問題 (HTTP $HTTP_STATUS)"
fi

# 檢查前端頁面
echo ""
echo "🌐 檢查前端頁面..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000")

if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ 前端頁面正常 (HTTP $FRONTEND_STATUS)"
else
    echo "❌ 前端頁面有問題 (HTTP $FRONTEND_STATUS)"
fi

echo ""
echo "🎯 測試完成！現在可以進行實際測試："
echo "1. 訪問主應用: http://localhost:3000"
echo "2. 點擊 '🔑 使用 Google 登入' 按鈕"
echo "3. 應該會跳轉到Google授權頁面"
