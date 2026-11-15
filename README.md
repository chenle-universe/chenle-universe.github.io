# CHENLE UNIVERSE

粉丝制作的钟辰乐生日互动网站，使用 React / TypeScript / Next.js 静态导出。

- 前端由 GitHub Pages 托管，Actions 在 main 更新后自动发布。
- 共享留言、私人纸条、翻译及管理接口继续使用现有 CHENLE UNIVERSE 后端。
- 管理密钥与访客数据不包含在仓库中。

## 本地开发

```sh
npm ci
npm run dev
```

## 生成 Pages 部署文件

```sh
npm run build:pages
```

生成的 out/ 根目录有 index.html、.nojekyll 和所有静态资源。构建脚本自动适配仓库子路径。完整游戏、图片和 BGM 位于 public/，请保留。

部署配置：.github/workflows/pages.yml。后端的允许来源需设为本仓库的 GitHub Pages 域名，私密访问通过当前浏览器保存的随机访客凭据识别。
