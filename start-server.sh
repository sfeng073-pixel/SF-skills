#!/bin/bash
# 销售实时作战大屏 - 一键启动脚本（Mac/Linux）

echo ""
echo "  ============================================"
echo "    销售实时作战大屏 - 一键启动"
echo "  ============================================"
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "  [错误] 未检测到 Node.js，请先安装！"
    echo "  Mac:  brew install node"
    echo "  Linux: sudo apt install nodejs npm"
    echo "  或访问: https://nodejs.org/"
    exit 1
fi

# 获取本机IP
echo "  [1/3] 检测网络环境..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
else
    IP=$(hostname -I | awk '{print $1}')
fi

# 启动服务
echo "  [2/3] 启动服务..."
echo ""
echo "  ============================================"
echo "    启动成功！"
echo ""
echo "    本机访问：http://localhost:8080/index.html"
echo "    电视访问：http://${IP}:8080/index.html"
echo ""
echo "    请在电视浏览器中输入上方【电视访问】地址"
echo "    按 Ctrl+C 停止服务"
echo "  ============================================"
echo ""

# 启动HTTP服务器（监听所有网络接口）
npx http-server -p 8080 -a 0.0.0.0 -c-1 --silent &
SERVER_PID=$!

# 等待服务启动
sleep 2

# 自动打开浏览器
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:8080/index.html
elif [[ "$OSTYPE" == "linux"* ]]; then
    xdg-open http://localhost:8080/index.html 2>/dev/null || true
fi

# 等待用户中断
wait $SERVER_PID
