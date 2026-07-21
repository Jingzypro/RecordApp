/* ============================================================
   Record · Service Worker
   作用：把 App 外壳（HTML / 图标 / 星座图）存在本地，
        断网时照样能打开、能看、能改。
   数据本来就在 localStorage，联网后 outbox 会自动补传。

   index.html 走「网络优先」，联网时部署了新版下次打开就是新的，
   不需要动 VERSION。只有当你改了 sw.js 本身、或增删了下面 SHELL 里的
   文件时，才把 VERSION 加 1，用来清掉旧缓存。
   ============================================================ */

var VERSION = 1;
var CACHE   = "record-v" + VERSION;

var SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./zodiac/Aries.webp",     "./zodiac/Taurus.webp",
  "./zodiac/Gemini.webp",    "./zodiac/Cancer.webp",
  "./zodiac/Leo.webp",       "./zodiac/Virgo.webp",
  "./zodiac/Libra.webp",     "./zodiac/Scorpio.webp",
  "./zodiac/Sagittarius.webp","./zodiac/Capricorn.webp",
  "./zodiac/Aquarius.webp",  "./zodiac/Pisces.webp"
];

/* 安装：把外壳全部抓下来。
   单个文件抓失败不能让整次安装失败（比如某张图临时 404），
   所以逐个 add 并吞掉错误。 */
self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) {
        return c.add(new Request(u, { cache: "reload" })).catch(function () {});
      }));
    })
  );
});

/* 激活：清掉旧版本缓存，并立即接管已打开的页面 */
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* 取数策略
   · 只管自己域名下的 GET；Supabase / Open-Meteo 一律放行走网络
   · 页面本体（HTML）：网络优先 → 断网回落缓存
     这样一部署新版，联网时下次打开就是新的，不用清缓存
   · 图标、图片等静态件：缓存优先 → 顺带后台更新，秒开
*/
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;   // 跨域：数据库、天气，不碰

  var isDoc = req.mode === "navigate" ||
              (req.headers.get("accept") || "").indexOf("text/html") >= 0;

  if (isDoc) {
    e.respondWith(
      fetch(req).then(function (r) {
        var copy = r.clone();
        caches.open(CACHE).then(function (c) { c.put("./index.html", copy); });
        return r;
      }).catch(function () {
        return caches.match("./index.html").then(function (r) {
          return r || caches.match("./");
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (r) {
        if (r && r.status === 200 && r.type === "basic") {
          var copy = r.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return r;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});

/* 页面主动要求跳过等待（点了「更新」提示） */
self.addEventListener("message", function (e) {
  if (e.data === "skip-waiting") self.skipWaiting();
});
