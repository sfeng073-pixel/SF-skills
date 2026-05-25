@echo off
chcp 65001 >nul
title 销售实时作战大屏 - 启动服务

echo.
echo  ============================================
echo    销售实时作战大屏 - 一键启动
echo  ============================================
echo.

:: 检查Node.js是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  [错误] 未检测到 Node.js，请先安装！
    echo  下载地址：https://nodejs.org/
    echo  安装时勾选"Add to PATH"，安装完成后重新运行此脚本
    echo.
    pause
    exit /b 1
)

:: 获取本机IP
echo  [1/3] 检测网络环境...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
)
set IP=%IP: =%

:: 启动服务
echo  [2/3] 启动服务...
echo.
echo  ============================================
echo    启动成功！
echo.
echo    本机访问：http://localhost:8080/index.html
echo    电视访问：http://%IP%:8080/index.html
echo.
echo    请在电视浏览器中输入上方【电视访问】地址
echo    关闭此窗口将停止服务
echo  ============================================
echo.

:: 启动HTTP服务器（监听所有网络接口）
start /b npx http-server -p 8080 -a 0.0.0.0 -c-1 --silent 2>nul

:: 自动打开浏览器
timeout /t 2 /nobreak >nul
start http://localhost:8080/index.html

:: 保持窗口不关闭
pause >nul
