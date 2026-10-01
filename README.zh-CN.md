# ShareDock

[English](README.md)

ShareDock 是面向个人开发者和小型团队的自托管文件中转服务，适用于临时文件分享、
截图交付、反向收件和自动化上传，并让数据始终由部署者掌控。

ShareDock 有意不做云盘或文件管理器替代品。它聚焦于需要清晰链接、明确有效期和轻量
运营界面的短期文件传递。

## 核心能力

- 创建带有效期、密码、访问次数限制和删除控制的分享链接。
- 通过反向分享链接接收文件，而不暴露完整网盘空间。
- 使用备注、标签和账户级管理整理近期分享。
- 在管理后台查看存储使用、即将过期的分享和定时清理状态。
- 为 ShareX、PowerShell 和脚本创建个人上传 Token。
- 为成功的自动化上传配置可选的 HMAC-SHA256 签名 Webhook。
- 使用本地文件系统或兼容 S3 的对象存储部署。

## 快速开始

### 前置条件

- 已安装 Docker Engine 和 Docker Compose v2
- 有可写入的 ShareDock 数据目录

独立部署使用 Node.js 22 LTS 和 npm 10.x；仓库通过 `.node-version`
固定已验证的 Node.js 版本。

### 使用 Docker Compose 运行

```powershell
git clone https://github.com/ToYOhin/sharedock.git
cd sharedock
docker compose up -d
```

服务健康后，访问 `http://localhost:3000`。Compose 配置会将应用数据持久化到本地
`data/` 目录。

如需对外提供服务，请先查看 [`config.example.yaml`](config.example.yaml)，配置合适的
反向代理，并保护好首次创建的管理员账户。

## 建议的首次配置

1. 打开 `/auth/signUp` 注册首个账户，该账户会自动成为管理员。除非通过
   `config.yaml` 显式创建账户，否则不存在默认管理员账号或密码。
2. 打开 **管理后台 → 配置**，检查有效期、存储和服务设置。
3. 使用 **上传** 创建临时分享链接或反向分享链接。
4. 在 **账户 → 上传 Token** 中为每个 ShareX 客户端或自动化工作流创建专用 Token。
5. 在调整存储或数据库之前备份 `data/`。

## 自动化上传

ShareDock 提供与 ShareX 兼容的 multipart 上传接口：

```text
POST /api/integrations/sharex/upload
Authorization: Bearer <sdock_...>
multipart field: file
```

响应会返回普通分享 URL 和私有管理 URL。上传 Token、生成的 `.sxcu` 文件和管理 URL
都应视为凭据妥善保管。完整说明涵盖 ShareX 导入、PowerShell 和脚本调用。

## 数据、备份与安全

- 本地部署会将 SQLite 数据库和上传文件存放在 `data/` 下。
- S3 对象存储需要由服务商提供独立的备份和保留策略。
- 覆盖正式数据前，应先恢复到独立目录完成演练。
- 不要把部署密钥、上传 Token、删除 URL、数据库文件或备份压缩包提交到源码库。
- 对公网部署应通过反向代理启用 HTTPS。

## 文档

- [安装](docs/docs/setup/installation.md)
- [配置](docs/docs/setup/configuration.md)
- [备份、恢复与升级](docs/docs/setup/backup-restore.md)
- [ShareX 集成](docs/integrations/sharex.md)
- [存储与 S3](docs/docs/setup/s3.md)
- [清理策略](docs/cleanup-policy.md)
- [安全策略](SECURITY.md)
- [更新日志](CHANGELOG.md)

## 项目关系与许可证

ShareDock 衍生自 Pingvin Share X 和原始 Pingvin Share 项目，是独立项目，不代表上游
项目，也不暗示获得上游官方背书。

ShareDock 保留 BSD-2-Clause 许可证、原始版权声明和免责声明。分发的 Docker 镜像包含
`/opt/app/LICENSE` 与 `/opt/app/NOTICE.md`，用于提供适用的许可证和上游署名材料。
详见 [LICENSE](LICENSE) 与 [NOTICE.md](NOTICE.md)。
