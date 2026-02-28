// ==UserScript==
// @name         YummyAnime - Grid View
// @namespace    https://github.com/128team/tm_scripts
// @version      1.5.1
// @description  Сетка аниме с большими постерами
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
// @noframes
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    var css = document.createElement('style');
    css.textContent = [
        '#ym-grid-toggle{position:fixed!important;top:10px!important;left:10px!important;z-index:2147483647!important;width:50px!important;height:50px!important;border:3px solid #fff!important;border-radius:50%!important;background:#e91e63!important;color:#fff!important;font-size:22px!important;cursor:pointer!important;box-shadow:0 4px 20px rgba(0,0,0,.7)!important;display:flex!important;align-items:center!important;justify-content:center!important;line-height:1!important;padding:0!important;margin:0!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;font-family:sans-serif!important;}',
        '.ym-grid{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(180px,1fr))!important;gap:12px!important;padding:10px 8px!important;}',
        '.ym-card{position:relative;border-radius:10px;overflow:hidden;background:#1e1e2e;}',
        '.ym-card-poster{position:relative;width:100%;aspect-ratio:2/3;overflow:hidden;display:block;text-decoration:none;}',
        '.ym-card-poster img{width:100%;height:100%;object-fit:cover;display:block;}',
        '.ym-rating{position:absolute;top:6px;right:6px;background:rgba(0,0,0,.75);color:#ffc107;font-size:12px;font-weight:700;padding:3px 7px;border-radius:6px;z-index:3;display:flex;align-items:center;gap:3px;backdrop-filter:blur(4px);}',
        '.ym-rating svg{width:11px;height:11px;fill:#ffc107;}',
        '.ym-score{position:absolute;bottom:6px;left:6px;background:rgba(60,206,123,.9);color:#fff;font-size:11px;font-weight:700;padding:2px 7px;border-radius:5px;z-index:3;display:flex;align-items:center;gap:3px;}',
        '.ym-score svg{width:11px;height:11px;fill:#fff;}',
        '.ym-fav{position:absolute;bottom:6px;right:6px;z-index:3;}',
        '.ym-fav svg{width:16px;height:16px;fill:#be46c6;}',
        '.ym-status-bar{width:100%;padding:4px 0;text-align:center;font-size:10px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:#fff;}',
        '.ym-status-released{background:#3cce7b;}',
        '.ym-status-ongoing{background:#a855f7;}',
        '.ym-status-anons{background:#ef4444;}',
        '.ym-status-unknown{background:#555;}',
        '.ym-info{padding:6px 7px 8px;display:flex;align-items:flex-start;gap:4px;}',
        '.ym-title{font-size:11.5px;font-weight:600;color:#e0e0e0;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word;text-decoration:none;flex:1;}',
        '.ym-title:hover{text-decoration:underline;}',
        '.ym-gear{flex-shrink:0;margin-top:1px;cursor:pointer;opacity:.45;transition:opacity .2s;display:flex;align-items:center;position:relative;}',
        '.ym-gear:hover{opacity:1;}',
        '.ym-gear>svg{width:14px;height:14px;fill:#aaa;}',
        '.ym-gear-menu{display:none;position:absolute;top:100%;right:0;background:#2a2a3e;border-radius:8px;padding:4px;z-index:100;box-shadow:0 4px 16px rgba(0,0,0,.5);min-width:36px;flex-direction:row;gap:2px;}',
        '.ym-gear.open .ym-gear-menu{display:flex;}',
        '.ym-gear-menu button{background:none;border:none;cursor:pointer;padding:4px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:background .15s;}',
        '.ym-gear-menu button:hover{background:rgba(255,255,255,.1);}',
        '.ym-gear-menu button svg{width:18px;height:18px;}',
        '.ym-hide{display:none!important;}'
    ].join('');
    document.head.appendChild(css);

    var STAR = '<svg viewBox="0 0 20 20"><path d="M13.6 5.7 11.3.8A1.5 1.5 0 0 0 10 0c-.3 0-.5 0-.8.2l-.5.6-2.3 5-5.2.7-.7.3a1.5 1.5 0 0 0 0 2.3l3.7 3.8-1 5.3A1.5 1.5 0 0 0 4.7 20c.3 0 .5 0 .8-.2l4.6-2.5 4.6 2.5c.5.3 1 .3 1.5 0a1.5 1.5 0 0 0 .6-1.6l-.9-5.3L19.6 9c.4-.4.5-1 .3-1.6a1.5 1.5 0 0 0-1.1-1l-5.2-.8Z"/></svg>';
    var HEART = '<svg viewBox="0 0 20 20"><path d="M18.4 2.8a5.3 5.3 0 0 0-4-1.8 5 5 0 0 0-3.1 1.1c-.5.4-1 .8-1.3 1.3-.4-.5-.8-1-1.3-1.3A5 5 0 0 0 5.6 1a5 5 0 0 0-4 1.8A6.4 6.4 0 0 0 0 7c0 1.7.6 3.3 2 5 1.2 1.4 3 2.9 5 4.6l2.2 2a1.2 1.2 0 0 0 1.6 0l2.3-2c2-1.7 3.7-3.2 5-4.7a7.6 7.6 0 0 0 1.9-5c0-1.6-.6-3.1-1.6-4.2Z"/></svg>';
    var GEAR = '<svg viewBox="0 0 20 20"><path d="m19.41 12.19-1.84-1.44c.02-.22.04-.48.04-.76 0-.27-.02-.53-.04-.76l1.84-1.44a.9.9 0 00.22-1.15L17.72 3.35a.89.89 0 00-1.11-.4l-2.17.87a7.45 7.45 0 00-1.3-.76l-.33-2.3A.89.89 0 0011.92 0H8.08c-.45 0-.83.33-.88.76l-.33 2.31a7.68 7.68 0 00-1.3.75l-2.18-.87c-.41-.16-.9.02-1.1.39L.37 6.65A.9.9 0 00.59 7.81l1.84 1.44c-.03.28-.04.53-.04.75 0 .23.01.47.04.76L.59 12.19a.9.9 0 00-.22 1.15l1.91 3.31a.89.89 0 001.11.4l2.17-.87c.42.3.85.55 1.3.76l.33 2.3a.89.89 0 00.88.77h3.84c.45 0 .83-.33.88-.76l.33-2.31a7.72 7.72 0 001.3-.76l2.18.87a.88.88 0 001.1-.39l1.92-3.32a.9.9 0 00-.22-1.14ZM10 13.33A3.34 3.34 0 016.66 10 3.34 3.34 0 0110 6.67 3.34 3.34 0 0113.34 10 3.34 3.34 0 0110 13.33Z"/></svg>';

    var STATUS_LABELS = {
        'вышел':   { label: 'Вышел',   css: 'ym-status-released' },
        'онгоинг': { label: 'Онгоинг', css: 'ym-status-ongoing'  },
        'выходит': { label: 'Онгоинг', css: 'ym-status-ongoing'  },
        'анонс':   { label: 'Анонс',   css: 'ym-status-anons'    }
    };

    function parseStatus(titleAttr) {
        if (!titleAttr) return { label: '\u2014', css: 'ym-status-unknown' };
        var t = titleAttr.toLowerCase();
        for (var key in STATUS_LABELS) {
            if (t.indexOf(key) !== -1) return STATUS_LABELS[key];
        }
        return { label: '\u2014', css: 'ym-status-unknown' };
    }

    var isOn = false, savedUl = null, gridDiv = null;
    var listObserver = null;
    var rebuildTimeout = null;

    function findItems() {
        var result = [];
        var items = document.querySelectorAll('li');
        for (var i = 0; i < items.length; i++) {
            if (items[i].querySelector('img[src*="posters"]')) {
                result.push(items[i]);
            }
        }
        return result;
    }

    function parse(li) {
        var d = { href: '#', poster: '', title: '', status: null, rating: '', score: '', fav: false, buttons: [] };

        var a = li.querySelector('a');
        if (a) d.href = a.getAttribute('href') || '#';

        var img = li.querySelector('img[src*="posters"]');
        if (img) {
            d.poster = img.getAttribute('data-medium') || img.getAttribute('data-big') || img.getAttribute('src') || '';
            if (d.poster.indexOf('//') === 0) d.poster = 'https:' + d.poster;
        }

        var statusEl = li.querySelector('span[data-status]');
        if (statusEl) {
            d.status = parseStatus(statusEl.getAttribute('title') || '');
        }

        var ratingEl = li.querySelector('span[data-balloon]');
        if (ratingEl) {
            var raw = ratingEl.textContent.replace(/[^\d.]/g, '');
            if (raw && parseFloat(raw) > 0) d.rating = raw;
        }

        var scoreEl = li.querySelector('span[data-rating]');
        if (scoreEl) {
            var val = parseFloat(scoreEl.getAttribute('data-rating'));
            if (val > 0) d.score = scoreEl.textContent.replace(/[^\d]/g, '') || '' + Math.round(val);
        }

        var allSpans = li.querySelectorAll('a span');
        for (var i = 0; i < allSpans.length; i++) {
            var sp = allSpans[i];
            if (sp.hasAttribute('data-balloon') || sp.hasAttribute('data-rating') ||
                sp.hasAttribute('data-status') || sp.hasAttribute('data-id')) continue;
            if (sp.querySelector('svg') && !sp.querySelector('span')) continue;
            var txt = sp.textContent.trim();
            if (txt.length > 3 && txt.length < 120 && !/^\d+\.?\d*$/.test(txt) && txt.length > d.title.length) {
                d.title = txt;
            }
        }
        if (d.rating && d.title.endsWith(d.rating)) {
            d.title = d.title.slice(0, -d.rating.length).trim();
        }
        if (d.score && d.title.endsWith(d.score)) {
            d.title = d.title.slice(0, -d.score.length).trim();
        }

        var svgs = li.querySelectorAll('a svg path');
        for (var i = 0; i < svgs.length; i++) {
            var pathD = svgs[i].getAttribute('d') || '';
            if (pathD.indexOf('M18.4') === 0) {
                var parentSpan = svgs[i].closest('span');
                if (parentSpan && !parentSpan.hasAttribute('data-rating') && !parentSpan.hasAttribute('data-balloon')) {
                    d.fav = true;
                    break;
                }
            }
        }

        var btns = li.querySelectorAll('button[data-id]');
        for (var i = 0; i < btns.length; i++) {
            d.buttons.push({
                title: btns[i].getAttribute('title') || '',
                color: btns[i].style.getPropertyValue('--color') || '',
                svg: btns[i].innerHTML,
                dataId: btns[i].getAttribute('data-id') || ''
            });
        }

        return d;
    }

    function makeCard(d) {
        var c = document.createElement('div');
        c.className = 'ym-card';

        var h = '';
        h += '<a class="ym-card-poster" href="' + d.href + '">';
        if (d.poster) h += '<img src="' + d.poster + '" loading="lazy">';
        if (d.rating) h += '<span class="ym-rating">' + STAR + ' ' + d.rating + '</span>';
        if (d.score) h += '<span class="ym-score">' + STAR + ' ' + d.score + '</span>';
        if (d.fav) h += '<span class="ym-fav">' + HEART + '</span>';
        h += '</a>';

        if (d.status) {
            h += '<div class="ym-status-bar ' + d.status.css + '">' + d.status.label + '</div>';
        }

        h += '<div class="ym-info">';
        h += '<a class="ym-title" href="' + d.href + '">' + d.title + '</a>';

        if (d.buttons.length) {
            h += '<div class="ym-gear">' + GEAR;
            h += '<div class="ym-gear-menu">';
            for (var i = 0; i < d.buttons.length; i++) {
                var b = d.buttons[i];
                h += '<button title="' + b.title + '" data-id="' + b.dataId + '"';
                if (b.color) h += ' style="--color:' + b.color + '"';
                h += '>' + b.svg + '</button>';
            }
            h += '</div></div>';
        }

        h += '</div>';
        c.innerHTML = h;

        var gear = c.querySelector('.ym-gear');
        if (gear) {
            gear.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                document.querySelectorAll('.ym-gear.open').forEach(function(g) {
                    if (g !== gear) g.classList.remove('open');
                });
                gear.classList.toggle('open');
            });
        }

        var menuBtns = c.querySelectorAll('.ym-gear-menu button');
        menuBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var title = btn.getAttribute('title');
                var dataId = btn.getAttribute('data-id');
                if (savedUl) {
                    var origBtn = savedUl.querySelector('button[title="' + title + '"][data-id="' + dataId + '"]');
                    if (origBtn) origBtn.click();
                }
            });
        });

        return c;
    }

    // =============================================
    //  Пересборка грида
    // =============================================
    function rebuildGrid() {
        if (!isOn) return;
        var items = findItems();
        if (!items.length) return;

        // Обновляем ссылку на ul (мог смениться при переключении таба)
        var newUl = items[0].parentElement;
        if (newUl && newUl !== savedUl) {
            // Старый ul мог быть заменён — снимаем скрытие если он ещё в DOM
            if (savedUl) savedUl.classList.remove('ym-hide');
            savedUl = newUl;
            savedUl.classList.add('ym-hide');
            // Перемещаем грид после нового ul
            if (gridDiv && gridDiv.parentNode) {
                gridDiv.remove();
            }
            savedUl.parentNode.insertBefore(gridDiv || createGridDiv(), savedUl.nextSibling);
        }

        if (!gridDiv) return;

        // Очищаем и пересобираем
        gridDiv.innerHTML = '';
        for (var i = 0; i < items.length; i++) {
            gridDiv.appendChild(makeCard(parse(items[i])));
        }
    }

    function createGridDiv() {
        gridDiv = document.createElement('div');
        gridDiv.className = 'ym-grid';
        gridDiv.id = 'ym-grid-box';
        return gridDiv;
    }

    // Дебаунс пересборки чтобы не дёргать на каждую мутацию
    function scheduleRebuild() {
        if (rebuildTimeout) clearTimeout(rebuildTimeout);
        rebuildTimeout = setTimeout(rebuildGrid, 150);
    }

    // =============================================
    //  MutationObserver — следит за изменениями списка
    // =============================================
    function startObserver() {
        if (listObserver) listObserver.disconnect();

        // Наблюдаем за широкой областью — родитель списка или body
        var observeTarget = savedUl ? (savedUl.parentElement || document.body) : document.body;

        listObserver = new MutationObserver(function(mutations) {
            if (!isOn) return;
            var dominated = false;
            for (var i = 0; i < mutations.length; i++) {
                var m = mutations[i];
                // Игнорируем мутации внутри нашего грида
                if (gridDiv && (gridDiv.contains(m.target) || m.target === gridDiv)) continue;
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

    // =============================================
    //  URL change detection (SPA навигация)
    // =============================================
    var lastUrl = location.href;

    function onUrlChange() {
        if (!isOn) return;
        // При смене URL — ждём появления новых карточек и пересобираем
        var attempts = 0;
        var waitIv = setInterval(function() {
            attempts++;
            if (findItems().length > 0) {
                clearInterval(waitIv);
                rebuildGrid();
                startObserver();
            }
            if (attempts > 40) clearInterval(waitIv);
        }, 250);
    }

    // Перехватываем pushState/replaceState и popstate
    var origPush = history.pushState;
    var origReplace = history.replaceState;
    history.pushState = function() {
        origPush.apply(this, arguments);
        if (location.href !== lastUrl) { lastUrl = location.href; onUrlChange(); }
    };
    history.replaceState = function() {
        origReplace.apply(this, arguments);
        if (location.href !== lastUrl) { lastUrl = location.href; onUrlChange(); }
    };
    window.addEventListener('popstate', function() {
        if (location.href !== lastUrl) { lastUrl = location.href; onUrlChange(); }
    });

    // =============================================
    //  Включение / выключение
    // =============================================
    function turnOn() {
        var items = findItems();
        if (!items.length) return false;
        savedUl = items[0].parentElement;
        if (!savedUl) return false;
        if (gridDiv) gridDiv.remove();
        gridDiv = createGridDiv();
        for (var i = 0; i < items.length; i++) gridDiv.appendChild(makeCard(parse(items[i])));
        savedUl.parentNode.insertBefore(gridDiv, savedUl.nextSibling);
        savedUl.classList.add('ym-hide');
        isOn = true;
        startObserver();
        try { localStorage.setItem('ymg', '1'); } catch(e) {}
        return true;
    }

    function turnOff() {
        stopObserver();
        if (gridDiv) { gridDiv.remove(); gridDiv = null; }
        if (savedUl) savedUl.classList.remove('ym-hide');
        isOn = false;
        try { localStorage.setItem('ymg', '0'); } catch(e) {}
    }

    // Закрытие меню при клике вне
    document.addEventListener('click', function() {
        document.querySelectorAll('.ym-gear.open').forEach(function(g) {
            g.classList.remove('open');
        });
    });

    var btn = document.createElement('div');
    btn.id = 'ym-grid-toggle';
    btn.textContent = '\u229E';
    btn.setAttribute('style', 'position:fixed!important;top:10px!important;left:10px!important;z-index:2147483647!important;width:50px!important;height:50px!important;border:3px solid #fff!important;border-radius:50%!important;background:#e91e63!important;color:#fff!important;font-size:22px!important;cursor:pointer!important;box-shadow:0 4px 20px rgba(0,0,0,.7)!important;display:flex!important;align-items:center!important;justify-content:center!important;line-height:1!important;padding:0!important;margin:0!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;');

    function toggle() {
        if (isOn) { turnOff(); btn.style.background = '#e91e63'; btn.textContent = '\u229E'; }
        else { if (turnOn()) { btn.style.background = '#3cce7b'; btn.textContent = '\u2630'; } }
    }

    btn.addEventListener('touchend', function(e) { e.preventDefault(); toggle(); });
    btn.addEventListener('click', function(e) { e.preventDefault(); toggle(); });

    function insertBtn() {
        if (document.body) document.body.appendChild(btn);
        else setTimeout(insertBtn, 10);
    }
    insertBtn();

    var t = 0;
    var iv = setInterval(function() {
        t++;
        if (findItems().length > 0) {
            clearInterval(iv);
            try { if (localStorage.getItem('ymg') === '1') { turnOn(); btn.style.background = '#3cce7b'; btn.textContent = '\u2630'; } } catch(e) {}
        }
        if (t > 60) clearInterval(iv);
    }, 500);
})();