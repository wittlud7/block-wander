# 发布、数据与源码

## 当前交付

主项目为Node本地应用，`sites-app/`为Worker/D1的Sites发布源。Site ID用于现有站点更新，不是凭证。GitHub推送留给用户后续执行。

## 构建

```sh
npm --prefix sites-app ci
npm run site:sync
npm --prefix sites-app run build
```

Node 22.13+。共享规则由esbuild编译到 `sites-app/lib/ranking-service.mjs`，前后端共用规则。构建保留starter的 `sites()` 集成。静态内容在 `dist/client/game/`，Worker及托管配置在 `dist/server/`。

## 数据库

`sites-app/.openai/hosting.json` 声明 `DB`。Schema在 `sites-app/db/schema.ts`，初始迁移为 `sites-app/drizzle/0000_unusual_carmella_unuscione.sql`。只建表和索引，不预填玩家。Sites发布时应用托管迁移。

本机首次预览，在 `sites-app/` 执行：

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_unusual_carmella_unuscione.sql
npm start -- --port 4191
```

每个新数据库只执行一次初始SQL。根目录 `npm start` 使用 `.data/rankings.json`，与本机D1及托管D1都不共用数据。

## 权限与隐私

Sites初始为私有，托管平台负责访问与登录，不上传开发机访客数据。平台身份仅取哈希值作排名键，否则使用HttpOnly匿名Cookie的哈希值。榜单返回匿名键和昵称，不返回邮箱与原Cookie。删除资料移除该身份所有排名与昵称。

当前章节、无尽棋盘、积分、最高分和收藏保存在浏览器，不含跨设备章节同步。待上传成绩只接受当日验证，跨日不补进历史榜，本机个人纪录仍保留。

## 检查与发布

执行 `npm run check` 和 `npm test`。本地服务上用Playwright CLI运行 `scripts/verify-hub.js` 和 `scripts/verify-endless.js`。完整Worker上运行 `node scripts/verify-d1.cjs http://127.0.0.1:4191`。

Sites源码通过仓库凭证与source helper同步，打包构建产物，保存版本后发布。凭证只经stdin传递，不写入仓库。后续更新复用同一Site并保留其访问权限。

## GitHub

`npm run release` 生成源码目录与ZIP，排除本机数据、Git元数据、依赖、构建缓存、运行日志、环境文件与凭证。仓库包含馆藏图片、逐幅CC0许可清单、SQL迁移、检查命令和持续集成配置。
