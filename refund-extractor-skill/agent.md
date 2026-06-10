# Agent 配置说明

## 技能名称

蓝凌OA退费数据提取器 (Lanling Refund Extractor)

## 功能描述

从蓝凌OA系统自动提取退费审批数据并导出Excel，支持时间范围筛选和增量提取。

## 触发词

- "提取退费数据"
- "导出退费明细"
- "下载退费记录"
- "退费数据复盘"

## 参数说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| days | int | 否 | 30 | 提取最近N天的数据 |
| extract | bool | 否 | true | 是否执行提取（固定为true） |

## 使用示例

### 自然语言触发

```
提取最近7天的退费数据
```

对应命令：
```bash
python main_lanling_api.py --extract --days 7
```

```
导出最近一个月的退费明细
```

对应命令：
```bash
python main_lanling_api.py --extract --days 30
```

```
下载本季度所有退费记录
```

对应命令：
```bash
python main_lanling_api.py --extract --days 90
```

## 前置条件

1. **Python环境**：Python 3.7+
2. **依赖包**：requests, openpyxl
3. **蓝凌OA访问权限**：需要能登录蓝凌OA系统
4. **Cookie认证**：首次运行需要手动输入浏览器Cookie

## 配置步骤

### 第一步：安装依赖

```bash
pip install requests openpyxl
```

### 第二步：配置蓝凌OA域名

编辑 `main_lanling_api.py`，修改第31行：

```python
LANLING_BASE = os.environ.get("LANLING_BASE", "https://your-lanling-domain.com")
```

或设置环境变量：

```bash
export LANLING_BASE="https://your-lanling-domain.com"
```

### 第三步：修改审批模板名称

根据实际使用的审批模板名称，修改第485行：

```python
if item.get('fdTemplate.fdName', '') != '【豌豆】退费申请':
```

改为实际的模板名称，例如：
- `【豌豆】退费申请`
- `退费审批流程`
- `学员退费申请`

### 第四步：首次运行获取Cookie

```bash
python main_lanling_api.py --extract --days 7
```

按提示输入浏览器Cookie。

### 第五步：后续运行

Cookie已自动保存，直接执行：

```bash
python main_lanling_api.py --extract --days 30
```

## 输出说明

### Excel文件位置

```
~/refund-extractor/output/refund_YYYYMMDD.xlsx
```

### 文件格式

- **Sheet名称**：退费审批明细
- **表头行**：蓝色背景，白色字体
- **数据行**：自动换行，边框线
- **列宽**：根据内容自动调整

### 字段说明

| 字段 | 示例值 | 备注 |
|------|--------|------|
| 申请单编号 | 20260602-263 | 唯一标识 |
| 申请人姓名 | 张三 | 提交人 |
| 申请人部门 | 销售部-一组 | 完整路径 |
| 申请日期 | 2025-06-02 | 提交日期 |
| 学员姓名 | 李小明 | 退费学员 |
| 豌豆学员ID | 19876637 | 学员唯一标识 |
| 退费订单名称 | 豌豆思维-年课 | 订单描述 |
| 退费金额 | 8880.0 | 申请金额 |
| 退费原因（一级） | 学员原因 | 大类 |
| 退费原因（二级） | 无理由退费 | 小类 |
| 退费说明 | 家长要求退费 | 详细说明 |
| 退费附件文件 | img1.jpg, img2.png | 附件列表 |

## 常见问题

### Q1: Cookie过期怎么办？

A: 删除 `~/.lanling_cookies.json` 文件，重新运行程序按提示输入新Cookie。

### Q2: 提取的数据有重复？

A: 程序已内置去重机制（`seen_ids` 集合），如果仍有重复请检查是否同时运行了多个实例。

### Q3: 某些字段为空？

A: 可能原因：
- 历史数据在表单升级前提交，缺少新字段
- 该字段在蓝凌OA中确实未填写
- HTML结构变化导致解析失败（需更新代码）

### Q4: 如何修改提取的字段？

A: 编辑 `RefundExcelHandler.DEFAULT_FIELDS` 列表，添加或删除字段名。同时需要更新 `extract_detail_from_html` 方法中的 `field_map` 映射。

### Q5: 主管意见为什么提取不到？

A: 蓝凌OA的审批流程通过前端JavaScript动态渲染，不在服务端HTML中。需要通过其他方式获取（如钉钉审批API或浏览器自动化）。

## 故障排查

### 登录失败

```
检查Cookie是否完整（需要包含JSESSIONID和LtpaToken）
检查蓝凌OA域名是否正确
检查网络连接是否正常
```

### 获取列表为空

```
检查审批模板名称是否匹配
检查是否有权限查看该模板的数据
检查时间范围是否合理
```

### Excel保存失败

```
检查磁盘空间是否充足
检查是否有权限写入output目录
关闭已打开的Excel文件后再运行
```

## 安全注意事项

1. **Cookie保密**：`.lanling_cookies.json` 包含登录凭证，勿提交到Git仓库
2. **数据脱敏**：共享Excel前请删除敏感信息（如学员联系方式）
3. **访问权限**：确保只有授权人员可以运行此工具

## 更新日志

### v1.1 (2026-06-04)
- 修复时间过滤：改用 `q.docCreateTime` 双参数API过滤（不再需要下载全量数据）
- 脱敏处理：敏感配置改为环境变量读取
- 新增 Cookie 自动获取助手（cookie_helper.py）

### v1.0 (2025-06-04)
- 初始版本
- 支持Cookie登录和持久化
- 支持分页获取和客户端时间过滤
- 支持HTML解析和附件提取
- 支持Excel导出

## 技术支持

如有问题请联系：SOLO
