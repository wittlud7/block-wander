# 一消入画 · Sites 发布项目

此目录是可独立构建的Cloudflare Worker/D1站点。网页在 `public/game/`，API在 `app/api/`，数据库schema在 `db/`，迁移在 `drizzle/`。

```sh
npm ci
npm run build
```

需要Node.js 22.13+。保留Vinext和Sites构建集成。根路径跳转到 `/game/#home`，每日排名通过 `/api/profile`、`/api/rankings` 提供。

共享游戏源在父项目 `shared/`、`web/`。父目录执行 `npm run site:sync` 更新本站静态资源，并生成 `lib/ranking-service.mjs` 服务端重放模块。独立检出本站时，已包含完整生成文件，可直接构建。

本机初次启动前构建并应用 `drizzle/0000_unusual_carmella_unuscione.sql`，再运行 `npm start -- --port 4191`。托管D1由Sites发布流程应用迁移，无预填玩家。

`.openai/hosting.json` 记录现有站点身份和DB绑定。更新时复用它。凭证、依赖、构建缓存和数据库运行文件不进入源码。
