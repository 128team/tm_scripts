// ==UserScript==
// @name         YummyAnime - Grid View
// @namespace    https://github.com/128team/tm_scripts
// @version      1.6.9
// @description  Сетка постеров аниме на странице профиля
// @author       d08
// @supportURL   https://github.com/128team/tm_scripts/issues
// @updateURL    https://raw.githubusercontent.com/128team/tm_scripts/main/yummy-grid/yummy-grid.user.js
// @downloadURL  https://raw.githubusercontent.com/128team/tm_scripts/main/yummy-grid/yummy-grid.user.js
// @match        https://ru.yummyani.me/*
// @match        https://yummyani.me/*
// @match        https://site.yummyani.me/*
// @grant        none
// @icon         https://raw.githubusercontent.com/128team/assets/main/logo128b.jpeg
// @run-at       document-end
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  // не yummy — выходим
  var isYummy = /yummyani\.me$/.test(location.hostname);
  if (!isYummy) return;

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
    // фикс оценки на мобилке: тап toggle вместо hover
    "@media(pointer:coarse){.dataRatingColored .qw{display:none!important;}.dataRatingColored.ym-rate-open .qw{display:flex!important;}.dataRatingColored.ym-rate-open .qy{padding:6px!important;}}",
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

    var playerDetected = false;
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

    function sendClosePlayer() {
      var iframes = document.querySelectorAll("iframe");
      iframes.forEach(function (iframe) {
        try {
          iframe.contentWindow.postMessage("ym-close-player", "*");
        } catch (ex) {}
      });
    }

    function sendPlayerPing() {
      var iframes = document.querySelectorAll("iframe");
      iframes.forEach(function (iframe) {
        try {
          iframe.contentWindow.postMessage("ym-player-ping", "*");
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
        if (val && playerDetected) sendOpenPlayer();
        if (!val) sendClosePlayer();
      },
      "Всегда открывать в своём плеере",
    );
    playerSw.row.style.display = "none";

    // ссылка на установку 128 Player (видна пока плеер не обнаружен)
    const installRow = document.createElement("div");
    installRow.className = "ym-menu-item";
    const installLbl = document.createElement("span");
    installLbl.className = "ym-menu-label";
    const installLink = document.createElement("a");
    installLink.href = "https://github.com/128team/tm_scripts/raw/main/128-player/128-player.user.js";
    installLink.target = "_blank";
    installLink.textContent = "\u2B07 Установить 128 Player";
    installLink.style.cssText = "color:#4a9eff;text-decoration:none;";
    installLink.addEventListener("click", function (e) { e.stopPropagation(); });
    const installDesc = document.createElement("span");
    installDesc.className = "ym-menu-desc";
    installDesc.textContent = "Кастомный видеоплеер";
    installLbl.appendChild(installLink);
    installLbl.appendChild(installDesc);
    installRow.appendChild(installLbl);

    // детект 128 Player через ping/pong
    window.addEventListener("message", function (e) {
      if (e.data === "ym-player-pong" && !playerDetected) {
        playerDetected = true;
        playerSw.row.style.display = "";
        installRow.style.display = "none";
        if (playerEnabled) setTimeout(sendOpenPlayer, 500);
      }
    });

    setTimeout(sendPlayerPing, 1000);
    setTimeout(sendPlayerPing, 3000);
    setTimeout(sendPlayerPing, 6000);

    // MutationObserver: новый iframe → пинг + авто-открытие
    var iframeSendTimer = null;
    var iframeObs = new MutationObserver(function (mutations) {
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
      if (iframeSendTimer) clearTimeout(iframeSendTimer);
      iframeSendTimer = setTimeout(function () {
        sendPlayerPing();
        if (playerEnabled && playerDetected) setTimeout(sendOpenPlayer, 500);
      }, 1500);
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
    dropdown.appendChild(installRow);

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

  // --- фикс оценки на мобилке ---
  // hover не работает на touch — делаем toggle по тапу
  if (window.matchMedia("(pointer:coarse)").matches) {
    var openRating = null; // текущий открытый .dataRatingColored
    document.addEventListener("click", function (e) {
      var ratingEl = e.target.closest(".dataRatingColored");
      // тап по звезде оценки (.qy) — пропускаем, пусть сайт обработает
      if (e.target.closest(".qy")) return;
      if (ratingEl) {
        e.preventDefault();
        e.stopPropagation();
        if (openRating === ratingEl) {
          // повторный тап — закрываем
          ratingEl.classList.remove("ym-rate-open");
          openRating = null;
        } else {
          // закрываем предыдущий, открываем новый
          if (openRating) openRating.classList.remove("ym-rate-open");
          ratingEl.classList.add("ym-rate-open");
          openRating = ratingEl;
        }
        return;
      }
      // тап вне — закрываем
      if (openRating) {
        openRating.classList.remove("ym-rate-open");
        openRating = null;
      }
    }, true);
  }
})();
