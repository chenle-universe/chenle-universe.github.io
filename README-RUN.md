# CHENLE UNIVERSE 运行说明

## 解压
先解压 CHENLE UNIVERSE-source.zip，再把所有 CHENLE UNIVERSE-assets-XX.zip 解压到同一个父目录，合并同名 CHENLE UNIVERSE 文件夹。所有素材包都是独立 ZIP，不是分卷压缩，无需拼接文件。

最终结构应包含 CHENLE UNIVERSE/package.json、app/、components/、data/、lib/、scripts/、public/。public/ 中保留图片、字体、音频/视频（如有）和手势识别模型的原始路径。

## 运行
推荐 Node.js 24 LTS 和 npm。终端进入 CHENLE UNIVERSE 文件夹：

npm ci
npm run dev

浏览器打开 http://localhost:3000 。摄像头/手势功能需要 localhost 或 HTTPS，并由用户主动授权。

## 检查与构建
npm run check
npm test
npm run build

构建生成 out/，可部署到静态网站服务器。不要用双击 HTML 的 file:// 方式测试整个应用。

## 导出范围
包含当前 Git 版本的全部源码、依赖配置及 lockfile、文档、运行所需的全部 public 素材。每个 ZIP 严格小于 32 MiB。
不包含 node_modules、.next、dist、out、.git、缓存、日志、临时文件或环境密钥。安装依赖和执行构建会重新生成所需目录。

EXPORT-MANIFEST.json 列出每个素材包的文件清单、大小和 SHA-256。
