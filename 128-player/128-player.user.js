// ==UserScript==
// @name         128 Player
// @namespace    https://github.com/128team/tm_scripts
// @version      0.1.5
// @description  Кастомный видеоплеер — замена стандартных плееров на аниме-сайтах
// @author       d08
// @supportURL   https://github.com/128team/tm_scripts/issues
// @updateURL    https://raw.githubusercontent.com/128team/tm_scripts/main/128-player/128-player.user.js
// @downloadURL  https://raw.githubusercontent.com/128team/tm_scripts/main/128-player/128-player.user.js
// @match        *://*/*
// @grant        none
// @icon         https://raw.githubusercontent.com/128team/assets/main/logo128b.jpeg
// @run-at       document-end
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  // 128 player — кастомный видеоплеер для аниме (и не только)
  // в iframe — заменяет дефолтный плеер, автоматом
  // на обычной странице — FAB-кнопка, юзер сам решает
  // если кто-то шлёт ping — переходим в managed-режим и слушаемся

    var managed = false;
    var isInIframe = window !== window.top;

    // css плеера. !important-ад, потому что хост-плееры тоже любят !important
    var s = document.createElement("style");
    s.textContent = [
      '#ym-p-fab{position:fixed;bottom:10px;right:10px;z-index:2147483647;display:none;align-items:center;gap:6px;padding:7px 14px;background:rgba(15,15,25,.92);backdrop-filter:blur(8px);border:1px solid rgba(100,160,255,.3);border-radius:10px;color:#e0e0e0;font:600 12px/1 "Segoe UI",Arial,sans-serif;cursor:pointer;user-select:none;box-shadow:0 4px 20px rgba(0,0,0,.5);transition:all .25s;}',
      "#ym-p-fab:hover{background:rgba(30,80,190,.92);border-color:rgba(100,160,255,.6);color:#fff;transform:translateY(-2px);}",
      "#ym-p-fab svg{width:14px;height:14px;fill:#7ab8ff;}",
      "#ym-p-fab:hover svg{fill:#fff;}",
      '#ym-player{position:fixed!important;inset:0!important;z-index:2147483647!important;background:#000!important;display:flex!important;flex-direction:column!important;pointer-events:auto!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif!important;}',
      "#ym-player *{pointer-events:auto!important;}",
      "#ym-player video{flex:1;width:100%;min-height:0;object-fit:contain;background:#000;outline:none;}",
      ".ym-p-controls{display:flex;align-items:center;gap:10px;padding:12px 16px 14px;background:linear-gradient(transparent,rgba(0,0,0,.4) 30%,rgba(0,0,0,.85));color:#ddd;font-size:13px;position:absolute;bottom:0;left:0;right:0;transition:opacity .3s;z-index:10!important;}",
      ".ym-p-controls.hidden{opacity:0;pointer-events:none!important;}",
      ".ym-p-btn{background:none;border:none;color:#ccc;cursor:pointer!important;padding:8px;border-radius:6px;display:flex;align-items:center;justify-content:center;position:relative;z-index:11!important;transition:all .15s;}",
      ".ym-p-btn:hover{color:#fff;background:rgba(255,255,255,.12);}",
      ".ym-p-btn svg{width:22px;height:22px;fill:currentColor;}",
      ".ym-p-prog{flex:1;height:4px;background:rgba(255,255,255,.12);border-radius:2px;cursor:pointer;position:relative;transition:height .15s;}",
      ".ym-p-prog:hover,.ym-p-prog.dragging{height:8px;}",
      ".ym-p-buf{position:absolute;top:0;left:0;height:100%;background:rgba(255,255,255,.18);border-radius:2px;pointer-events:none;}",
      ".ym-p-bar{position:absolute;top:0;left:0;height:100%;background:#4a9eff;border-radius:2px;pointer-events:none;transition:none;}",
      // thumb-кружок на конце прогресс-бара
      ".ym-p-thumb{position:absolute;top:50%;right:0;width:14px;height:14px;background:#fff;border-radius:50%;transform:translate(50%,-50%) scale(0);pointer-events:none;transition:transform .15s;box-shadow:0 0 4px rgba(0,0,0,.4);}",
      ".ym-p-prog:hover .ym-p-thumb,.ym-p-prog.dragging .ym-p-thumb{transform:translate(50%,-50%) scale(1);}",
      // бабл с превью таймкодом
      ".ym-p-bubble{position:absolute;bottom:100%;left:0;transform:translateX(-50%);margin-bottom:10px;padding:4px 8px;background:rgba(20,20,30,.92);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.15);border-radius:6px;color:#fff;font:600 12px/1 inherit;font-variant-numeric:tabular-nums;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .12s;z-index:12;}",
      ".ym-p-bubble.visible{opacity:1;}",
      ".ym-p-vol{display:flex;align-items:center;gap:6px;}",
      ".ym-p-vol input{-webkit-appearance:none;appearance:none;width:70px;height:4px;background:rgba(255,255,255,.2);border-radius:2px;outline:none;cursor:pointer;}",
      ".ym-p-vol input::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;background:#fff;border-radius:50%;cursor:pointer;}",
      ".ym-p-time{font-size:12px;color:#999;font-variant-numeric:tabular-nums;white-space:nowrap;min-width:90px;text-align:center;}",
      ".ym-p-speed{font-size:12px;color:#999;cursor:pointer;padding:3px 8px;border-radius:4px;user-select:none;transition:all .15s;}",
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
      ".ym-p-skip{position:absolute!important;bottom:64px;right:16px;z-index:50!important;padding:10px 20px;background:rgba(74,158,255,.15);backdrop-filter:blur(10px);border:1px solid rgba(74,158,255,.35);border-radius:8px;color:#fff;font:600 13px/1 inherit;cursor:pointer!important;transition:all .2s;display:none;pointer-events:auto!important;}",
      ".ym-p-skip:hover{background:rgba(74,158,255,.3);border-color:rgba(74,158,255,.6);transform:translateX(-2px);}",
      ".ym-p-skip.visible{display:block;}",
      // popup-меню (quality, speed)
      ".ym-p-popup{position:relative;z-index:11!important;}",
      ".ym-p-popup-menu{display:none;position:absolute;bottom:100%;margin-bottom:8px;background:rgba(15,15,25,.96);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:4px 0;min-width:80px;z-index:200!important;box-shadow:0 8px 32px rgba(0,0,0,.5);}",
      ".ym-p-popup-menu.open{display:block;}",
      ".ym-p-popup-item{display:block;width:100%;padding:6px 14px;background:none;border:none;color:#aaa;font:12px/1 inherit;cursor:pointer!important;text-align:left;white-space:nowrap;}",
      ".ym-p-popup-item:hover{background:rgba(255,255,255,.08);color:#fff;}",
      ".ym-p-popup-item.active{color:#4a9eff;font-weight:700;}",
      // автопропуск toggle
      ".ym-p-autoskip{display:flex;align-items:center;gap:5px;cursor:pointer;padding:2px 8px;border-radius:4px;user-select:none;font:600 11px/1 inherit;color:#666;transition:all .2s;}",
      ".ym-p-autoskip:hover{color:#aaa;background:rgba(255,255,255,.06);}",
      ".ym-p-autoskip.on{color:#4a9eff;}",
      ".ym-p-autoskip.on:hover{color:#6dc0ff;}",
      ".ym-p-autoskip svg{width:16px;height:16px;fill:currentColor;}",
      ".ym-p-autoskip-dot{width:6px;height:6px;border-radius:50%;background:#555;transition:background .2s;}",
      ".ym-p-autoskip.on .ym-p-autoskip-dot{background:#4a9eff;}",
      // loading-оверлей
      '#ym-p-loading{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;color:#ddd;font:600 16px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}',
      "#ym-p-loading .ym-spinner{width:40px;height:40px;border:3px solid rgba(255,255,255,.15);border-top-color:#4a9eff;border-radius:50%;animation:ym-spin 0.8s linear infinite;}",
      "@keyframes ym-spin{to{transform:rotate(360deg);}}",
      // мобилка: пальцы — не курсор, увеличиваем всё чтоб не промахнуться
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
      ".ym-p-autoskip{padding:4px 10px;}",
      ".ym-p-autoskip span{font-size:12px;}",
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
      autoSkip: '<svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12z"/><path d="M16 18l8.5-6L16 6v12z" opacity=".5"/></svg>',
    };
    var SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    // настройки в localStorage. если юзер чистит кеш — ну, сам виноват
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
    function getAutoSkip() {
      try {
        return localStorage.getItem("ymp-autoskip") === "1";
      } catch (ex) {
        return false;
      }
    }
    function saveAutoSkip(v) {
      try {
        localStorage.setItem("ymp-autoskip", v ? "1" : "0");
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
    // чистим старые таймкоды чтоб localStorage не разжирел. 100+ записей → режем до 50
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

    // skip-тайминги из URL (kodik пихает их в query: skip_button=[opening]0-89,[ending]1375-1409)
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

    // ищем оригинальную skip-кнопку в DOM. селекторы на все известные плееры,
    // если какой-то не покрыт — ну, добавим когда найдём
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

    // собираем качество из оригинального плеера. каждый плеер прячет это по-своему, блять
    function collectQualities() {
      var items = []; // [{label, el}]

      // kodik
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

      // allplay (alloha): кнопка "Качество" → кликаем → собираем подменю. костыль, но работает
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

    function activatePlayer() {
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
    }

    // слушаем postMessage. кто пингует — тот и главный, мы подчиняемся
    window.addEventListener("message", function (e) {
      if (e.data === "ym-player-ping") {
        managed = true;
        var fab = document.getElementById("ym-p-fab");
        if (fab) fab.style.display = "none";
        try { e.source.postMessage("ym-player-pong", "*"); }
        catch (ex) { window.top.postMessage("ym-player-pong", "*"); }
        return;
      }
      // pong от iframe — значит грид обнаружил плеер, FAB не нужен
      if (e.data === "ym-player-pong") {
        managed = true;
        var fab = document.getElementById("ym-p-fab");
        if (fab) fab.style.display = "none";
        return;
      }
      if (e.data === "ym-close-player") {
        var closeBtn = document.querySelector(".ym-p-close");
        if (closeBtn) closeBtn.click();
        return;
      }
      if (e.data !== "ym-open-player") return;
      activatePlayer();
    });

    function openP(video) {
      if (document.getElementById("ym-player")) return;

      // прячем FAB пока плеер открыт
      var fab = document.getElementById("ym-p-fab");
      if (fab) fab.style.display = "none";

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
      var pThumb = document.createElement("div");
      pThumb.className = "ym-p-thumb";
      pBar.appendChild(pThumb);
      var pBubble = document.createElement("div");
      pBubble.className = "ym-p-bubble";
      pBubble.textContent = "0:00";
      prog.append(pBuf, pBar, pBubble);

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

      // --- автопропуск toggle ---
      var autoSkipOn = getAutoSkip();
      var autoSkipWrap = document.createElement("div");
      autoSkipWrap.className = "ym-p-autoskip" + (autoSkipOn ? " on" : "");
      autoSkipWrap.title = "Автопропуск интро/эндинг + след. серия (A)";
      autoSkipWrap.innerHTML = PICO.autoSkip + '<span>Авто</span><div class="ym-p-autoskip-dot"></div>';
      autoSkipWrap.addEventListener("click", function (e) {
        e.stopPropagation();
        autoSkipOn = !autoSkipOn;
        autoSkipWrap.classList.toggle("on", autoSkipOn);
        saveAutoSkip(autoSkipOn);
      });

      // авто-переключение на следующую серию по окончанию видео
      function onVideoEnded() {
        if (autoSkipOn) {
          bNext.click();
        }
      }
      video.addEventListener("ended", onVideoEnded);

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
        autoSkipWrap,
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
        // не перезаписываем бар пока юзер тянет
        if (!drag) {
          pBar.style.width = (video.currentTime / video.duration) * 100 + "%";
          time.textContent = fmt(video.currentTime) + " / " + fmt(video.duration);
        }
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
            // автопропуск: сразу скипаем
            if (autoSkipOn) {
              video.currentTime = activeSkip.end;
            } else {
              skipBtn.textContent = activeSkip.label;
              skipBtn.classList.add("visible");
            }
            origSkipRef = null;
          } else {
            skipBtn.classList.remove("visible");
          }
        } else {
          // skip: режим 2 — зеркалим оригинальную кнопку (alloha и др.)
          var origBtn = findOrigSkipBtn();
          if (origBtn) {
            // автопропуск: кликаем оригинальную кнопку
            if (autoSkipOn) {
              origBtn.click();
            } else {
              origSkipRef = origBtn;
              skipBtn.textContent = origBtn.textContent.trim() || "Пропустить";
              skipBtn.classList.add("visible");
            }
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
      var dragPct = 0;
      var wasPlayingBeforeDrag = false;
      function pctFromEvent(e) {
        var r = prog.getBoundingClientRect();
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        return Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      }
      function showBubble(pct) {
        if (!video.duration) return;
        pBubble.textContent = fmt(pct * video.duration);
        // позиционируем бабл, не давая ему вылезти за края прогресс-бара
        var progW = prog.offsetWidth;
        var bubbleW = pBubble.offsetWidth || 40;
        var rawX = pct * progW;
        var minX = bubbleW / 2 + 2;
        var maxX = progW - bubbleW / 2 - 2;
        var clampedX = Math.max(minX, Math.min(maxX, rawX));
        pBubble.style.left = clampedX + "px";
        pBubble.classList.add("visible");
      }
      function hideBubble() {
        pBubble.classList.remove("visible");
      }
      function updateBarVisual(pct) {
        pBar.style.width = pct * 100 + "%";
        showBubble(pct);
        if (video.duration) {
          time.textContent = fmt(pct * video.duration) + " / " + fmt(video.duration);
        }
      }
      function startDrag(e) {
        drag = true;
        prog.classList.add("dragging");
        wasPlayingBeforeDrag = !video.paused;
        if (wasPlayingBeforeDrag) {
          skipNextFlash = true;
          video.pause();
        }
        dragPct = pctFromEvent(e);
        updateBarVisual(dragPct);
      }
      function stopDrag() {
        prog.classList.remove("dragging");
        hideBubble();
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
        dragPct = pctFromEvent(e);
        updateBarVisual(dragPct);
      }
      function onTouchDragMove(e) {
        if (!drag) {
          stopDrag();
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        dragPct = pctFromEvent(e);
        updateBarVisual(dragPct);
      }
      function onDragEnd() {
        if (drag) {
          video.currentTime = dragPct * (video.duration || 0);
          if (wasPlayingBeforeDrag) {
            skipNextFlash = true;
            video.play();
          }
        }
        stopDrag();
      }
      // hover на прогресс-баре — показываем бабл с таймкодом
      prog.addEventListener("mousemove", function (e) {
        if (drag) return; // при drag бабл уже обновляется через updateBarVisual
        showBubble(pctFromEvent(e));
      });
      prog.addEventListener("mouseleave", function () {
        if (!drag) hideBubble();
      });
      // mouse
      prog.addEventListener("mousedown", function (e) {
        e.preventDefault();
        e.stopPropagation();
        startDrag(e);
        document.addEventListener("mousemove", onDragMove, true);
        document.addEventListener("mouseup", onDragEnd, true);
        document.addEventListener("mouseleave", onDragEnd, true);
        window.addEventListener("blur", stopDrag);
      });
      // touch
      prog.addEventListener("touchstart", function (e) {
        e.preventDefault();
        e.stopPropagation();
        startDrag(e);
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
        video.removeEventListener("ended", onVideoEnded);
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
        document.removeEventListener("keydown", onKey, true);
        document.removeEventListener("keyup", onKeyUp, true);
        document.removeEventListener("click", onDocClickPopup);
        // чистим интервалы сбора качества
        qIntervals.forEach(function (iv) {
          clearInterval(iv);
        });
        qIntervals.length = 0;
        // standalone на обычной странице: показываем FAB обратно
        if (!managed && !isInIframe) {
          var fab = document.getElementById("ym-p-fab");
          if (fab) fab.style.display = "flex";
        }
      }
      cl.addEventListener("click", closeP);

      function onKey(e) {
        if (!document.getElementById("ym-player")) return;
        if (e.repeat) {
          // при зажатии разрешаем только перемотку и громкость
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" &&
              e.key !== "ArrowUp" && e.key !== "ArrowDown") {
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
          }
        }
        var handled = true;
        switch (e.key) {
          case " ":
          case "k":
            video.paused ? video.play() : video.pause();
            break;
          case "ArrowLeft":
            video.currentTime -= 5;
            flashIcon(icoL);
            break;
          case "ArrowRight":
            video.currentTime += 5;
            flashIcon(icoR);
            break;
          case "ArrowUp":
            video.volume = Math.min(1, video.volume + 0.05);
            vol.value = video.volume;
            break;
          case "ArrowDown":
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
            bNext.click();
            break;
          case "a":
            autoSkipWrap.click();
            break;
          case "Escape":
            closeP();
            break;
          default:
            handled = false;
        }
        if (handled) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      }
      document.addEventListener("keydown", onKey, true);
      // блокируем keyup для тех же клавиш — оригинальный плеер может слушать keyup
      function onKeyUp(e) {
        if (!document.getElementById("ym-player")) return;
        switch (e.key) {
          case " ": case "k": case "ArrowLeft": case "ArrowRight":
          case "ArrowUp": case "ArrowDown": case "f": case "p":
          case "m": case "s": case "n": case "N": case "a": case "Escape":
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
      }
      document.addEventListener("keyup", onKeyUp, true);
    }

    // standalone: если за 2.5с никто не пингнул — мы сами по себе
    // в iframe — заменяем плеер автоматом, нахуй оригинал
    // на обычной странице — показываем FAB, пусть юзер сам тыкает

    setTimeout(function () {
      if (managed) return;
      if (isInIframe) {
        // iframe = встроенный плеер. ждём видео и заменяем молча
        function tryOpen() {
          if (document.getElementById("ym-player")) return true;
          var v = document.querySelector("video:not(.rmp-ad-vast-video-player)");
          if (v && (v.currentSrc || v.src) && v.readyState >= 2) {
            openP(v);
            return true;
          }
          return false;
        }
        if (tryOpen()) return;
        var obs = new MutationObserver(function () {
          if (tryOpen()) obs.disconnect();
        });
        obs.observe(document.body, {
          childList: true, subtree: true,
          attributes: true, attributeFilter: ["src"],
        });
        // canplay — ловим момент когда видео готово (mutation не всегда палит)
        document.addEventListener("canplay", function onReady(e) {
          if (e.target.tagName === "VIDEO" && tryOpen()) {
            document.removeEventListener("canplay", onReady, true);
            obs.disconnect();
          }
        }, true);
        // не висим вечно — 60с и хватит
        setTimeout(function () { obs.disconnect(); }, 60000);
      } else {
        // обычная страница — FAB-кнопка
        var fab = document.createElement("div");
        fab.id = "ym-p-fab";
        fab.innerHTML = PICO.play + "<span>128 Player</span>";
        fab.style.display = "flex";
        fab.addEventListener("click", function () {
          fab.style.display = "none";
          activatePlayer();
        });
        document.body.appendChild(fab);
      }
    }, 2500);
})();
