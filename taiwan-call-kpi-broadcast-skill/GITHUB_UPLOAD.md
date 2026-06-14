# GitHub 上传清单

这个项目已经整理成可直接共享的专项技能包。上传前请先确认下面这几项。

## 建议上传的文件

- `SKILL.md`
- `README.md`
- `docs/`
- `scripts/`
- `src/`
- `test/`
- `.github/workflows/`
- `.gitignore`
- `.env.example`
- `requirements.txt`
- `package.json`
- `examples/sample-slot-1500-result.json`
- `examples/dingtalk-user-mapping.example.csv`

## 绝对不要上传的内容

- 真实 `.env`
- 真实 SmartBI 账号密码
- 真实 webhook / secret
- 真实钉钉用户映射表
- `runtime/` 下真实导出文件
- 真实海报图片
- 任意带学员隐私或销售真实私有配置的文件

## 上传前检查

- `.env.example` 里只有占位符
- 示例 csv 里只有演示 id
- 示例 json 不包含敏感信息
- `.gitignore` 已排除 `runtime/`、`.env`、`xlsx`、`png`
- `npm test` 已通过
- `README.md` 已说明部署依赖和边界

## 建议仓库名

`taiwan-call-kpi-broadcast-skill`

## 建议首个提交说明

```text
feat: package taiwan 15:00 17:00 21:30 call-duration KPI broadcast skill
```

## 建议仓库简介

```text
台湾CC02组通时通次专项播报技能：支持 SmartBI 导数、全员排名海报、钉钉图片播报、尾部销售 @ 提醒。
```
