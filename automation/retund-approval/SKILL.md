---
name: refund-approval
version: 1.0.0
description: 退费审批自动化系统。当用户需要执行退费审批、查看审批记录、生成退费周报、管理定时任务时使用。
---

# 退费审批自动化技能

全自动处理钉钉退费审批任务，支持手动执行和定时自动执行。

## 项目位置

/Users/lijiaxin/refund-approval-automation/

## 前置条件

1. 钉钉客户端已登录并保持运行
2. Chrome 浏览器已登录审批系统，且已开启允许Apple事件中的JavaScript
3. Python虚拟环境已配置：.venv/

## 命令

### 手动执行每日审批

cd /Users/lijiaxin/refund-approval-automation && source .venv/bin/activate && python3 main.py --daily

### 生成退费周报

cd /Users/lijiaxin/refund-approval-automation && source .venv/bin/activate && python3 main.py --weekly

### 生成上周周报

cd /Users/lijiaxin/refund-approval-automation && source .venv/bin/activate && python3 main.py --last-week

## 定时任务

- 计划：每天北京时间10:00自动执行
- launchd配置：~/Library/LaunchAgents/com.refund.approval.daily.plist
- 运行脚本：run_daily.sh

### 管理定时任务

launchctl list | grep refund
launchctl start com.refund.approval.daily
launchctl unload ~/Library/LaunchAgents/com.refund.approval.daily.plist
launchctl load ~/Library/LaunchAgents/com.refund.approval.daily.plist

## 输出文件

- output/refund_YYYYMMDD.xlsx 每日退费明细Excel
- reports/退费周报_YYYYMMDD_YYYYMMDD.docx 退费原因分析周报
- attachments/ 退费附件截图
- logs/daily_YYYYMMDD.log 每日运行日志

## 工作流程

1. 激活钉钉并自动全屏
2. 点击待办（坐标定位）
3. 循环处理：图像识别点击去查看，等待Chrome打开，AppleScript执行JS提取数据，保存Excel，点击通过并提交，关闭标签页，回到钉钉
4. 直到找不到去查看按钮，任务结束

## 注意事项

- 运行期间请勿操作鼠标键盘
- 确保Chrome已开启允许Apple事件中的JavaScript
- 模板图片images/go_view_button.png需与当前钉钉版本匹配
