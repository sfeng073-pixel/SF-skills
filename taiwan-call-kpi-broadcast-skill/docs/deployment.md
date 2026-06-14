# 部署说明

## 方案建议

对团队共享时，推荐两种方式：

### 方案一：本地常驻机执行

适合你现在的场景，优点是：

- `dws` 登录态更好维护
- SmartBI CLI 可以直接复用本地现成能力
- 图片上传 DingDrive 更稳定

建议在一台固定 Mac 上部署，并保持：

- Python 环境可用
- Node 环境可用
- `dws` 已登录
- SmartBI 账号可用

### 方案二：GitHub Actions + 自建 Runner

适合团队统一管理代码和调度。

建议做法：

- GitHub Actions 只做调度
- 真正执行放在自建 runner
- runner 上提前装好：
  - Node
  - Python
  - `dws`
  - SmartBI CLI

不建议直接用 GitHub Hosted Runner，因为它默认没有你的本地登录态和 DingDrive 能力。

## 建议环境变量

至少需要：

```bash
SMARTBI_CLI_PATH
SMARTBI_CLI_PYTHON_BIN
SMARTBI_BASE_URL
SMARTBI_USERNAME
SMARTBI_PASSWORD
DINGTALK_WEBHOOK_URL
DINGTALK_WEBHOOK_SECRET
DINGTALK_DRIVE_SPACE_ID
DINGTALK_USER_MAPPING_PATH
TAIWAN_CALL_KPI_PYTHON_BIN
TAIWAN_CALL_KPI_RUNTIME_ROOT
```

## 定时建议

按北京时间执行：

- `15:00`
- `17:00`
- `21:30`

如果是 GitHub Actions，要写成 UTC：

- 北京时间 `15:00` = UTC `07:00`
- 北京时间 `17:00` = UTC `09:00`
- 北京时间 `21:30` = UTC `13:30`

## 发布前核查

- SmartBI 报表 id 是否可用
- 台湾小组名称仍然是 `台湾CC02组`
- 钉钉 webhook 是否有效
- 钉钉映射表是否齐全
- `dws` 是否已登录
- dry-run 是否能正常生成图片和文案
- dry-run-send 是否能正确生成 `@销售`
