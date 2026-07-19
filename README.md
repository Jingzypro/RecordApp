# Record

个人记录 App —— 日程 / 待办 / 日记 / 习惯 / 记账 / 订阅 / 生日 / 倒计时。
单文件 PWA，数据通过 Supabase 同步，可安装到 iPhone、iPad、Mac 主屏幕。

## 部署（GitHub Pages）

1. Settings → Pages → Source 选 `main` 分支、根目录 `/`，Save
2. 等 1–2 分钟，页面顶部会显示网址
3. 手机 Safari 打开该网址 → 分享 → 添加到主屏幕

## 更新

把新的 `index.html` 拖进仓库覆盖并提交即可，**网址不变**，
主屏幕图标和已填的同步配置都无需重新设置。

## 说明

Supabase 的地址与公钥由用户在 App 内手动填写、仅保存在本地浏览器，
**不写在代码里**，因此仓库公开也不会泄露。
