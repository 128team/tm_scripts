// ==UserScript==
// @name         YummyAnime - Grid View
// @namespace    https://github.com/128team/tm_scripts
// @version      1.6.6
// @description  Сетка постеров аниме на странице профиля
// @author       d08
// @supportURL   https://github.com/128team/tm_scripts/issues
// @updateURL    https://raw.githubusercontent.com/128team/tm_scripts/main/yummy-grid/yummy-grid.user.js
// @downloadURL  https://raw.githubusercontent.com/128team/tm_scripts/main/yummy-grid/yummy-grid.user.js
// @match        https://ru.yummyani.me/*
// @match        https://yummyani.me/*
// @match        https://site.yummyani.me/*
// @match        *://kodik.info/*
// @match        *://kodik.cc/*
// @match        *://alloha.yani.tv/*
// @grant        none
// @icon         https://raw.githubusercontent.com/128team/assets/main/logo128b.jpeg
// @run-at       document-end
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  // ═══════════════════════════════════════════════════════════
  //  Роутер: yummyani.me → грид + меню, iframe → 128 Player listener
  // ═══════════════════════════════════════════════════════════

  var isYummy = /yummyani\.me$/.test(location.hostname);
  var isInIframe = window !== window.top;

  // внутри iframe — только слушаем команду на открытие плеера
  if (isInIframe) {
    initIframePlayer();
    return;
  }

  // не yummy — выходим (сюда попадём только если @match расширили)
  if (!isYummy) return;

  function initIframePlayer() {
    // CSS для плеера — работает в любом iframe (kodik, alloha, и т.д.)
    var s = document.createElement("style");
    s.textContent = [
      '#ym-p-fab{position:fixed;bottom:10px;right:10px;z-index:2147483647;display:none;align-items:center;gap:6px;padding:7px 14px;background:rgba(15,15,25,.92);backdrop-filter:blur(8px);border:1px solid rgba(100,160,255,.3);border-radius:10px;color:#e0e0e0;font:600 12px/1 "Segoe UI",Arial,sans-serif;cursor:pointer;user-select:none;box-shadow:0 4px 20px rgba(0,0,0,.5);transition:all .25s;}',
      "#ym-p-fab:hover{background:rgba(30,80,190,.92);border-color:rgba(100,160,255,.6);color:#fff;transform:translateY(-2px);}",
      "#ym-p-fab svg{width:14px;height:14px;fill:#7ab8ff;}",
      "#ym-p-fab:hover svg{fill:#fff;}",
      '#ym-player{position:fixed!important;inset:0!important;z-index:2147483647!important;background:#000!important;display:flex!important;flex-direction:column!important;pointer-events:auto!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif!important;}',
      "#ym-player *{pointer-events:auto!important;}",
      "#ym-player video{flex:1;width:100%;min-height:0;object-fit:contain;background:#000;outline:none;}",
      ".ym-p-controls{display:flex;align-items:center;gap:10px;padding:10px 16px;background:linear-gradient(transparent,rgba(0,0,0,.95));color:#ddd;font-size:13px;position:absolute;bottom:0;left:0;right:0;transition:opacity .3s;z-index:10!important;}",
      ".ym-p-controls.hidden{opacity:0;pointer-events:none!important;}",
      ".ym-p-btn{background:none;border:none;color:#ddd;cursor:pointer!important;padding:8px;border-radius:4px;display:flex;align-items:center;justify-content:center;position:relative;z-index:11!important;}",
      ".ym-p-btn:hover{color:#fff;background:rgba(255,255,255,.1);}",
      ".ym-p-btn svg{width:22px;height:22px;fill:currentColor;}",
      ".ym-p-prog{flex:1;height:6px;background:rgba(255,255,255,.15);border-radius:3px;cursor:pointer;position:relative;}",
      ".ym-p-prog:hover{height:10px;}",
      ".ym-p-buf{position:absolute;top:0;left:0;height:100%;background:rgba(255,255,255,.15);border-radius:3px;pointer-events:none;}",
      ".ym-p-bar{position:absolute;top:0;left:0;height:100%;background:#4a9eff;border-radius:3px;pointer-events:none;}",
      ".ym-p-vol{display:flex;align-items:center;gap:6px;}",
      ".ym-p-vol input{-webkit-appearance:none;appearance:none;width:70px;height:4px;background:rgba(255,255,255,.2);border-radius:2px;outline:none;cursor:pointer;}",
      ".ym-p-vol input::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;background:#fff;border-radius:50%;cursor:pointer;}",
      ".ym-p-time{font-size:12px;color:#aaa;font-variant-numeric:tabular-nums;white-space:nowrap;min-width:90px;text-align:center;}",
      ".ym-p-speed{font-size:12px;color:#aaa;cursor:pointer;padding:2px 6px;border-radius:4px;user-select:none;}",
      ".ym-p-speed:hover{color:#fff;background:rgba(255,255,255,.1);}",
      ".ym-p-close{position:absolute!important;top:8px;right:10px;z-index:100!important;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.15);border-radius:50%;width:36px;height:36px;display:flex!important;align-items:center;justify-content:center;cursor:pointer!important;color:#ccc;transition:all .2s;pointer-events:auto!important;}",
      ".ym-p-close:hover{background:rgba(200,40,40,.8);color:#fff;}",
      ".ym-p-close svg{width:16px;height:16px;fill:currentColor;}",
      // skip-кнопка
      // зоны перемотки ±5с (даблклик)
      ".ym-p-zones{position:absolute;inset:0;z-index:5;display:flex;pointer-events:none;}",
      ".ym-p-zone{flex:1;display:flex;align-items:center;justify-content:center;pointer-events:auto!important;cursor:pointer;}",
      ".ym-p-zone-icon{opacity:0;color:#fff;font-size:0;display:flex;flex-direction:column;align-items:center;gap:4px;transition:opacity .15s,transform .15s;transform:scale(.7);pointer-events:none;}",
      ".ym-p-zone-icon.flash{opacity:1;transform:scale(1);}",
      ".ym-p-zone-icon svg{width:36px;height:36px;fill:#fff;}",
      ".ym-p-zone-icon span{font:600 13px/1 inherit;}",
      // центральная иконка play/pause
      ".ym-p-center-ico{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(.7);z-index:6;opacity:0;pointer-events:none;background:rgba(0,0,0,.45);border-radius:50%;width:64px;height:64px;display:flex;align-items:center;justify-content:center;transition:opacity .15s,transform .15s;}",
      ".ym-p-center-ico.flash{opacity:1;transform:translate(-50%,-50%) scale(1);}",
      ".ym-p-center-ico svg{width:32px;height:32px;fill:#fff;}",
      // спиннер буферизации
      ".ym-p-buffering{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:7;pointer-events:none;opacity:0;transition:opacity .2s;}",
      ".ym-p-buffering.visible{opacity:1;}",
      ".ym-p-buffering .ym-spinner{width:48px;height:48px;border:3px solid rgba(255,255,255,.15);border-top-color:#4a9eff;border-radius:50%;animation:ym-spin 0.8s linear infinite;}",
      // skip-кнопка
      ".ym-p-skip{position:absolute!important;bottom:60px;right:16px;z-index:50!important;padding:8px 18px;background:rgba(255,255,255,.12);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.25);border-radius:8px;color:#fff;font:600 13px/1 inherit;cursor:pointer!important;transition:all .2s;display:none;pointer-events:auto!important;}",
      ".ym-p-skip:hover{background:rgba(255,255,255,.25);border-color:rgba(255,255,255,.5);}",
      ".ym-p-skip.visible{display:block;}",
      // popup-меню (quality, speed)
      ".ym-p-popup{position:relative;z-index:11!important;}",
      ".ym-p-popup-menu{display:none;position:absolute;bottom:100%;margin-bottom:8px;background:rgba(15,15,25,.96);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:4px 0;min-width:80px;z-index:200!important;box-shadow:0 8px 32px rgba(0,0,0,.5);}",
      ".ym-p-popup-menu.open{display:block;}",
      ".ym-p-popup-item{display:block;width:100%;padding:6px 14px;background:none;border:none;color:#aaa;font:12px/1 inherit;cursor:pointer!important;text-align:left;white-space:nowrap;}",
      ".ym-p-popup-item:hover{background:rgba(255,255,255,.08);color:#fff;}",
      ".ym-p-popup-item.active{color:#4a9eff;font-weight:700;}",
      // loading-оверлей
      '#ym-p-loading{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;color:#ddd;font:600 16px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}',
      "#ym-p-loading .ym-spinner{width:40px;height:40px;border:3px solid rgba(255,255,255,.15);border-top-color:#4a9eff;border-radius:50%;animation:ym-spin 0.8s linear infinite;}",
      "@keyframes ym-spin{to{transform:rotate(360deg);}}",
      // === мобильная адаптация ===
      "@media(pointer:coarse),(max-width:768px){",
      ".ym-p-controls{gap:6px;padding:10px 10px;}",
      ".ym-p-btn{padding:12px;}",
      ".ym-p-btn svg{width:26px;height:26px;}",
      ".ym-p-prog{height:12px!important;}", // толще для пальцев, без hover
      ".ym-p-close{width:44px;height:44px;}",
      ".ym-p-close svg{width:20px;height:20px;}",
      ".ym-p-skip{padding:12px 22px;font-size:14px;bottom:70px;}",
      ".ym-p-time{font-size:11px;min-width:70px;}",
      ".ym-p-speed{font-size:13px;padding:6px 10px;}",
      ".ym-p-vol{display:none!important;}", // скрываем громкость на мобилке (iOS не поддерживает)
      ".ym-p-popup-item{padding:10px 16px;font-size:14px;}",
      ".ym-p-zone-icon svg{width:44px;height:44px;}",
      ".ym-p-zone-icon span{font-size:14px;}",
      ".ym-p-center-ico{width:76px;height:76px;}",
      ".ym-p-center-ico svg{width:38px;height:38px;}",
      "}",
    ].join("");
    document.head.appendChild(s);

    var PICO = {
      play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
      pause:
        '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>',
      vol: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
      volM: '<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
      fs: '<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
      fsX: '<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>',
      pip: '<svg viewBox="0 0 24 24"><path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/></svg>',
      close:
        '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
      skip90:
        '<svg viewBox="0 0 24 24"><path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2z"/><text x="12" y="14.5" text-anchor="middle" font-size="7" font-weight="700" fill="currentColor" font-family="sans-serif">90</text></svg>',
      rew5: '<svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/><text x="12" y="14.5" text-anchor="middle" font-size="8" font-weight="700" fill="currentColor" font-family="sans-serif">5</text></svg>',
      fwd5: '<svg viewBox="0 0 24 24"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/><text x="12" y="14.5" text-anchor="middle" font-size="8" font-weight="700" fill="currentColor" font-family="sans-serif">5</text></svg>',
      next: '<svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>',
    };
    var SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    // === сохранение настроек ===
    function getSavedSpeed() {
      try {
        return parseFloat(localStorage.getItem("ymp-speed")) || 1;
      } catch (ex) {
        return 1;
      }
    }
    function saveSpeed(sp) {
      try {
        localStorage.setItem("ymp-speed", String(sp));
      } catch (ex) {}
    }
    function getSavedQuality() {
      try {
        return localStorage.getItem("ymp-quality") || "";
      } catch (ex) {
        return "";
      }
    }
    function saveQuality(q) {
      try {
        localStorage.setItem("ymp-quality", q);
      } catch (ex) {}
    }
    // таймкод: ключ = pathname из referrer или location
    function getTimeKey() {
      try {
        var ref = document.referrer || "";
        var m = ref.match(/\/anime\/([^?#]+)/);
        var base = m ? m[1] : location.pathname;
        var search = location.search || "";
        return "ymp-time:" + base + search;
      } catch (ex) {
        return "";
      }
    }
    function getSavedTime() {
      var key = getTimeKey();
      if (!key) return 0;
      try {
        return parseFloat(localStorage.getItem(key)) || 0;
      } catch (ex) {
        return 0;
      }
    }
    function saveTime(t) {
      var key = getTimeKey();
      if (!key) return;
      try {
        if (t > 5) localStorage.setItem(key, String(Math.floor(t)));
        else localStorage.removeItem(key);
      } catch (ex) {}
    }
    // чистим таймкоды: если больше 100 записей — оставляем 50 свежих
    function cleanOldTimecodes() {
      try {
        if (sessionStorage.getItem("ymp-tc-cleaned")) return;
        sessionStorage.setItem("ymp-tc-cleaned", "1");
        var toRemove = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf("ymp-time:") === 0) toRemove.push(k);
        }
        if (toRemove.length > 100) {
          toRemove.sort(function (a, b) {
            return (
              (parseFloat(localStorage.getItem(a)) || 0) -
              (parseFloat(localStorage.getItem(b)) || 0)
            );
          });
          for (var j = 0; j < toRemove.length - 50; j++) {
            localStorage.removeItem(toRemove[j]);
          }
        }
      } catch (ex) {}
    }
    cleanOldTimecodes();

    function fmt(sec) {
      if (!isFinite(sec)) return "0:00";
      var h = Math.floor(sec / 3600),
        m = Math.floor((sec % 3600) / 60),
        ss = Math.floor(sec % 60);
      return h
        ? h +
            ":" +
            String(m).padStart(2, "0") +
            ":" +
            String(ss).padStart(2, "0")
        : m + ":" + String(ss).padStart(2, "0");
    }
    function btn(ico) {
      var b = document.createElement("button");
      b.className = "ym-p-btn";
      b.innerHTML = ico;
      return b;
    }

    // парсим skip-тайминги из URL: skip_button=[opening]0-89,[ending]1375-1409 (kodik)
    function parseSkips() {
      var skips = [];
      try {
        var raw = new URLSearchParams(location.search).get("skip_button") || "";
        var re = /\[(\w+)\](\d+)-(\d+)/g,
          m;
        while ((m = re.exec(raw)) !== null) {
          var label =
            m[1] === "opening"
              ? "Пропустить интро"
              : m[1] === "ending"
                ? "Пропустить эндинг"
                : "Пропустить";
          skips.push({ label: label, start: +m[2], end: +m[3] });
        }
      } catch (ex) {}
      // НЕ добавляем фолбэк — для alloha скипы берём из DOM оригинала
      return skips;
    }
    var skipRanges = parseSkips();

    // ищем оригинальную skip-кнопку в DOM (alloha, и др.)
    // селекторы кнопок пропуска в разных плеерах
    var ORIG_SKIP_SELECTORS =
      '.skip_button, .vjs-skip-button, [class*="skip" i]:not(script):not(style), [class*="Skip"]:not(script):not(style), button[class*="intro"], button[class*="Intro"]';

    function findOrigSkipBtn() {
      var els = document.querySelectorAll(ORIG_SKIP_SELECTORS);
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        // только видимые кнопки (display !== none, offsetParent !== null)
        if (
          el.offsetParent !== null ||
          getComputedStyle(el).display !== "none"
        ) {
          return el;
        }
      }
      return null;
    }

    // Собираем качество из оригинального плеера
    function collectQualities() {
      var items = []; // [{label, el}]

      // === kodik ===
      document
        .querySelectorAll(
          ".quality_button, [data-quality], .bespierde_quality_button",
        )
        .forEach(function (el) {
          var q = el.dataset.quality || el.textContent.trim();
          if (
            q &&
            q.length < 15 &&
            !items.some(function (r) {
              return r.label === q;
            })
          )
            items.push({ label: q, el: el });
        });
      if (items.length) return items;

      // === allplay (alloha): кнопка "Качество" → кликаем → собираем подменю ===
      var qualityBtn = null;
      document
        .querySelectorAll('[data-allplay="settings"]')
        .forEach(function (btn) {
          var t = btn.textContent.toLowerCase();
          if (t.indexOf("качество") !== -1 || t.indexOf("quality") !== -1)
            qualityBtn = btn;
        });
      if (qualityBtn) {
        // запоминаем как allplay-quality для асинхронного сбора
        items._allplayQualityBtn = qualityBtn;
      }

      return items;
    }

    // слушаем команду от родителя (yummyani.me)
    window.addEventListener("message", function (e) {
      if (e.data !== "ym-open-player") return;
      if (
        document.getElementById("ym-player") ||
        document.getElementById("ym-p-loading")
      )
        return;

      var v = document.querySelector("video:not(.rmp-ad-vast-video-player)");
      // если видео готово и может воспроизводиться — сразу открываем
      if (v && (v.currentSrc || v.src) && v.readyState >= 2) {
        openP(v);
        return;
      }

      // видео не готово — показываем loading и запускаем оригинальный плеер
      var loading = document.createElement("div");
      loading.id = "ym-p-loading";
      loading.innerHTML =
        '<div class="ym-spinner"></div><div>Загрузка видео...</div>';
      document.body.appendChild(loading);

      // кликаем play в оригинальном плеере
      var playSelectors =
        '.play_button, .vjs-big-play-button, .fp-play, [data-allplay="playpause"], [data-allplay="play"], .allplay__play, .video_play_button, [class*="play-btn"], [class*="play_btn"], .play-button, button[aria-label="Play"]';
      var playBtns = document.querySelectorAll(playSelectors);
      playBtns.forEach(function (b) {
        b.click();
      });

      // также пробуем video.play() напрямую
      var vid = document.querySelector("video:not(.rmp-ad-vast-video-player)");
      if (vid) {
        try {
          vid.play().catch(function () {});
        } catch (ex) {}
      }

      // если play кнопку не нашли — клик по центру (по видео-контейнеру)
      if (!playBtns.length) {
        var center = document.elementFromPoint(
          window.innerWidth / 2,
          window.innerHeight / 2,
        );
        if (center && center !== document.body) center.click();
      }
      console.log(
        "[128 Player] запуск воспроизведения, play кнопок:",
        playBtns.length,
        "video:",
        !!vid,
      );

      // закрытие loading по Escape
      function onEscLoading(ev) {
        if (ev.key === "Escape") {
          cleanup();
        }
      }
      document.addEventListener("keydown", onEscLoading);

      function cleanup() {
        clearInterval(pollTimer);
        if (obs) obs.disconnect();
        document.removeEventListener("keydown", onEscLoading);
        var ld = document.getElementById("ym-p-loading");
        if (ld) ld.remove();
      }

      function onVideoReady() {
        var v2 = document.querySelector("video:not(.rmp-ad-vast-video-player)");
        if (v2 && (v2.currentSrc || v2.src) && v2.readyState >= 2) {
          cleanup();
          openP(v2);
          return true;
        }
        return false;
      }

      // повторяем клик по play на попытках 3, 7, 12 (кодик может быть не готов)
      var attempts = 0;
      var pollTimer = setInterval(function () {
        attempts++;
        if (attempts === 3 || attempts === 7 || attempts === 12) {
          document.querySelectorAll(playSelectors).forEach(function (b) {
            b.click();
          });
        }
        if (onVideoReady() || attempts >= 50) {
          clearInterval(pollTimer);
          if (attempts >= 50) {
            cleanup();
            console.log("[128 Player] видео не загрузилось за 15с");
          }
        }
      }, 300);

      // MutationObserver: следим за src и новыми video-элементами
      var obs = new MutationObserver(function () {
        onVideoReady();
      });
      obs.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["src"],
      });
      setTimeout(function () {
        if (obs) {
          obs.disconnect();
          obs = null;
        }
      }, 16000);
    });

    function openP(video) {
      if (document.getElementById("ym-player")) return;

      var wasPaused = video.paused;
      var origStyle = video.getAttribute("style") || "";
      var origParent = video.parentElement;
      var origNext = video.nextSibling;

      video.removeAttribute("style");

      var ov = document.createElement("div");
      ov.id = "ym-player";
      var cl = document.createElement("div");
      cl.className = "ym-p-close";
      cl.innerHTML = PICO.close;
      var ct = document.createElement("div");
      ct.className = "ym-p-controls";

      var bPlay = btn(PICO.play);
      var prog = document.createElement("div");
      prog.className = "ym-p-prog";
      var pBuf = document.createElement("div");
      pBuf.className = "ym-p-buf";
      var pBar = document.createElement("div");
      pBar.className = "ym-p-bar";
      prog.append(pBuf, pBar);

      var time = document.createElement("span");
      time.className = "ym-p-time";
      time.textContent = fmt(video.currentTime) + " / " + fmt(video.duration);

      var vw = document.createElement("div");
      vw.className = "ym-p-vol";
      var bVol = btn(PICO.vol);
      var vol = document.createElement("input");
      vol.type = "range";
      vol.min = "0";
      vol.max = "1";
      vol.step = "0.05";
      vol.value = String(video.volume);
      vw.append(bVol, vol);

      var savedSpd = getSavedSpeed();
      var targetSpeed = savedSpd;
      var spd = document.createElement("span");
      spd.className = "ym-p-speed";
      spd.textContent = savedSpd + "x";
      video.playbackRate = savedSpd;
      // защита от сброса скорости оригинальным плеером
      function onRateChange() {
        if (Math.abs(video.playbackRate - targetSpeed) > 0.01) {
          video.playbackRate = targetSpeed;
        }
      }
      video.addEventListener("ratechange", onRateChange);
      // кнопка +90с (скип интро)
      var bSkip90 = btn(PICO.skip90);
      bSkip90.title = "Пропустить 90 сек (N)";
      bSkip90.addEventListener("click", function (e) {
        e.stopPropagation();
        video.currentTime = Math.min(video.duration, video.currentTime + 90);
      });

      var bPip = btn(PICO.pip);
      var bFs = btn(PICO.fs);

      // --- skip-кнопка (авто) ---
      // Два режима: 1) по таймингам из URL (kodik), 2) зеркало оригинальной кнопки (alloha и др.)
      var skipBtn = document.createElement("div");
      skipBtn.className = "ym-p-skip";
      skipBtn.textContent = "Пропустить";
      var origSkipRef = null; // ссылка на оригинальную кнопку (для alloha)
      skipBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        // если есть оригинальная кнопка — кликаем по ней
        if (origSkipRef) {
          origSkipRef.click();
          skipBtn.classList.remove("visible");
          return;
        }
        // иначе используем skipRanges (kodik)
        for (var i = 0; i < skipRanges.length; i++) {
          var sr = skipRanges[i];
          if (video.currentTime >= sr.start && video.currentTime < sr.end) {
            video.currentTime = sr.end;
            break;
          }
        }
      });

      // --- кнопка следующей серии ---
      var bNext = btn(PICO.next);
      bNext.title = "Следующая серия (Shift+N)";
      bNext.addEventListener("click", function (e) {
        e.stopPropagation();
        // закрываем плеер и отправляем команду родителю
        closeP();
        window.top.postMessage("ym-next-episode", "*");
      });

      // --- quality popup ---
      var qWrap = document.createElement("div");
      qWrap.className = "ym-p-popup";
      var qBtn = document.createElement("span");
      qBtn.className = "ym-p-speed";
      qBtn.textContent = "HD";
      var qMenu = document.createElement("div");
      qMenu.className = "ym-p-popup-menu";
      qWrap.append(qBtn, qMenu);
      qWrap.style.display = "none";

      var savedQ = getSavedQuality();
      function fillQualityMenu(items) {
        if (!items.length) return;
        qMenu.innerHTML = "";
        var autoClicked = false;
        items.forEach(function (qObj) {
          var it = document.createElement("button");
          it.className = "ym-p-popup-item";
          it.textContent = qObj.label;
          it.addEventListener("click", function (e) {
            e.stopPropagation();
            if (qObj.el) qObj.el.click();
            qBtn.textContent = qObj.label;
            saveQuality(qObj.label);
            qMenu.querySelectorAll(".ym-p-popup-item").forEach(function (x) {
              x.classList.toggle("active", x === it);
            });
            qMenu.classList.remove("open");
          });
          if (savedQ && qObj.label === savedQ) {
            it.classList.add("active");
            qBtn.textContent = qObj.label;
            if (!autoClicked && qObj.el) {
              autoClicked = true;
              setTimeout(function () {
                qObj.el.click();
              }, 300);
            }
          }
          qMenu.appendChild(it);
        });
        qWrap.style.display = "";
      }

      qBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        spdMenu.classList.remove("open"); // закрыть speed если открыт
        qMenu.classList.toggle("open");
      });

      // пробуем собрать quality
      var qIntervals = []; // для очистки при closeP
      var initQ = collectQualities();
      if (initQ.length) {
        fillQualityMenu(initQ);
      } else if (initQ._allplayQualityBtn) {
        // allplay: нужно кликнуть кнопку, подождать рендер, собрать пункты
        var aqBtn = initQ._allplayQualityBtn;
        // ждём когда видео заиграет и allplay будет готов
        var qAtt = 0;
        var qIv = setInterval(function () {
          qAtt++;
          aqBtn.click();
          setTimeout(function () {
            var found = [];
            document
              .querySelectorAll('[role="menuitemradio"], [role="menuitem"]')
              .forEach(function (mi) {
                if (mi.getAttribute("aria-haspopup") === "true") return;
                if (mi.getAttribute("data-allplay") === "settings") return;
                var t = mi.textContent.trim();
                var m = t.match(/(\d{3,4}p)/i);
                if (
                  m &&
                  !found.some(function (f) {
                    return f.label === m[1];
                  })
                ) {
                  found.push({ label: m[1], el: mi });
                }
              });
            var backBtn = document.querySelector(
              '[data-allplay="back"], .allplay__menu__back',
            );
            if (backBtn) backBtn.click();
            var closeMenu = document.querySelector(".allplay__menu");
            if (closeMenu) closeMenu.style.display = "none";
            setTimeout(function () {
              if (closeMenu) closeMenu.style.display = "";
            }, 50);

            if (found.length) {
              fillQualityMenu(found);
              clearInterval(qIv);
            }
          }, 200);
          if (qAtt >= 8) clearInterval(qIv);
        }, 800);
        qIntervals.push(qIv);
      } else {
        // generic fallback — пробуем с задержкой
        var qAtt2 = 0;
        var qIv2 = setInterval(function () {
          qAtt2++;
          var q = collectQualities();
          if (q.length) {
            fillQualityMenu(q);
            clearInterval(qIv2);
          }
          if (qAtt2 >= 8) clearInterval(qIv2);
        }, 500);
        qIntervals.push(qIv2);
      }

      // --- speed popup ---
      var spdWrap = document.createElement("div");
      spdWrap.className = "ym-p-popup";
      var spdMenu = document.createElement("div");
      spdMenu.className = "ym-p-popup-menu";
      spdWrap.append(spd, spdMenu);

      SPEEDS.forEach(function (sp) {
        var it = document.createElement("button");
        it.className = "ym-p-popup-item";
        if (sp === savedSpd) it.classList.add("active");
        it.textContent = sp + "x";
        it.addEventListener("click", function (e) {
          e.stopPropagation();
          targetSpeed = sp;
          video.playbackRate = sp;
          spd.textContent = sp + "x";
          saveSpeed(sp);
          spdMenu.querySelectorAll(".ym-p-popup-item").forEach(function (x) {
            x.classList.toggle("active", x === it);
          });
          spdMenu.classList.remove("open");
        });
        spdMenu.appendChild(it);
      });

      spd.addEventListener("click", function (e) {
        e.stopPropagation();
        qMenu.classList.remove("open"); // закрыть quality если открыт
        spdMenu.classList.toggle("open");
      });

      // закрытие popup по клику вне
      function onDocClickPopup() {
        qMenu.classList.remove("open");
        spdMenu.classList.remove("open");
      }
      document.addEventListener("click", onDocClickPopup);

      ct.append(
        bPlay,
        bNext,
        bSkip90,
        prog,
        time,
        vw,
        qWrap,
        spdWrap,
        bPip,
        bFs,
      );

      // --- зоны перемотки ±5с (даблклик слева/справа по видео) ---
      var zones = document.createElement("div");
      zones.className = "ym-p-zones";
      var zoneL = document.createElement("div");
      zoneL.className = "ym-p-zone";
      var zoneR = document.createElement("div");
      zoneR.className = "ym-p-zone";
      var icoL = document.createElement("div");
      icoL.className = "ym-p-zone-icon";
      icoL.innerHTML = PICO.rew5 + "<span>−5 сек</span>";
      var icoR = document.createElement("div");
      icoR.className = "ym-p-zone-icon";
      icoR.innerHTML = PICO.fwd5 + "<span>+5 сек</span>";
      zoneL.appendChild(icoL);
      zoneR.appendChild(icoR);
      zones.append(zoneL, zoneR);

      // центральная иконка play/pause
      var centerIco = document.createElement("div");
      centerIco.className = "ym-p-center-ico";
      var centerTimer = null;

      // спиннер буферизации
      var bufSpinner = document.createElement("div");
      bufSpinner.className = "ym-p-buffering";
      bufSpinner.innerHTML = '<div class="ym-spinner"></div>';
      var bufTimer = null;
      function onWaiting() {
        // показываем спиннер с небольшой задержкой (чтобы не мигать на коротких буферизациях)
        if (bufTimer) clearTimeout(bufTimer);
        bufTimer = setTimeout(function () {
          bufSpinner.classList.add("visible");
        }, 300);
      }
      function onCanPlay() {
        if (bufTimer) {
          clearTimeout(bufTimer);
          bufTimer = null;
        }
        bufSpinner.classList.remove("visible");
      }
      video.addEventListener("waiting", onWaiting);
      video.addEventListener("playing", onCanPlay);
      video.addEventListener("seeked", onCanPlay);
      video.addEventListener("canplay", onCanPlay);

      function flashIcon(ico) {
        ico.classList.add("flash");
        setTimeout(function () {
          ico.classList.remove("flash");
        }, 400);
      }
      function flashCenter(svgHtml) {
        centerIco.innerHTML = svgHtml;
        centerIco.classList.remove("flash");
        void centerIco.offsetWidth; // reflow для рестарта анимации
        centerIco.classList.add("flash");
        if (centerTimer) clearTimeout(centerTimer);
        centerTimer = setTimeout(function () {
          centerIco.classList.remove("flash");
        }, 500);
      }

      // общий флаг drag — зоны должны его видеть
      var drag = false;

      // double-tap/double-click: лево -5с, право +5с (unified для mouse и touch)
      var lastTapTime = 0,
        lastTapZone = null;
      function handleDoubleTap(zone, seekFn, ico) {
        var now = Date.now();
        if (lastTapZone === zone && now - lastTapTime < 350) {
          // double-tap
          lastTapTime = 0;
          lastTapZone = null;
          if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
          }
          seekFn();
          flashIcon(ico);
          return true;
        }
        lastTapTime = now;
        lastTapZone = zone;
        return false;
      }

      // одиночный клик/tap на зонах — play/pause, но НЕ если был drag или double-tap
      var clickTimer = null;
      function zoneInteract(zone, e) {
        e.stopPropagation();
        if (drag) return;
        // проверяем double-tap
        var seekFn, ico;
        if (zone === zoneL) {
          seekFn = function () {
            video.currentTime = Math.max(0, video.currentTime - 5);
          };
          ico = icoL;
        } else {
          seekFn = function () {
            video.currentTime = Math.min(video.duration, video.currentTime + 5);
          };
          ico = icoR;
        }
        if (handleDoubleTap(zone, seekFn, ico)) return;
        // одиночный — play/pause с задержкой (ждём возможный второй tap)
        if (clickTimer) {
          clearTimeout(clickTimer);
          clickTimer = null;
          return;
        }
        clickTimer = setTimeout(function () {
          clickTimer = null;
          video.paused ? video.play() : video.pause();
        }, 350);
      }
      zoneL.addEventListener("click", function (e) {
        zoneInteract(zoneL, e);
      });
      zoneR.addEventListener("click", function (e) {
        zoneInteract(zoneR, e);
      });

      ov.append(cl, skipBtn, video, zones, centerIco, bufSpinner, ct);
      document.body.appendChild(ov);
      // восстанавливаем сохранённый таймкод
      var savedTime = getSavedTime();
      if (savedTime > 0) {
        function applyTime() {
          if (video.duration && savedTime < video.duration - 2)
            video.currentTime = savedTime;
        }
        if (video.duration) {
          applyTime();
        } else {
          // duration ещё не готов — пробуем через первый timeupdate (loadedmetadata мог уже пройти)
          function onFirstUpdate() {
            video.removeEventListener("timeupdate", onFirstUpdate);
            video.removeEventListener("loadedmetadata", onFirstUpdate);
            applyTime();
          }
          video.addEventListener("timeupdate", onFirstUpdate);
          video.addEventListener("loadedmetadata", onFirstUpdate);
        }
      }
      video.play();

      // блокируем события от плеера-хоста
      ov.addEventListener("mousedown", function (e) {
        e.stopPropagation();
      });
      ov.addEventListener("touchstart", function (e) {
        e.stopPropagation();
      });

      // auto-hide
      var ht;
      function show() {
        ct.classList.remove("hidden");
        cl.style.opacity = "1";
        ov.style.cursor = "";
        clearTimeout(ht);
        ht = setTimeout(function () {
          if (!video.paused) {
            ct.classList.add("hidden");
            cl.style.opacity = "0";
            ov.style.cursor = "none";
          }
        }, 3000);
      }
      ov.addEventListener("mousemove", show);
      ov.addEventListener("touchstart", show, { passive: true });
      show();

      var skipNextFlash = true; // не мигать при первом play() после открытия
      function syncP() {
        var isPaused = video.paused;
        bPlay.innerHTML = isPaused ? PICO.play : PICO.pause;
        if (skipNextFlash) {
          skipNextFlash = false;
          return;
        }
        // play → показываем ▶, pause → показываем ⏸
        flashCenter(isPaused ? PICO.pause : PICO.play);
      }
      function onPause() {
        syncP();
        show();
      }
      video.addEventListener("play", syncP);
      video.addEventListener("pause", onPause);
      bPlay.addEventListener("click", function () {
        video.paused ? video.play() : video.pause();
      });
      // play/pause по клику на видео теперь через зоны (с поддержкой даблклика)

      var lastTimeSave = 0;
      function onTimeUpdate() {
        if (!video.duration) return;
        pBar.style.width = (video.currentTime / video.duration) * 100 + "%";
        time.textContent = fmt(video.currentTime) + " / " + fmt(video.duration);
        // сохраняем таймкод каждые 5 секунд
        var now = Date.now();
        if (now - lastTimeSave > 5000) {
          lastTimeSave = now;
          saveTime(video.currentTime);
        }

        // skip: режим 1 — по таймингам из URL (kodik)
        if (skipRanges.length) {
          var activeSkip = null;
          for (var i = 0; i < skipRanges.length; i++) {
            if (
              video.currentTime >= skipRanges[i].start &&
              video.currentTime < skipRanges[i].end
            ) {
              activeSkip = skipRanges[i];
              break;
            }
          }
          if (activeSkip) {
            skipBtn.textContent = activeSkip.label;
            skipBtn.classList.add("visible");
            origSkipRef = null;
          } else {
            skipBtn.classList.remove("visible");
          }
        } else {
          // skip: режим 2 — зеркалим оригинальную кнопку (alloha и др.)
          var origBtn = findOrigSkipBtn();
          if (origBtn) {
            origSkipRef = origBtn;
            skipBtn.textContent = origBtn.textContent.trim() || "Пропустить";
            skipBtn.classList.add("visible");
          } else {
            origSkipRef = null;
            skipBtn.classList.remove("visible");
          }
        }
      }
      video.addEventListener("timeupdate", onTimeUpdate);
      function onProgress() {
        if (video.buffered.length && video.duration)
          pBuf.style.width =
            (video.buffered.end(video.buffered.length - 1) / video.duration) *
              100 +
            "%";
      }
      video.addEventListener("progress", onProgress);

      // drag уже объявлен выше (общий флаг с зонами)
      function seekFromEvent(e) {
        var r = prog.getBoundingClientRect();
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
        video.currentTime = pct * (video.duration || 0);
      }
      function stopDrag() {
        document.removeEventListener("mousemove", onDragMove, true);
        document.removeEventListener("mouseup", onDragEnd, true);
        document.removeEventListener("mouseleave", onDragEnd, true);
        document.removeEventListener("touchmove", onTouchDragMove, true);
        document.removeEventListener("touchend", onDragEnd, true);
        document.removeEventListener("touchcancel", onDragEnd, true);
        window.removeEventListener("blur", stopDrag);
        if (drag)
          setTimeout(function () {
            drag = false;
          }, 50);
      }
      function onDragMove(e) {
        if (!drag) {
          stopDrag();
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        seekFromEvent(e);
      }
      function onTouchDragMove(e) {
        if (!drag) {
          stopDrag();
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        seekFromEvent(e);
      }
      function onDragEnd() {
        stopDrag();
      }
      // mouse
      prog.addEventListener("mousedown", function (e) {
        e.preventDefault();
        e.stopPropagation();
        drag = true;
        seekFromEvent(e);
        document.addEventListener("mousemove", onDragMove, true);
        document.addEventListener("mouseup", onDragEnd, true);
        document.addEventListener("mouseleave", onDragEnd, true);
        window.addEventListener("blur", stopDrag);
      });
      // touch
      prog.addEventListener("touchstart", function (e) {
        e.preventDefault();
        e.stopPropagation();
        drag = true;
        seekFromEvent(e);
        document.addEventListener("touchmove", onTouchDragMove, true);
        document.addEventListener("touchend", onDragEnd, true);
        document.addEventListener("touchcancel", onDragEnd, true);
      });

      vol.addEventListener("input", function () {
        video.volume = +vol.value;
        video.muted = false;
        bVol.innerHTML = video.volume === 0 ? PICO.volM : PICO.vol;
      });
      bVol.addEventListener("click", function () {
        video.muted = !video.muted;
        bVol.innerHTML = video.muted ? PICO.volM : PICO.vol;
      });
      bPip.addEventListener("click", function () {
        document.pictureInPictureElement
          ? document.exitPictureInPicture()
          : video.requestPictureInPicture && video.requestPictureInPicture();
      });

      var isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      function isFs() {
        return !!(
          document.fullscreenElement || document.webkitFullscreenElement
        );
      }
      function syncFs() {
        bFs.innerHTML = isFs() ? PICO.fsX : PICO.fs;
      }
      function toggleFs() {
        if (isFs()) {
          if (document.exitFullscreen) document.exitFullscreen();
          else if (document.webkitExitFullscreen)
            document.webkitExitFullscreen();
        } else if (isIOS && video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen();
        } else if (ov.requestFullscreen) {
          ov.requestFullscreen();
        } else if (ov.webkitRequestFullscreen) {
          ov.webkitRequestFullscreen();
        }
      }
      bFs.addEventListener("click", toggleFs);
      document.addEventListener("fullscreenchange", syncFs);
      document.addEventListener("webkitfullscreenchange", syncFs);
      video.addEventListener("webkitbeginfullscreen", syncFs);
      video.addEventListener("webkitendfullscreen", syncFs);

      function closeP() {
        saveTime(video.currentTime);
        if (isFs()) {
          if (document.exitFullscreen) document.exitFullscreen();
          else if (document.webkitExitFullscreen)
            document.webkitExitFullscreen();
        }
        // снимаем все listener'ы с video
        video.removeEventListener("play", syncP);
        video.removeEventListener("pause", onPause);
        video.removeEventListener("timeupdate", onTimeUpdate);
        video.removeEventListener("progress", onProgress);
        video.removeEventListener("ratechange", onRateChange);
        video.removeEventListener("waiting", onWaiting);
        video.removeEventListener("playing", onCanPlay);
        video.removeEventListener("seeked", onCanPlay);
        video.removeEventListener("canplay", onCanPlay);
        if (bufTimer) {
          clearTimeout(bufTimer);
          bufTimer = null;
        }
        video.removeAttribute("style");
        if (origStyle) video.setAttribute("style", origStyle);
        if (origNext) origParent.insertBefore(video, origNext);
        else origParent.appendChild(video);
        video.playbackRate = 1; // сбрасываем скорость при возврате
        if (wasPaused) video.pause();
        ov.remove();
        document.removeEventListener("fullscreenchange", syncFs);
        document.removeEventListener("webkitfullscreenchange", syncFs);
        video.removeEventListener("webkitbeginfullscreen", syncFs);
        video.removeEventListener("webkitendfullscreen", syncFs);
        document.removeEventListener("keydown", onKey);
        document.removeEventListener("click", onDocClickPopup);
        // чистим интервалы сбора качества
        qIntervals.forEach(function (iv) {
          clearInterval(iv);
        });
        qIntervals.length = 0;
      }
      cl.addEventListener("click", closeP);

      function onKey(e) {
        if (!document.getElementById("ym-player")) return;
        switch (e.key) {
          case " ":
          case "k":
            e.preventDefault();
            video.paused ? video.play() : video.pause();
            break;
          case "ArrowLeft":
            e.preventDefault();
            video.currentTime -= 5;
            flashIcon(icoL);
            break;
          case "ArrowRight":
            e.preventDefault();
            video.currentTime += 5;
            flashIcon(icoR);
            break;
          case "ArrowUp":
            e.preventDefault();
            video.volume = Math.min(1, video.volume + 0.05);
            vol.value = video.volume;
            break;
          case "ArrowDown":
            e.preventDefault();
            video.volume = Math.max(0, video.volume - 0.05);
            vol.value = video.volume;
            break;
          case "f":
            toggleFs();
            break;
          case "p":
            bPip.click();
            break;
          case "m":
            video.muted = !video.muted;
            bVol.innerHTML = video.muted ? PICO.volM : PICO.vol;
            break;
          case "s":
            if (skipBtn.classList.contains("visible")) skipBtn.click();
            break;
          case "n":
            video.currentTime = Math.min(
              video.duration,
              video.currentTime + 90,
            );
            break;
          case "N":
            e.preventDefault();
            bNext.click();
            break; // Shift+N
          case "Escape":
            closeP();
            break;
        }
      }
      document.addEventListener("keydown", onKey);
    }
  }

  //  CSS - 70 строк !important-ада, потому что сайт тоже любит !important
  //  кто первый !important поставил - тот и д'артаньян, остальные - CSS

  const css = document.createElement("style");
  css.textContent = [
    // FAB-кнопка. z-index: максимальный int32, чтобы НИЧТО не перекрыло наш кружок
    "#ym-menu-btn{position:fixed!important;top:10px;left:10px;z-index:2147483647!important;width:50px!important;height:50px!important;border-radius:50%!important;cursor:grab!important;box-shadow:0 4px 20px rgba(0,0,0,.7)!important;overflow:hidden!important;padding:0!important;border:2px solid rgba(255,255,255,.25)!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;transition:border-color .2s!important;background:#1e1e2e!important;}",
    "#ym-menu-btn:hover{border-color:rgba(255,255,255,.7)!important;}",
    "#ym-menu-btn:active{cursor:grabbing!important;}",
    "#ym-menu-btn img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;}",
    // Dropdown - позиция через JS, потому что CSS не знает где кнопка после drag
    '#ym-dropdown{display:none;position:fixed;z-index:2147483646;background:#1b2028;border:1px solid #2e3d4d;border-radius:12px;padding:6px 0;box-shadow:0 12px 48px rgba(0,0,0,.6);min-width:195px;font-family:"Open Sans",Arial,sans-serif;font-size:12px;color:#d0d8e2;}',
    "#ym-dropdown.open{display:block;}",
    // меню. да, это всё руками. нет, мы не используем UI-фреймворк для 3 свитчей
    ".ym-menu-item{display:flex;align-items:center;justify-content:space-between;padding:7px 14px;color:#b0bcc8;font-size:0.96em;user-select:none;gap:10px;}",
    ".ym-menu-item:hover{background:rgba(255,255,255,.04);}",
    ".ym-menu-label{flex:1;display:flex;flex-direction:column;gap:1px;}",
    ".ym-menu-desc{font-size:0.78em;color:#455a6a;line-height:1.3;}",
    // заголовок секции (copy-paste из SG Toolkit, и чё?)
    ".ym-section-title{font-size:0.75em;text-transform:uppercase;letter-spacing:1.2px;color:#5a7a8a;padding:8px 14px 3px;border-top:1px solid rgba(255,255,255,.06);}",
    // iOS-тогл. сворован у Apple, как и всё хорошее в вебе
    ".ym-sw{position:relative;display:block;width:36px;min-width:36px;height:20px;flex-shrink:0;}",
    ".ym-sw input{opacity:0;width:0;height:0;position:absolute;}",
    ".ym-sw .sl{position:absolute;cursor:pointer;top:0;left:0;width:36px;height:20px;background:#2a2a38;border-radius:20px;transition:.25s;}",
    '.ym-sw .sl::before{content:"";position:absolute;height:14px;width:14px;left:3px;top:3px;background:#556;border-radius:50%;transition:.25s;}',
    ".ym-sw input:disabled+.sl{opacity:.35;cursor:not-allowed;}",
    ".ym-sw input:checked+.sl{background:#28603a;}",
    ".ym-sw input:checked+.sl::before{transform:translateX(16px);background:#4ecb71;}",
    // кнопки выбора колонок - 3x 4x 5x 6x, как пиво в ларьке
    ".ym-size-row{display:flex;gap:3px;padding:3px 12px 8px;}",
    ".ym-size-btn{flex:1;background:#111820;border:1px solid #2e3d4d;border-radius:5px;color:#607080;font-size:11px;font-family:inherit;padding:5px 0;cursor:pointer;transition:all .15s;}",
    ".ym-size-btn:hover{background:#1e2d3d;color:#b0bcc8;border-color:#4a8ab5;}",
    ".ym-size-btn.active{background:#1e3a5a;border-color:#4a8ab5;color:#7ab8e0;font-weight:700;}",
    ".ym-size-btn:disabled{opacity:.35;cursor:not-allowed;pointer-events:none;}",
    // грид - ради чего мы тут все собрались
    ".ym-grid{display:grid!important;gap:12px!important;padding:10px 8px!important;}",
    ".ym-card{position:relative;border-radius:10px;overflow:hidden;background:#1e1e2e;}",
    ".ym-card-poster{position:relative;width:100%;aspect-ratio:2/3;overflow:hidden;display:block;text-decoration:none;}",
    ".ym-card-poster img{width:100%;height:100%;object-fit:cover;display:block;}",
    ".ym-rating{position:absolute;top:6px;right:6px;background:rgba(0,0,0,.75);color:#ffc107;font-size:12px;font-weight:700;padding:3px 7px;border-radius:6px;z-index:3;display:flex;align-items:center;gap:3px;backdrop-filter:blur(4px);}",
    ".ym-rating svg{width:11px;height:11px;fill:#ffc107;}",
    ".ym-score{position:absolute;bottom:6px;left:6px;background:rgba(60,206,123,.9);color:#fff;font-size:11px;font-weight:700;padding:2px 7px;border-radius:5px;z-index:3;display:flex;align-items:center;gap:3px;}",
    ".ym-score svg{width:11px;height:11px;fill:#fff;}",
    ".ym-fav{position:absolute;bottom:6px;right:6px;z-index:3;}",
    ".ym-fav svg{width:16px;height:16px;fill:#be46c6;}",
    // бейдж серий - «вышло 3 из 12, страдай»
    ".ym-episodes{position:absolute;top:6px;left:6px;background:#a855f7;color:#fff;font-size:11px;font-weight:700;padding:2px 7px;border-radius:5px;z-index:3;display:none;}",
    ".ym-episodes.loaded{display:block;}",
    // светофор статусов: зелёный - вышел, фиолетовый - онгоинг, красный - анонс (и боль)
    ".ym-status-bar{width:100%;padding:4px 0;text-align:center;font-size:10px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:#fff;}",
    ".ym-status-released{background:#3cce7b;}",
    ".ym-status-ongoing{background:#a855f7;}",
    ".ym-status-anons{background:#ef4444;}",
    ".ym-status-unknown{background:#555;}",
    // инфо-блок с названием. -webkit-line-clamp потому что CSS так и не завезли нормальный ellipsis
    ".ym-info{padding:6px 7px 8px;display:flex;align-items:flex-start;gap:4px;}",
    ".ym-title{font-weight:600;color:#e0e0e0;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word;text-decoration:none;flex:1;}",
    ".ym-title:hover{text-decoration:underline;}",
    ".ym-gear{flex-shrink:0;margin-top:1px;cursor:pointer;opacity:.45;transition:opacity .2s;display:flex;align-items:center;position:relative;}",
    ".ym-gear:hover{opacity:1;}",
    ".ym-gear>svg{width:14px;height:14px;fill:#aaa;}",
    ".ym-gear-menu{display:none;position:absolute;top:100%;right:0;background:#2a2a3e;border-radius:8px;padding:4px;z-index:100;box-shadow:0 4px 16px rgba(0,0,0,.5);min-width:36px;flex-direction:row;gap:2px;}",
    ".ym-gear.open .ym-gear-menu{display:flex;}",
    ".ym-gear-menu button{background:none;border:none;cursor:pointer;padding:4px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:background .15s;}",
    ".ym-gear-menu button:hover{background:rgba(255,255,255,.1);}",
    ".ym-gear-menu button svg{width:18px;height:18px;}",
    ".ym-hide{display:none!important;}",
    // убийца сайдбара. querySelector с wildcard - грязно, но работает
    '.ym-no-sidebar aside,.ym-no-sidebar div[class*="sidebar"],.ym-no-sidebar div[class*="Sidebar"]{display:none!important;}',
    // мобилка: пальцы - не курсор, увеличиваем всё, чтоб не промахнуться
    "@media(pointer:coarse){#ym-menu-btn{width:58px!important;height:58px!important;}#ym-dropdown{font-size:14px;min-width:220px;}.ym-menu-item{padding:11px 16px;}.ym-section-title{font-size:0.8em;padding:10px 16px 4px;}.ym-size-row{padding:4px 12px 10px;gap:5px;}.ym-size-btn{padding:9px 0;font-size:13px;border-radius:6px;}.ym-sw{width:44px;min-width:44px;height:26px;}.ym-sw .sl{width:44px;height:26px;border-radius:26px;}.ym-sw .sl::before{height:18px;width:18px;left:4px;top:4px;}.ym-sw input:checked+.sl::before{transform:translateX(18px);}}",
  ].join("");
  document.head.appendChild(css);

  // второй <style> - динамический, меняется при переключении колонок
  const dynCss = document.createElement("style");
  document.head.appendChild(dynCss);

  const COL_SIZES = {
    3: { min: "280px", fs: "13px" },
    4: { min: "220px", fs: "12px" },
    5: { min: "180px", fs: "11.5px" },
    6: { min: "150px", fs: "10px" },
  };

  function applyColsCss(cols) {
    const s = COL_SIZES[cols] || COL_SIZES["5"];
    dynCss.textContent =
      ".ym-grid{grid-template-columns:repeat(auto-fill,minmax(" +
      s.min +
      ",1fr))!important;}" +
      ".ym-title{font-size:" +
      s.fs +
      "!important;}";
  }

  //  состояние - переменные уровня IIFE, без импортов и модулей

  let isOn = false;
  let savedUl = null;
  let gridDiv = null;
  let listObserver = null;
  let rebuildTimeout = null;
  let epLoadTimeout = null;
  let scrollObserver = null;
  let sentinel = null;
  let autoLoadBusy = false;

  let gridCols = "5";
  try {
    gridCols = localStorage.getItem("ymg-cols") || "5";
  } catch (e) {}
  if (!COL_SIZES[gridCols]) gridCols = "5";

  let sidebarHidden = false;
  try {
    sidebarHidden = localStorage.getItem("ymg-sidebar") === "1";
  } catch (e) {}

  let lastItemsKey = ""; // fingerprint для skip лишних rebuild

  const isMobile = window.matchMedia("(pointer:coarse)").matches;

  applyColsCss(gridCols);

  // SVG-лапша. нет, мы не будем подключать Font Awesome ради трёх иконок

  const STAR =
    '<svg viewBox="0 0 20 20"><path d="M13.6 5.7 11.3.8A1.5 1.5 0 0 0 10 0c-.3 0-.5 0-.8.2l-.5.6-2.3 5-5.2.7-.7.3a1.5 1.5 0 0 0 0 2.3l3.7 3.8-1 5.3A1.5 1.5 0 0 0 4.7 20c.3 0 .5 0 .8-.2l4.6-2.5 4.6 2.5c.5.3 1 .3 1.5 0a1.5 1.5 0 0 0 .6-1.6l-.9-5.3L19.6 9c.4-.4.5-1 .3-1.6a1.5 1.5 0 0 0-1.1-1l-5.2-.8Z"/></svg>';
  const HEART =
    '<svg viewBox="0 0 20 20"><path d="M18.4 2.8a5.3 5.3 0 0 0-4-1.8 5 5 0 0 0-3.1 1.1c-.5.4-1 .8-1.3 1.3-.4-.5-.8-1-1.3-1.3A5 5 0 0 0 5.6 1a5 5 0 0 0-4 1.8A6.4 6.4 0 0 0 0 7c0 1.7.6 3.3 2 5 1.2 1.4 3 2.9 5 4.6l2.2 2a1.2 1.2 0 0 0 1.6 0l2.3-2c2-1.7 3.7-3.2 5-4.7a7.6 7.6 0 0 0 1.9-5c0-1.6-.6-3.1-1.6-4.2Z"/></svg>';
  const GEAR =
    '<svg viewBox="0 0 20 20"><path d="m19.41 12.19-1.84-1.44c.02-.22.04-.48.04-.76 0-.27-.02-.53-.04-.76l1.84-1.44a.9.9 0 00.22-1.15L17.72 3.35a.89.89 0 00-1.11-.4l-2.17.87a7.45 7.45 0 00-1.3-.76l-.33-2.3A.89.89 0 0011.92 0H8.08c-.45 0-.83.33-.88.76l-.33 2.31a7.68 7.68 0 00-1.3.75l-2.18-.87c-.41-.16-.9.02-1.1.39L.37 6.65A.9.9 0 00.59 7.81l1.84 1.44c-.03.28-.04.53-.04.75 0 .23.01.47.04.76L.59 12.19a.9.9 0 00-.22 1.15l1.91 3.31a.89.89 0 001.11.4l2.17-.87c.42.3.85.55 1.3.76l.33 2.3a.89.89 0 00.88.77h3.84c.45 0 .83-.33.88-.76l.33-2.31a7.72 7.72 0 001.3-.76l2.18.87a.88.88 0 001.1-.39l1.92-3.32a.9.9 0 00-.22-1.14ZM10 13.33A3.34 3.34 0 016.66 10 3.34 3.34 0 0110 6.67 3.34 3.34 0 0113.34 10 3.34 3.34 0 0110 13.33Z"/></svg>';

  const STATUS_LABELS = {
    вышел: { label: "Вышел", css: "ym-status-released" },
    онгоинг: { label: "Онгоинг", css: "ym-status-ongoing" },
    выходит: { label: "Онгоинг", css: "ym-status-ongoing" },
    анонс: { label: "Анонс", css: "ym-status-anons" },
  };

  // анти-XSS. на случай если кто-то назовёт аниме <script>alert('nya')</script>
  const _escDiv = document.createElement("div");
  function esc(s) {
    _escDiv.textContent = s;
    return _escDiv.innerHTML;
  }
  // escAttr — для значений атрибутов (href, src, style). esc() не экранирует кавычки,
  // а " onclick="alert(1) в href — это attribute injection. тут мы давим и кавычки тоже
  function escAttr(s) {
    return esc(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function parseStatus(titleAttr) {
    if (!titleAttr) return { label: "\u2014", css: "ym-status-unknown" };
    const t = titleAttr.toLowerCase();
    for (const key in STATUS_LABELS) {
      if (t.indexOf(key) !== -1) return STATUS_LABELS[key];
    }
    return { label: "\u2014", css: "ym-status-unknown" };
  }

  //  парсер DOM - reverse engineering вёрстки YummyAnime
  //  если они поменяют классы - всё сломается. но когда это нас останавливало?

  function findItems() {
    // ищем img с постерами, а потом поднимаемся до <li>.
    // раньше выбирали ВСЕ <li> на странице (навигация, футер, комменты) и фильтровали —
    // теперь selector точечный: сколько постеров, столько и проверок
    const result = [];
    const imgs = document.querySelectorAll('li img[src*="posters"]');
    for (let i = 0; i < imgs.length; i++) {
      const li = imgs[i].closest("li");
      if (li && result.indexOf(li) === -1) result.push(li);
    }
    return result;
  }

  function parse(li) {
    const d = {
      href: "#",
      poster: "",
      title: "",
      status: null,
      rating: "",
      score: "",
      fav: false,
      buttons: [],
      slug: "",
      isOngoing: false,
    };

    const a = li.querySelector("a");
    if (a) d.href = a.getAttribute("href") || "#";
    d.slug = d.href.replace("/catalog/item/", "");

    // постер: на мобилке medium (легче), на десктопе big (чётче)
    const img = li.querySelector('img[src*="posters"]');
    if (img) {
      const big = img.getAttribute("data-big") || "";
      const med = img.getAttribute("data-medium") || "";
      const src = img.getAttribute("src") || "";
      d.poster = isMobile ? med || src || big : big || med || src;
      d.posterFallback = isMobile ? src || med || big : med || src;
      if (d.poster.indexOf("//") === 0) d.poster = "https:" + d.poster;
      if (d.posterFallback && d.posterFallback.indexOf("//") === 0)
        d.posterFallback = "https:" + d.posterFallback;
    }

    const statusEl = li.querySelector("span[data-status]");
    if (statusEl) {
      d.status = parseStatus(statusEl.getAttribute("title") || "");
      d.isOngoing = statusEl.getAttribute("data-status") === "1";
    }

    const ratingEl = li.querySelector("span[data-balloon]");
    if (ratingEl) {
      const raw = ratingEl.textContent.replace(/[^\d.]/g, "");
      if (raw && parseFloat(raw) > 0) d.rating = raw;
    }

    const scoreEl = li.querySelector("span[data-rating]");
    if (scoreEl) {
      const val = parseFloat(scoreEl.getAttribute("data-rating"));
      if (val > 0)
        d.score =
          scoreEl.textContent.replace(/[^\d]/g, "") || String(Math.round(val));
    }

    const allSpans = li.querySelectorAll("a span");
    for (let i = 0; i < allSpans.length; i++) {
      const sp = allSpans[i];
      if (
        sp.hasAttribute("data-balloon") ||
        sp.hasAttribute("data-rating") ||
        sp.hasAttribute("data-status") ||
        sp.hasAttribute("data-id")
      )
        continue;
      if (sp.classList.contains("nz")) continue; // "3д. 22ч." - это не название аниме, это твой дедлайн
      if (sp.querySelector("svg") && !sp.querySelector("span")) continue;
      // берём textContent, но вырезаем текст дочерних элементов которые мы бы пропустили
      // (таймер .nz, score [data-rating] и пр.), иначе "название3д. 22ч.0"
      let txt = sp.textContent.trim();
      const junk = sp.querySelectorAll(
        ".nz, [data-rating], [data-balloon], [data-status], [data-id]",
      );
      for (let j = 0; j < junk.length; j++) {
        const junkTxt = junk[j].textContent;
        if (junkTxt) txt = txt.replace(junkTxt, "");
      }
      txt = txt.trim();
      if (
        txt.length > 3 &&
        txt.length < 300 &&
        !/^\d+\.?\d*$/.test(txt) &&
        txt.length > d.title.length
      ) {
        d.title = txt;
      }
    }
    if (d.rating && d.title.endsWith(d.rating))
      d.title = d.title.slice(0, -d.rating.length).trim();
    if (d.score && d.title.endsWith(d.score))
      d.title = d.title.slice(0, -d.score.length).trim();

    const svgs = li.querySelectorAll("a svg path");
    for (let i = 0; i < svgs.length; i++) {
      const pathD = svgs[i].getAttribute("d") || "";
      // M18.4 - начало SVG-path сердечка. да, мы определяем иконку по первым байтам path.
      // нормальные люди используют классы, но YummyAnime не нормальные люди. и мы тоже
      if (pathD.indexOf("M18.4") === 0) {
        const parentSpan = svgs[i].closest("span");
        if (
          parentSpan &&
          !parentSpan.hasAttribute("data-rating") &&
          !parentSpan.hasAttribute("data-balloon")
        ) {
          d.fav = true;
          break;
        }
      }
    }

    const btns = li.querySelectorAll("button[data-id]");
    for (let i = 0; i < btns.length; i++) {
      // сохраняем SVG как DOM-ноду, не как строку — чтобы не вставлять сырой innerHTML
      const svgEl = btns[i].querySelector("svg");
      d.buttons.push({
        title: btns[i].getAttribute("title") || "",
        color: btns[i].style.getPropertyValue("--color") || "",
        svgNode: svgEl ? svgEl.cloneNode(true) : null,
        dataId: btns[i].getAttribute("data-id") || "",
      });
    }

    return d;
  }

  function makeCard(d) {
    const c = document.createElement("div");
    c.className = "ym-card";
    if (d.isOngoing) {
      c.setAttribute("data-slug", d.slug);
      c.setAttribute("data-ongoing", "1");
    }

    let h = "";
    h += '<a class="ym-card-poster" href="' + escAttr(d.href) + '">';
    if (d.poster) h += '<img src="' + escAttr(d.poster) + '" loading="lazy">';
    // пустой бейдж - заполнится когда API соизволит ответить
    if (d.isOngoing) h += '<span class="ym-episodes"></span>';
    if (d.rating)
      h += '<span class="ym-rating">' + STAR + " " + esc(d.rating) + "</span>";
    if (d.score)
      h += '<span class="ym-score">' + STAR + " " + esc(d.score) + "</span>";
    if (d.fav) h += '<span class="ym-fav">' + HEART + "</span>";
    h += "</a>";

    if (d.status) {
      h +=
        '<div class="ym-status-bar ' +
        d.status.css +
        '">' +
        d.status.label +
        "</div>";
    }

    h += '<div class="ym-info">';
    h +=
      '<a class="ym-title" href="' +
      escAttr(d.href) +
      '">' +
      esc(d.title) +
      "</a>";

    if (d.buttons.length) {
      h += '<div class="ym-gear">' + GEAR;
      h += '<div class="ym-gear-menu"></div></div>';
    }

    h += "</div>";
    c.innerHTML = h;

    // fallback постера: если основной URL не загрузился — пробуем запасной
    if (d.posterFallback) {
      const posterImg = c.querySelector(".ym-card-poster img");
      if (posterImg) {
        posterImg.onerror = function () {
          this.onerror = null;
          this.src = d.posterFallback;
        };
      }
    }

    // кнопки строим через DOM, а не innerHTML — SVG из чужого DOM не должен идти как сырая строка
    const gearMenu = c.querySelector(".ym-gear-menu");
    if (gearMenu) {
      for (let i = 0; i < d.buttons.length; i++) {
        const b = d.buttons[i];
        const btnEl = document.createElement("button");
        btnEl.setAttribute("title", b.title);
        btnEl.setAttribute("data-id", b.dataId);
        if (b.color) btnEl.style.setProperty("--color", b.color);
        if (b.svgNode) btnEl.appendChild(b.svgNode.cloneNode(true));
        gearMenu.appendChild(btnEl);
      }
    }

    const gear = c.querySelector(".ym-gear");
    if (gear) {
      gear.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll(".ym-gear.open").forEach(function (g) {
          if (g !== gear) g.classList.remove("open");
        });
        gear.classList.toggle("open");
      });
    }

    // прокси кликов: наши кнопки - муляжи, настоящие лежат в скрытом savedUl.
    // кликаем по муляжу > ищем оригинал по title+data-id > дёргаем его .click().
    // костыль ебаный, но иначе пришлось бы реверсить весь API сайта
    const menuBtns = c.querySelectorAll(".ym-gear-menu button");
    menuBtns.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const title = btn.getAttribute("title");
        const dataId = btn.getAttribute("data-id");
        if (savedUl) {
          const origBtn = savedUl.querySelector(
            'button[title="' +
              CSS.escape(title) +
              '"][data-id="' +
              CSS.escape(dataId) +
              '"]',
          );
          if (origBtn) origBtn.click();
        }
      });
    });

    return c;
  }

  //  API серий - ходим в /api/anime/{slug} за каждый онгоинг,
  //  последовательно с задержкой 75мс, чтоб нас не забанили нахер

  // счётчик поколений: каждый новый вызов loadEpisodes() инвалидирует
  // предыдущую цепочку fetch'ей, чтобы не было race condition
  let epGeneration = 0;

  function loadEpisodes() {
    if (!isOn || !gridDiv) return;
    const cards = gridDiv.querySelectorAll('.ym-card[data-ongoing="1"]');
    if (!cards.length) return;

    const gen = ++epGeneration;
    const queue = [];
    for (let i = 0; i < cards.length; i++) {
      queue.push({ card: cards[i], slug: cards[i].getAttribute("data-slug") });
    }

    function processNext(idx) {
      if (gen !== epGeneration) return; // поколение устарело — стоп
      if (idx >= queue.length) return;
      const item = queue[idx];
      const cacheKey = "ymg-ep-" + item.slug;

      let cached = null;
      try {
        cached = sessionStorage.getItem(cacheKey);
      } catch (e) {}

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // кеш живёт 30 мин. потом - иди нахуй, делай новый запрос
          if (parsed.ts && Date.now() - parsed.ts < 30 * 60 * 1000) {
            updateEpBadge(item.card, parsed);
            processNext(idx + 1);
            return;
          }
        } catch (e) {}
      }

      fetch(location.origin + "/api/anime/" + item.slug)
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          return r.json();
        })
        .then(function (json) {
          if (gen !== epGeneration) return; // проверяем ещё раз после await
          const ep = { aired: 0, count: 0, ts: Date.now() };
          const eps = json && json.response && json.response.episodes;
          if (eps) {
            ep.aired = eps.aired || 0;
            ep.count = eps.count || 0;
          }
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(ep));
          } catch (e) {}
          updateEpBadge(item.card, ep);
        })
        .catch(function (err) {
          console.warn("[YMG] episodes fetch failed:", item.slug, err);
        })
        .then(function () {
          setTimeout(function () {
            processNext(idx + 1);
          }, 75);
        });
    }

    processNext(0);
  }

  function updateEpBadge(card, ep) {
    if (!ep || ep.aired === 0) return;
    const badge = card.querySelector(".ym-episodes");
    if (!badge) return;
    badge.textContent = ep.aired + "/" + (ep.count > 0 ? ep.count : "?");
    badge.classList.add("loaded");
  }

  //  пересборка грида - innerHTML = '' и погнали заново.
  //  Virtual DOM? не, не слышали. работает - не трогай

  function itemsFingerprint(items) {
    // быстрый fingerprint: кол-во + href первого и последнего
    if (!items.length) return "";
    const fa = items[0].querySelector("a");
    const la = items[items.length - 1].querySelector("a");
    return (
      items.length +
      ":" +
      (fa ? fa.getAttribute("href") : "") +
      ":" +
      (la ? la.getAttribute("href") : "")
    );
  }

  function rebuildGrid() {
    if (!isOn) return;
    const items = findItems();
    if (!items.length) return;

    const newUl = items[0].parentElement;
    if (newUl && newUl !== savedUl) {
      if (savedUl) savedUl.classList.remove("ym-hide");
      savedUl = newUl;
      savedUl.classList.add("ym-hide");
      if (gridDiv && gridDiv.parentNode) gridDiv.remove();
      savedUl.parentNode.insertBefore(
        gridDiv || createGridDiv(),
        savedUl.nextSibling,
      );
    }

    // skip если ничего не изменилось — главный буст на мобилке
    const key = itemsFingerprint(items);
    if (key === lastItemsKey && gridDiv && gridDiv.children.length) {
      setupAutoLoad();
      return;
    }
    lastItemsKey = key;

    if (!gridDiv) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < items.length; i++) {
      frag.appendChild(makeCard(parse(items[i])));
    }
    gridDiv.innerHTML = "";
    gridDiv.appendChild(frag); // один reflow вместо N

    if (epLoadTimeout) clearTimeout(epLoadTimeout);
    epLoadTimeout = setTimeout(loadEpisodes, 300);
    setupAutoLoad();
  }

  function createGridDiv() {
    gridDiv = document.createElement("div");
    gridDiv.className = "ym-grid";
    gridDiv.id = "ym-grid-box";
    return gridDiv;
  }

  // автоподгрузка: ищем кнопку «Ещё» и кликаем её когда юзер доскроллил до конца грида
  function findMoreBtn() {
    const buttons = document.querySelectorAll("button");
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i].textContent.trim() === "Ещё") return buttons[i];
    }
    return null;
  }

  function teardownAutoLoad() {
    if (scrollObserver) {
      scrollObserver.disconnect();
      scrollObserver = null;
    }
    if (sentinel) {
      sentinel.remove();
      sentinel = null;
    }
    autoLoadBusy = false;
  }

  function setupAutoLoad() {
    teardownAutoLoad();
    if (!isOn || !gridDiv) return;

    const moreBtn = findMoreBtn();
    if (!moreBtn) return;

    sentinel = document.createElement("div");
    sentinel.style.height = "1px";
    gridDiv.parentNode.insertBefore(sentinel, gridDiv.nextSibling);

    scrollObserver = new IntersectionObserver(
      function (entries) {
        if (!entries[0].isIntersecting || autoLoadBusy) return;
        const btn = findMoreBtn();
        if (!btn) {
          teardownAutoLoad();
          return;
        }
        autoLoadBusy = true;
        btn.click();
        // cooldown 1с — за это время MutationObserver перестроит грид
        // и setupAutoLoad вызовется заново из rebuildGrid
        setTimeout(function () {
          autoLoadBusy = false;
        }, 1000);
      },
      { rootMargin: "300px" },
    );

    scrollObserver.observe(sentinel);
  }

  // debounce: 300мс на мобилке (CPU слабее), 150мс на десктопе
  const REBUILD_DELAY = isMobile ? 300 : 150;
  function scheduleRebuild() {
    if (rebuildTimeout) clearTimeout(rebuildTimeout);
    rebuildTimeout = setTimeout(rebuildGrid, REBUILD_DELAY);
  }

  //  MutationObserver - большой брат следит за DOM-ом.
  //  если что-то изменилось - пересобираем грид. параноидально, но эффективно

  function startObserver() {
    if (listObserver) listObserver.disconnect();
    const observeTarget = savedUl
      ? savedUl.parentElement || document.body
      : document.body;
    listObserver = new MutationObserver(function (mutations) {
      if (!isOn) return;
      let dominated = false;
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        // игнорируем наш собственный грид
        if (gridDiv && (gridDiv.contains(m.target) || m.target === gridDiv))
          continue;
        // игнорируем sentinel
        if (sentinel && (m.target === sentinel || sentinel.contains(m.target)))
          continue;
        // реагируем только на изменения внутри или рядом с savedUl
        if (
          savedUl &&
          m.target !== savedUl &&
          !savedUl.contains(m.target) &&
          m.target !== savedUl.parentElement
        )
          continue;
        if (m.addedNodes.length || m.removedNodes.length) {
          dominated = true;
          break;
        }
      }
      if (dominated) scheduleRebuild();
    });
    listObserver.observe(observeTarget, { childList: true, subtree: true });
  }

  function stopObserver() {
    if (listObserver) {
      listObserver.disconnect();
      listObserver = null;
    }
    if (rebuildTimeout) {
      clearTimeout(rebuildTimeout);
      rebuildTimeout = null;
    }
  }

  //  SPA-перехват - monkey-patch history.pushState/replaceState.
  //  React думает что он тут главный? ха. мы патчим его роутер снизу

  let lastUrl = location.href;
  let urlChangeIv = null; // один интервал на всех, чтоб быстрая навигация не плодила десятки

  function onUrlChange() {
    if (!isOn) return;
    if (urlChangeIv) clearInterval(urlChangeIv);
    let attempts = 0;
    urlChangeIv = setInterval(function () {
      attempts++;
      if (findItems().length > 0) {
        clearInterval(urlChangeIv);
        urlChangeIv = null;
        rebuildGrid();
        startObserver();
      }
      if (attempts > 40) {
        clearInterval(urlChangeIv);
        urlChangeIv = null;
      }
    }, 250);
  }

  const origPush = history.pushState;
  const origReplace = history.replaceState;
  history.pushState = function () {
    origPush.apply(this, arguments);
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      onUrlChange();
    }
  };
  history.replaceState = function () {
    origReplace.apply(this, arguments);
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      onUrlChange();
    }
  };
  window.addEventListener("popstate", function () {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      onUrlChange();
    }
  });

  //  вкл/выкл - прячем оригинальный список, показываем наш грид.
  //  как подмена ребёнка в роддоме, только с div-ами

  function turnOn() {
    const items = findItems();
    if (!items.length) return false;
    savedUl = items[0].parentElement;
    if (!savedUl) return false;
    if (gridDiv) gridDiv.remove();
    gridDiv = createGridDiv();
    const frag = document.createDocumentFragment();
    for (let i = 0; i < items.length; i++)
      frag.appendChild(makeCard(parse(items[i])));
    gridDiv.appendChild(frag);
    savedUl.parentNode.insertBefore(gridDiv, savedUl.nextSibling);
    lastItemsKey = itemsFingerprint(items);
    savedUl.classList.add("ym-hide");
    isOn = true;
    startObserver();
    try {
      localStorage.setItem("ymg", "1");
    } catch (e) {}
    setTimeout(loadEpisodes, 300);
    setupAutoLoad();
    return true;
  }

  function turnOff() {
    teardownAutoLoad();
    stopObserver();
    if (gridDiv) {
      gridDiv.remove();
      gridDiv = null;
    }
    if (savedUl) savedUl.classList.remove("ym-hide");
    isOn = false;
    try {
      localStorage.setItem("ymg", "0");
    } catch (e) {}
  }

  //  FAB-меню - 200 строк ради одной кнопки с drag.
  //  тут больше кода на обработку touch/click/drag чем во всём остальном скрипте.
  //  спасибо Apple за preventDefault, спасибо Microsoft за Surface,
  //  и отдельное спасибо всем браузерам за то что touch events - это пиздец

  function createMenu() {
    // кнопочка. если GitHub CDN сдохнет - будет квадратик. жизнь боль
    const menuBtn = document.createElement("div");
    menuBtn.id = "ym-menu-btn";
    menuBtn.title = "YummyAnime Grid";
    const fabImg = document.createElement("img");
    fabImg.src =
      "https://raw.githubusercontent.com/128team/assets/main/logo128b.jpeg";
    fabImg.alt = "YMG";
    fabImg.onerror = function () {
      fabImg.style.display = "none";
      menuBtn.textContent = "\u229e";
    };
    menuBtn.appendChild(fabImg);

    // выпадашка
    const dropdown = document.createElement("div");
    dropdown.id = "ym-dropdown";

    // фабрика свитчей. можно было взять React, но мы же не ищем лёгких путей
    function makeSwitch(labelText, checked, onChange, desc) {
      const row = document.createElement("div");
      row.className = "ym-menu-item";

      const lbl = document.createElement("span");
      lbl.className = "ym-menu-label";

      const lblMain = document.createElement("span");
      lblMain.textContent = labelText;
      lbl.appendChild(lblMain);

      if (desc) {
        const lblDesc = document.createElement("span");
        lblDesc.className = "ym-menu-desc";
        lblDesc.textContent = desc;
        lbl.appendChild(lblDesc);
      }

      const sw = document.createElement("label");
      sw.className = "ym-sw";
      sw.addEventListener("click", function (e) {
        e.stopPropagation();
      });

      const inp = document.createElement("input");
      inp.type = "checkbox";
      inp.checked = checked;
      inp.addEventListener("change", function () {
        onChange(inp.checked);
      });

      const sl = document.createElement("span");
      sl.className = "sl";

      sw.appendChild(inp);
      sw.appendChild(sl);
      row.appendChild(lbl);
      row.appendChild(sw);
      return { row: row, inp: inp };
    }

    // --- рубильник: грид вкл/выкл ---
    const gridSw = makeSwitch(
      "Сетка",
      isOn,
      function (val) {
        if (val) {
          if (!turnOn()) gridSw.inp.checked = false;
        } else turnOff();
      },
      "Только страница профиля",
    );
    gridSw.inp.disabled = !findItems().length;

    // --- секция: сколько колонок хочешь, столько и получишь ---
    // всегда видна, но кнопки disabled пока не на странице профиля
    const sizeLabelRow = document.createElement("div");
    sizeLabelRow.className = "ym-section-title";
    sizeLabelRow.textContent = "Размер сетки";

    const sizeRow = document.createElement("div");
    sizeRow.className = "ym-size-row";

    const hasPosters = findItems().length > 0;

    const SIZE_HINTS = {
      3: "Крупные (3 кол.)",
      4: "4 колонки",
      5: "Стандарт (5 кол.)",
      6: "Мелкие (6 кол.)",
    };

    ["3", "4", "5", "6"].forEach(function (col) {
      const sb = document.createElement("button");
      sb.className = "ym-size-btn" + (gridCols === col ? " active" : "");
      sb.textContent = col + "x";
      sb.title = SIZE_HINTS[col];
      sb.disabled = !hasPosters;
      sb.addEventListener("click", function (e) {
        e.stopPropagation();
        gridCols = col;
        applyColsCss(col);
        try {
          localStorage.setItem("ymg-cols", col);
        } catch (ex) {}
        sizeRow.querySelectorAll(".ym-size-btn").forEach(function (b) {
          b.className =
            "ym-size-btn" + (b.textContent === col + "x" ? " active" : "");
        });
        if (isOn) rebuildGrid();
      });
      sizeRow.appendChild(sb);
    });

    // --- секция: сайдбар (кому он вообще нужен...) ---
    const sidebarSectionTitle = document.createElement("div");
    sidebarSectionTitle.className = "ym-section-title";
    sidebarSectionTitle.textContent = "Вид";

    // инверсия: свитч ON = сайдбар виден. UX, мать его за ногу гладил.
    const sidebarSw = makeSwitch(
      "Сайдбар",
      !sidebarHidden,
      function (val) {
        sidebarHidden = !val;
        if (sidebarHidden) document.body.classList.add("ym-no-sidebar");
        else document.body.classList.remove("ym-no-sidebar");
        try {
          localStorage.setItem("ymg-sidebar", sidebarHidden ? "1" : "0");
        } catch (ex) {}
      },
      "Боковая панель сайта",
    );

    // --- секция: 128 Player ---
    const playerSectionTitle = document.createElement("div");
    playerSectionTitle.className = "ym-section-title";
    playerSectionTitle.textContent = "Плеер";

    var playerEnabled = false;
    try {
      playerEnabled = localStorage.getItem("ymg-player") === "1";
    } catch (ex) {}

    function sendOpenPlayer() {
      var iframes = document.querySelectorAll("iframe");
      iframes.forEach(function (iframe) {
        try {
          iframe.contentWindow.postMessage("ym-open-player", "*");
        } catch (ex) {}
      });
    }

    const playerSw = makeSwitch(
      "128 Player",
      playerEnabled,
      function (val) {
        playerEnabled = val;
        try {
          localStorage.setItem("ymg-player", val ? "1" : "0");
        } catch (ex) {}
        if (val) {
          // сразу открываем плеер
          sendOpenPlayer();
        }
      },
      "Всегда открывать в своём плеере",
    );

    // автоматическое открытие при включённом тогле:
    // следим за сменой iframe (новая серия, новый плеер)
    if (playerEnabled) {
      // открываем при загрузке страницы (с задержкой, пока iframe загрузится)
      setTimeout(sendOpenPlayer, 2000);
    }
    // MutationObserver: если появился новый iframe — отправляем команду
    var iframeSendTimer = null;
    var iframeObs = new MutationObserver(function (mutations) {
      if (!playerEnabled) return;
      // реагируем только на мутации с iframe
      var hasIframe = false;
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          if (
            added[j].nodeName === "IFRAME" ||
            (added[j].querySelector && added[j].querySelector("iframe"))
          ) {
            hasIframe = true;
            break;
          }
        }
        if (hasIframe) break;
      }
      if (!hasIframe) return;
      // debounce чтобы не слать десятки сообщений
      if (iframeSendTimer) clearTimeout(iframeSendTimer);
      iframeSendTimer = setTimeout(sendOpenPlayer, 1500);
    });
    iframeObs.observe(document.body, { childList: true, subtree: true });

    // слушаем команду "следующая серия" от iframe-плеера
    window.addEventListener("message", function (e) {
      if (e.data !== "ym-next-episode") return;

      // yummyani.me: серии — div.sy[data-selected], активная имеет data-selected="1"
      var active = document.querySelector('div.sy[data-selected="1"]');
      if (active) {
        // parent = .sB, nextSibling = следующий .sB, внутри — div.sy
        var parentSB = active.closest(".sB");
        var nextSB = parentSB && parentSB.nextElementSibling;
        var nextEp = nextSB && nextSB.querySelector("div.sy");
        if (nextEp) {
          nextEp.click();
          console.log(
            "[128 Player] переключение на серию",
            nextEp.textContent.trim(),
          );
          // после переключения — автоматически открываем плеер через 2.5с
          setTimeout(sendOpenPlayer, 2500);
        } else {
          console.log("[128 Player] это последняя серия");
        }
      } else {
        console.log("[128 Player] активная серия не найдена");
      }
    });

    // собираем франкенштейна
    dropdown.appendChild(gridSw.row);
    dropdown.appendChild(sizeLabelRow);
    dropdown.appendChild(sizeRow);
    dropdown.appendChild(sidebarSectionTitle);
    dropdown.appendChild(sidebarSw.row);
    dropdown.appendChild(playerSectionTitle);
    dropdown.appendChild(playerSw.row);

    // «умное» позиционирование: если кнопка вверху - меню вниз, и наоборот.
    // Rocket science, блять
    function positionDropdown() {
      const fr = menuBtn.getBoundingClientRect();
      const gap = 10;
      const vh = window.innerHeight,
        vw = window.innerWidth;
      dropdown.style.top = "";
      dropdown.style.bottom = "";
      dropdown.style.left = "";
      dropdown.style.right = "";
      // вертикаль: верхняя половина > вниз, нижняя > вверх (спасибо, кэп)
      if (fr.top + fr.height / 2 < vh / 2) {
        dropdown.style.top = fr.bottom + gap + "px";
      } else {
        dropdown.style.bottom = vh - fr.top + gap + "px";
      }
      // горизонталь: та же хуйня, но влево-вправо
      if (fr.left + fr.width / 2 > vw / 2) {
        dropdown.style.right = vw - fr.right + "px";
      } else {
        dropdown.style.left = fr.left + "px";
      }
    }

    // Drag - общая логика для mouse и touch. listener-ы на document вешаются только
    // на время drag и снимаются по окончании — нет глобальных обработчиков впустую
    let _drag = false,
      _moved = false,
      _sx,
      _sy,
      _sl,
      _st;

    function saveFabPos() {
      const r = menuBtn.getBoundingClientRect();
      try {
        localStorage.setItem("ymg-fab-x", Math.round(r.left));
        localStorage.setItem("ymg-fab-y", Math.round(r.top));
      } catch (ex) {}
    }

    // threshold: 3px для мыши, 5px для пальца (палец менее точный)
    function applyDragMove(clientX, clientY, threshold) {
      const dx = clientX - _sx,
        dy = clientY - _sy;
      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) _moved = true;
      menuBtn.style.left =
        Math.max(
          0,
          Math.min(_sl + dx, window.innerWidth - menuBtn.offsetWidth),
        ) + "px";
      menuBtn.style.top =
        Math.max(
          0,
          Math.min(_st + dy, window.innerHeight - menuBtn.offsetHeight),
        ) + "px";
      menuBtn.style.right = "auto";
      menuBtn.style.bottom = "auto";
      if (dropdown.classList.contains("open")) positionDropdown();
    }

    function dragStart(clientX, clientY) {
      _drag = true;
      _moved = false;
      _sx = clientX;
      _sy = clientY;
      const r = menuBtn.getBoundingClientRect();
      _sl = r.left;
      _st = r.top;
      menuBtn.style.transition = "none";
    }

    function dragEnd(removeMoveListener, removeEndListener) {
      _drag = false;
      menuBtn.style.transition = "";
      removeMoveListener();
      removeEndListener();
      saveFabPos();
    }

    // Mouse drag
    function onMouseMove(e) {
      applyDragMove(e.clientX, e.clientY, 3);
    }
    function onMouseUp() {
      dragEnd(
        function () {
          document.removeEventListener("mousemove", onMouseMove);
        },
        function () {
          document.removeEventListener("mouseup", onMouseUp);
        },
      );
    }
    menuBtn.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      dragStart(e.clientX, e.clientY);
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      e.preventDefault();
    });

    // Touch drag — passive:false потому что Chrome решил что он лучше знает,
    // нужен ли тебе preventDefault
    function onTouchMove(e) {
      applyDragMove(e.touches[0].clientX, e.touches[0].clientY, 5);
      e.preventDefault();
    }
    function onTouchEnd() {
      dragEnd(
        function () {
          document.removeEventListener("touchmove", onTouchMove);
        },
        function () {
          document.removeEventListener("touchend", onTouchEnd);
        },
      );
    }
    menuBtn.addEventListener(
      "touchstart",
      function (e) {
        dragStart(e.touches[0].clientX, e.touches[0].clientY);
        document.addEventListener("touchmove", onTouchMove, { passive: false });
        document.addEventListener("touchend", onTouchEnd);
        e.preventDefault();
      },
      { passive: false },
    );

    // ~~~ сказка о трёх событиях ~~~
    //
    // жили-были три брата: Click, TouchEnd и Drag.
    // каждый хотел toggle меню, но вместе они устроили хаос.
    //
    // Click - старший, надёжный. на десктопе всё делал сам:
    //   mousedown > mousemove > mouseup > click. сказка, а не жизнь.
    //
    // TouchEnd - средний, подлый. на iOS Safari убил Click:
    //   touchstart(preventDefault!) > touchend. Click не пришёл. вообще. навсегда.
    //   «я сам справлюсь», - сказал TouchEnd. и справился.
    //
    // а на Surface пришла беда - братья встретились.
    //   touchstart > touchend > click. оба дёрнули toggle.
    //   меню мигнуло и закрылось. юзер заплакал.
    //
    // тогда мудрый разработчик (после mass nervous breakdown) дал TouchEnd флаг.
    // «делай toggle сам, но оставь флаг _touchTriggered = true», - сказал он.
    // «а ты, Click, проверяй флаг. если брат уже сделал - не лезь».
    //
    // и зажили они... ну, работает. три ревью, два рефактора. конец.
    let _touchTriggered = false;
    menuBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (_touchTriggered) {
        _touchTriggered = false;
        return;
      } // Surface: не дублируй
      if (_moved) {
        _moved = false;
        return;
      } // drag: не открывай
      dropdown.classList.toggle("open");
      if (dropdown.classList.contains("open")) positionDropdown();
    });
    menuBtn.addEventListener("touchend", function (e) {
      if (_moved) {
        _moved = false;
        return;
      }
      e.preventDefault();
      _touchTriggered = true; // скажи click-у чтоб не лез
      dropdown.classList.toggle("open");
      if (dropdown.classList.contains("open")) positionDropdown();
    });

    // stopPropagation - иначе клик по пустому месту в меню закроет его. ну а хули
    dropdown.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    // кликнул мимо? закрываем всё к чертям
    document.addEventListener("click", function () {
      dropdown.classList.remove("open");
      document.querySelectorAll(".ym-gear.open").forEach(function (g) {
        g.classList.remove("open");
      });
    });

    // ресайз - а вдруг кто-то ещё меняет размер окна в 2026
    window.addEventListener("resize", function () {
      if (dropdown.classList.contains("open")) positionDropdown();
    });

    function insertElements() {
      if (document.body) {
        document.body.appendChild(menuBtn);
        document.body.appendChild(dropdown);
        // воскрешаем кнопку туда, где юзер её бросил в прошлый раз
        const sx = parseInt(localStorage.getItem("ymg-fab-x") || "", 10);
        const sy = parseInt(localStorage.getItem("ymg-fab-y") || "", 10);
        if (!isNaN(sx) && sx >= 0 && !isNaN(sy) && sy >= 0) {
          menuBtn.style.left = Math.min(sx, window.innerWidth - 54) + "px";
          menuBtn.style.top = Math.min(sy, window.innerHeight - 54) + "px";
          menuBtn.style.right = "auto";
          menuBtn.style.bottom = "auto";
        }
        if (sidebarHidden) document.body.classList.add("ym-no-sidebar");
      } else {
        setTimeout(insertElements, 10);
      }
    }
    insertElements();

    return {
      gridInp: gridSw.inp,
      // разблокируем все контролы когда обнаружены постеры
      unlock: function () {
        gridSw.inp.disabled = false;
        sizeRow.querySelectorAll(".ym-size-btn").forEach(function (b) {
          b.disabled = false;
        });
      },
    };
  }

  const menu = createMenu();

  //  react-select - когда React-компонент открывает клавиатуру на мобиле
  //  при каждом тапе по селекту. readOnly + inputmode="none" - костыль,
  //  но официального фикса нет уже 4 года. Open source, бля

  function fixSelects() {
    const sel = 'input[id^="react-select-"][role="combobox"]';
    document.querySelectorAll(sel).forEach(function (inp) {
      if (inp.dataset.patched) return;
      inp.readOnly = true;
      inp.setAttribute("inputmode", "none");
      inp.dataset.patched = "1";
    });
  }

  // вызываем сразу + вешаем MutationObserver, потому что React подкидывает
  // новые select-ы в DOM когда ему вздумается. один вызов тут нихуя не решит
  fixSelects();
  let fixSelectsTimer = null;
  const fixSelectsObserver = new MutationObserver(function () {
    if (fixSelectsTimer) return;
    fixSelectsTimer = setTimeout(function () {
      fixSelectsTimer = null;
      fixSelects();
    }, 300);
  });
  fixSelectsObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // (128 Player: логика плеера теперь в initIframePlayer, запускается внутри kodik iframe)

  //  автозапуск - ждём пока React наконец отрендерит список.
  //  30 секунд, 60 попыток. если за это время не появился - ну и хуй с ним

  let t = 0;
  const iv = setInterval(function () {
    t++;
    if (findItems().length > 0) {
      clearInterval(iv);
      menu.unlock();
      try {
        if (localStorage.getItem("ymg") === "1") {
          if (turnOn()) menu.gridInp.checked = true;
        }
      } catch (e) {}
    }
    if (t > 60) clearInterval(iv);
  }, 500);
})();
