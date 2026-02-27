// ==UserScript==
// @name         SG Toolkit Pro
// @namespace    https://github.com/128team/tm_scripts
// @version      3.2.0
// @description  Advanced giveaway toolkit for SteamGifts - filters, inline enter, ratings, sorting & more
// @author       d08
// @supportURL   https://github.com/128team/tm_scripts/issues
// @updateURL    https://raw.githubusercontent.com/128team/tm_scripts/main/SG_Toolkit/sg_toolkit.js
// @downloadURL  https://raw.githubusercontent.com/128team/tm_scripts/main/SG_Toolkit/sg_toolkit.js
// @match        https://www.steamgifts.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect      store.steampowered.com
// @icon         https://raw.githubusercontent.com/128team/assets/main/logo128b.jpeg
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    const VER = '3.2.0';

    /* 0. PURE UTILITIES  (no dependencies, no drama - these ones I actually like) */
    const TIMINGS = {
        DEBOUNCE_MS:        300,  // 300ms - not too fast, not too slow, like me on monday mornings
        FAIL_RESET_MS:     2000,  // 2 seconds staring at "Fail" - enough time to feel it
        NO_PTS_FLASH_MS:   1500,  // button flashes when out of points - like my career prospects
        SCROLL_TRIGGER_PX:  600,  // 600px from bottom - load earlier? pointless. later? too late
        SCROLL_INIT_MS:     500,  // wait 500ms on start, the page needs a moment to wake up
        LOADER_REMOVE_MS:  3000,  // "all loaded" banner - did you read it? doesn't matter
        ERROR_REMOVE_MS:   4000,  // show errors a bit longer - let it really sink in
        RATING_TIMEOUT_MS: 8000,  // Steam might be napping. 8 seconds is optimistic on my part
    };
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const debounce = (fn, ms) => {
        let timer;
        return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
    };

    /* 1. CONFIG  (user settings live here. don't hardcode stuff. I'm watching you.) */
    const DEFAULTS = {
        f_enabled: false, f_minP: 0, f_maxP: 300, f_exactP: '',
        f_minLv: 0, f_maxLv: 10, f_maxEntries: 0, f_minChance: 0,
        f_hideEntered: false, f_hideGroup: false, f_hideWL: false,
        f_dimMode: false, f_sort: 'default',
        x_inlineEnter: false, x_showChance: false, x_showPtsBadge: false,
        x_wlGlow: false, x_steamRating: false, x_steamLink: false,
        x_highlightLvNeg: false, x_autoScroll: false,
        ui_scale: 100, ui_panelW: 330, ui_fabSize: 48,
        ui_panelOpacity: 95, ui_fabX: -1, ui_fabY: -1,
        ui_lang: 'auto',
    };
    const cfgLoad = () => {
        try {
            const merged = { ...DEFAULTS, ...JSON.parse(GM_getValue('sgfp', '{}')) };
            const n = (v, def, lo, hi) => clamp(Number.isNaN(+v) ? def : +v, lo, hi);
            // filter fields - clamp everything, users will type 9999 everywhere and wonder why it breaks
            merged.f_minP       = n(merged.f_minP,       0,   0, 300);
            merged.f_maxP       = n(merged.f_maxP,       300, 0, 300);
            merged.f_minLv      = n(merged.f_minLv,      0,   0, 10);
            merged.f_maxLv      = n(merged.f_maxLv,      10,  0, 10);
            merged.f_maxEntries = n(merged.f_maxEntries, 0,   0, 99999);
            merged.f_minChance  = n(merged.f_minChance,  0,   0, 100);
            // UI fields - same deal. trust no one. not even yourself from last week.
            merged.ui_scale        = n(merged.ui_scale,        100, 60,  150);
            merged.ui_panelW       = n(merged.ui_panelW,       330, 240, 500);
            merged.ui_fabSize      = n(merged.ui_fabSize,      48,  32,  72);
            merged.ui_panelOpacity = n(merged.ui_panelOpacity, 95,  40,  100);
            return merged;
        } catch { return { ...DEFAULTS }; }
    };
    const cfgSave = c => GM_setValue('sgfp', JSON.stringify(c));
    let C = cfgLoad();

    /* 1b. I18N  (two languages. english default, russian available. adding more? extend STRINGS.) */
    const STRINGS = {
        en: {
            tab_filter: '🔍 Filters', tab_feat: '⚙ Features', tab_settings: '🎛 Appearance', tab_about: 'ℹ️',
            stat_total: 'Total', stat_shown: 'Shown', stat_hidden: 'Hidden',
            f_enabled: 'Filters active',
            sh_points: '💰 Points', f_from: 'From', f_to: 'To',
            f_exact: 'Exact', f_exact_hint: '5,10,15 (empty=range)', f_exact_ph: 'empty',
            sh_level: '🎚 Level', sh_entries: '👥 Entries',
            f_max_entries: 'Max entries', f_min_chance: 'Min chance %',
            sh_hide: '👁 Hide',
            f_hide_entered: 'Hide entered', f_hide_group: 'Hide Group Only',
            f_hide_wl: 'Hide Whitelist Only', f_dim: 'Dim instead of hide',
            sh_sort: '🔃 Sort', f_sort_lbl: 'Order',
            sort_default: 'Default', sort_pts_asc: 'Price ↑', sort_pts_desc: 'Price ↓',
            sort_ent_asc: 'Entries ↑', sort_ent_desc: 'Entries ↓',
            sort_ch_desc: 'Chance ↓', sort_lv_desc: 'Level ↓', sort_end_asc: 'Ending soon',
            sh_buttons: '🖱 Buttons',
            x_enter: 'Inline Enter button', x_enter_hint: '«Enter» button in the list',
            sh_info: '📊 Info',
            x_chance: 'Win chance', x_chance_hint: '«Chance: X%» badge',
            x_pts: 'Game price', x_pts_hint: '«Price: XP» badge',
            x_rating: 'Steam rating', x_rating_hint: '«Rating: X%» badge',
            x_steam: 'Steam Store link',
            sh_highlight: '🎨 Highlights',
            x_wl: 'Wishlist highlight', x_lvneg: 'Level-locked', x_lvneg_hint: 'Red stripe',
            sh_scroll: '📜 Scroll', x_scroll: 'Auto-scroll', x_scroll_hint: 'Loads next pages while scrolling',
            sh_scale: '📐 Interface scale',
            ui_text: 'Text size', ui_panel_w: 'Panel width', ui_btn_sz: 'Button size', ui_opacity: 'Opacity',
            sh_pos: '📍 Position',
            ui_pos_hint: '💡 Drag the ⭐ button anywhere — panel adapts automatically',
            btn_resetpos: '↩ Reset position', sh_data: '🔧 Data', btn_resetall: '♻ Reset ALL settings',
            sh_lang: '🌐 Language', lang_lbl: 'Language',
            about_desc: 'Advanced toolkit for SteamGifts.<br>Filters, sorting, inline enter,<br>Steam ratings and more.',
            about_author: 'Author:',
            about_tip: 'Hotkey: <b style="color:#7ab8e0">Alt+F</b><br>Drag the ⭐ button anywhere<br>Panel opens toward free space automatically<br><br>Script does <b>NOT</b> violate SG rules —<br>no auto-entering giveaways',
            badge_chance: p => `Chance: ${p}`, badge_price: p => `Price: ${p}P`,
            badge_rating: p => `Rating: ${p}%`, badge_rating_t: (pos, tot) => `${pos} of ${tot} reviews`,
            enter_title: c => `Enter (${c}P)`, leave_title: 'Click to leave',
            scroll_load: p => `⏳ Loading page ${p}...`, scroll_done: '✅ All giveaways loaded',
            scroll_err: (n, m) => n >= 3 ? `❌ Error (attempt 3/3): ${m}` : `⚠️ Error (attempt ${n}/3): ${m}`,
            fab_title: 'SG Toolkit Pro — drag me!',
            confirm_reset: 'Reset ALL SG Toolkit Pro settings?',
        },
        ru: {
            tab_filter: '🔍 Фильтры', tab_feat: '⚙ Функции', tab_settings: '🎛 Вид', tab_about: 'ℹ️',
            stat_total: 'Всего', stat_shown: 'Видно', stat_hidden: 'Скрыто',
            f_enabled: 'Фильтры активны',
            sh_points: '💰 Поинты', f_from: 'От', f_to: 'До',
            f_exact: 'Точные', f_exact_hint: '5,10,15 (пусто=диапазон)', f_exact_ph: 'пусто',
            sh_level: '🎚 Уровень', sh_entries: '👥 Участники',
            f_max_entries: 'Макс. entries', f_min_chance: 'Мин. шанс %',
            sh_hide: '👁 Скрытие',
            f_hide_entered: 'Скрыть вошедшие', f_hide_group: 'Скрыть Group Only',
            f_hide_wl: 'Скрыть Whitelist Only', f_dim: 'Затемнять вместо скрытия',
            sh_sort: '🔃 Сортировка', f_sort_lbl: 'Порядок',
            sort_default: 'По умолчанию', sort_pts_asc: 'Цена ↑', sort_pts_desc: 'Цена ↓',
            sort_ent_asc: 'Entries ↑', sort_ent_desc: 'Entries ↓',
            sort_ch_desc: 'Шанс ↓', sort_lv_desc: 'Уровень ↓', sort_end_asc: 'Скоро заканчив.',
            sh_buttons: '🖱 Кнопки',
            x_enter: 'Inline Enter кнопка', x_enter_hint: 'Кнопка «Enter» прямо в списке',
            sh_info: '📊 Информация',
            x_chance: 'Шанс выигрыша', x_chance_hint: 'Бейдж «Шанс: X%»',
            x_pts: 'Цена игры', x_pts_hint: 'Бейдж «Цена: XP»',
            x_rating: 'Рейтинг Steam', x_rating_hint: 'Бейдж «Рейтинг: X%»',
            x_steam: 'Ссылка на Steam Store',
            sh_highlight: '🎨 Подсветка',
            x_wl: 'Wishlist подсветка', x_lvneg: 'Недоступный уровень', x_lvneg_hint: 'Красная полоска',
            sh_scroll: '📜 Прокрутка', x_scroll: 'Авто-скролл', x_scroll_hint: 'Подгружает следующие страницы при прокрутке',
            sh_scale: '📐 Масштаб интерфейса',
            ui_text: 'Размер текста', ui_panel_w: 'Ширина панели', ui_btn_sz: 'Размер кнопки', ui_opacity: 'Прозрачность',
            sh_pos: '📍 Позиция',
            ui_pos_hint: '💡 Перетащи кнопку ⭐ в любое место — панель адаптируется автоматически',
            btn_resetpos: '↩ Сбросить позицию', sh_data: '🔧 Данные', btn_resetall: '♻ Сбросить ВСЕ настройки',
            sh_lang: '🌐 Язык', lang_lbl: 'Язык',
            about_desc: 'Продвинутый тулкит для SteamGifts.<br>Фильтры, сортировка, inline enter,<br>рейтинги Steam и многое другое.',
            about_author: 'Автор:',
            about_tip: 'Горячая клавиша: <b style="color:#7ab8e0">Alt+F</b><br>Кнопку ⭐ можно перетаскивать<br>Панель автоматически открывается в нужном направлении<br><br>Скрипт <b>НЕ</b> нарушает правила SG —<br>никакого авто-входа в раздачи',
            badge_chance: p => `Шанс: ${p}`, badge_price: p => `Цена: ${p}P`,
            badge_rating: p => `Рейтинг: ${p}%`, badge_rating_t: (pos, tot) => `${pos} из ${tot} отзывов`,
            enter_title: c => `Войти (${c}P)`, leave_title: 'Нажмите чтобы выйти',
            scroll_load: p => `⏳ Загрузка страницы ${p}...`, scroll_done: '✅ Все раздачи загружены',
            scroll_err: (n, m) => n >= 3 ? `❌ Ошибка (попытка 3/3): ${m}` : `⚠️ Ошибка (попытка ${n}/3): ${m}`,
            fab_title: 'SG Toolkit Pro — перетащи!',
            confirm_reset: 'Сбросить ВСЕ настройки SG Toolkit Pro?',
        },
    };
    // T(key) — static string. T(key, arg1, ...) — calls the function value with args.
    const T = (key, ...a) => {
        const lang = C.ui_lang === 'auto' ? (navigator.language?.startsWith('ru') ? 'ru' : 'en') : (STRINGS[C.ui_lang] ? C.ui_lang : 'en');
        const val = STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
        return typeof val === 'function' ? val(...a) : val;
    };

    /* 2. HELPERS  (tiny utils that each do one thing. one. and only one.) */
    const $ = s => document.querySelector(s);
    const $$ = s => [...document.querySelectorAll(s)];
    const $id = id => document.getElementById(id);
    const mkEl = (tag, attrs = {}, children = []) => {
        const e = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs)) {
            if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
            else if (k === 'className') e.className = v;
            else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
            else e.setAttribute(k, v);
        }
        for (const c of children) {
            if (typeof c === 'string') e.appendChild(document.createTextNode(c));
            else if (c) e.appendChild(c);
        }
        return e;
    };

    let _xsrfCache = null;
    function getXsrf() {
        // fast path - the normal hidden input. 99% of page loads. we're done in one line.
        const el = $('input[name="xsrf_token"]');
        if (el) return el.value;
        if (_xsrfCache) return _xsrfCache;
        // fallback: iterate forms the proper way. no DOM serialization. no drama.
        for (const form of document.forms) {
            const inp = form.elements.namedItem('xsrf_token');
            if (inp?.value) { _xsrfCache = inp.value; return _xsrfCache; }
        }
        return null;
    }
    function getPoints() {
        const e = $('.nav__points');
        return e ? parseInt(e.textContent.replace(/,/g, ''), 10) : 0;
    }
    function getAppId(row) {
        const img = row.querySelector('.giveaway_image_thumbnail, .giveaway_image_thumbnail_missing');
        if (img) { const m = (img.getAttribute('style') || '').match(/apps\/(\d+)/); if (m) return m[1]; }
        const sl = row.querySelector('a[href*="store.steampowered.com/app/"]');
        if (sl) { const m = sl.href.match(/app\/(\d+)/); if (m) return m[1]; }
        return null;
    }

    const ratingCache = {};
    const API = {
        async toggleEntry(code, action, xsrf) {
            const resp = await fetch('/ajax.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `xsrf_token=${xsrf}&do=${action}&code=${code}`,
            });
            return resp.json();
        },

        fetchRating(appId) {
            return new Promise(resolve => {
                if (ratingCache[appId] !== undefined) return resolve(ratingCache[appId]);
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `https://store.steampowered.com/appreviews/${appId}?json=1&language=all&purchase_type=all&num_per_page=0`,
                    timeout: TIMINGS.RATING_TIMEOUT_MS,
                    onload(res) {
                        try {
                            const d = JSON.parse(res.responseText), s = d.query_summary;
                            if (!s) { ratingCache[appId] = null; return resolve(null); }
                            const total = s.total_reviews || 0, pos = s.total_positive || 0;
                            const pct = total > 0 ? Math.round((pos / total) * 100) : 0;
                            const r = { pct, total, pos }; ratingCache[appId] = r; resolve(r);
                        } catch { ratingCache[appId] = null; resolve(null); }
                    },
                    onerror:   () => { ratingCache[appId] = null; resolve(null); },
                    ontimeout: () => { ratingCache[appId] = null; resolve(null); },
                });
            });
        },

        async fetchPage(url) {
            const r = await fetch(url, { credentials: 'include' });
            if (!r.ok) throw new Error(r.status);
            return r.text();
        },
    };

    /* 3. GIVEAWAY MODEL  (our precious little data structure. it holds everything. be nice to it.) */
    class Giveaway {
        constructor(outer, inner) {
            this.dom    = { outer, inner, link: null };
            this.id     = { code: '', appId: null };
            this.data   = { name: '', cost: 0, copies: 1, entries: 0, level: 0, endTime: 0, originalIndex: 0 };
            this.status = { entered: false, lvNeg: false, isWl: false, isGroup: false, isWhitelist: false, isPinned: false };
            this.metrics = { chance: 100 };
        }

        get canEnter() { return !this.status.lvNeg && !this.status.entered && getPoints() >= this.data.cost; }

        markEntered(entered) {
            const wasEntered = this.status.entered;
            this.status.entered = entered;
            this.dom.inner.classList.toggle('is-faded', entered);
            // update entries + recalc chance - stale cache would lie to the filter. I learned this the hard way.
            if (entered && !wasEntered) this.data.entries++;
            else if (!entered && wasEntered && this.data.entries > 0) this.data.entries--;
            this.metrics.chance = this.data.entries > 0 ? (this.data.copies / this.data.entries) * 100 : 100;
        }
    }

    /* 4. PARSE  (reading the DOM so you don't have to. you're welcome.) */
    // WeakMap cache: one Giveaway per DOM node. GC handles cleanup when the element dies. lovely.
    const _gaCache = new WeakMap();
    let _parseCounter = 0;  // global index to remember original order - we need this to undo sorting

    function parseAll() {
        return $$('.giveaway__row-outer-wrap').map(outer => {
            if (_gaCache.has(outer)) return _gaCache.get(outer);

            const inner = outer.querySelector('.giveaway__row-inner-wrap');
            if (!inner) return null;

            const ga = new Giveaway(outer, inner);

            // id - code from URL slug, appId from image style or steam link. DOM detective work.
            const link = inner.querySelector('.giveaway__heading__name');
            ga.dom.link    = link;
            ga.id.code     = link?.href?.match(/\/giveaway\/([^/]+)\//)?.[1] || '';
            ga.id.appId    = getAppId(inner);

            // data - scraping text from heading spans like it's 2008. works though.
            ga.data.name = link?.textContent?.trim() || '';
            inner.querySelectorAll('.giveaway__heading__thin').forEach(t => {
                const pM = t.textContent.match(/(\d+)P/);            if (pM) ga.data.cost   = +pM[1];
                const cM = t.textContent.match(/\(([\d,]+)\s*Cop/i); if (cM) ga.data.copies = +cM[1].replace(/,/g, '');
            });
            const eL = inner.querySelector('.giveaway__links a[href*="/entries"]');
            if (eL) { const m = eL.textContent.match(/([\d,]+)/); if (m) ga.data.entries = +m[1].replace(/,/g, ''); }
            const lvEl = inner.querySelector('[class*="contributor-level"]');
            if (lvEl) { const m = lvEl.textContent.match(/(\d+)/); if (m) ga.data.level = +m[1]; }
            const tEl = inner.querySelector('[data-timestamp]');
            if (tEl) ga.data.endTime = +tEl.getAttribute('data-timestamp');

            // status - who can enter, who's wishlist, who's pinned, who's group-only. lots of flags.
            ga.status.lvNeg      = !!inner.querySelector('.giveaway__column--contributor-level--negative');
            ga.status.entered    = inner.classList.contains('is-faded');
            ga.status.isWl       = !!inner.querySelector('.giveaway__column--positive') || outer.classList.contains('giveaway__row-outer-wrap--wishlist');
            ga.status.isGroup    = !!inner.querySelector('.giveaway__column--group');
            ga.status.isWhitelist= !!inner.querySelector('.giveaway__column--whitelist');
            ga.status.isPinned   = !!outer.closest('.pinned-giveaways__inner-wrap');

            // metrics - one metric. chance of winning. it's always lower than you hope.
            ga.metrics.chance = ga.data.entries > 0 ? (ga.data.copies / ga.data.entries) * 100 : 100;

            ga.data.originalIndex = _parseCounter++;
            _gaCache.set(outer, ga);
            return ga;
        }).filter(Boolean);
    }

    /* 4b. INLINE ENTER / LEAVE  (click a button, win a game. statistically unlikely, but here we are.) */
    function addInlineEnterButtons(giveaways) {
        if (!C.x_inlineEnter) { $$('.sgfp-enter').forEach(e => e.remove()); return; }
        const xsrf = getXsrf();
        if (!xsrf) return;
        giveaways.forEach(ga => {
            if (ga.dom.inner.querySelector('.sgfp-enter')) return;
            if (ga.status.lvNeg) return;
            const linksEl = ga.dom.inner.querySelector('.giveaway__links');
            if (!linksEl) return;

            const btn = mkEl('a', { href: '#', className: 'sgfp-enter' });

            function setEnterState() {
                btn.className = 'sgfp-enter sgfp-enter-join';
                btn.innerHTML = '<i class="fa fa-plus-circle"></i> Enter';
                btn.title = T('enter_title', ga.data.cost);
            }
            function setEnteredState() {
                btn.className = 'sgfp-enter sgfp-enter-leave';
                btn.innerHTML = '<i class="fa fa-minus-circle"></i> Entered';
                btn.title = T('leave_title');
            }
            function setFailState() {
                btn.classList.remove('sgfp-loading');
                btn.innerHTML = '<i class="fa fa-times-circle"></i> Fail';
                setTimeout(() => { if (ga.status.entered) setEnteredState(); else setEnterState(); }, TIMINGS.FAIL_RESET_MS);
            }

            if (ga.status.entered) setEnteredState(); else setEnterState();

            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (btn.classList.contains('sgfp-loading')) return;

                const isLeave = btn.classList.contains('sgfp-enter-leave');
                const action = isLeave ? 'entry_delete' : 'entry_insert';

                if (!isLeave) {
                    const pts = getPoints();
                    if (ga.data.cost > pts) {
                        btn.classList.add('sgfp-no-pts');
                        setTimeout(() => btn.classList.remove('sgfp-no-pts'), TIMINGS.NO_PTS_FLASH_MS);
                        return;
                    }
                }

                btn.classList.add('sgfp-loading');
                btn.innerHTML = '<i class="fa fa-refresh fa-spin"></i> ...';

                try {
                    const data = await API.toggleEntry(ga.id.code, action, xsrf);
                    if (data.type === 'success') {
                        btn.classList.remove('sgfp-loading');
                        ga.markEntered(!isLeave);
                        if (isLeave) setEnterState(); else setEnteredState();
                        if (data.points !== undefined) {
                            const p = $('.nav__points');
                            if (p) p.textContent = data.points;
                        }
                        updateStats();
                    } else {
                        setFailState();
                    }
                } catch {
                    setFailState();
                }
            });

            linksEl.insertBefore(btn, linksEl.firstChild);
        });
    }

    /* 5. STEAM RATING  (asking Steam nicely for numbers. they don't always respond nicely.) */
    let _ratingsEpoch = 0;
    async function addRatings(giveaways) {
        if (!C.x_steamRating) { $$('.sgfp-rating').forEach(e => e.remove()); return; }
        const epoch = ++_ratingsEpoch;
        const candidates = giveaways.filter(ga => ga.id.appId && !ga.dom.inner.querySelector('.sgfp-rating'));
        const ratings = await Promise.all(candidates.map(ga => API.fetchRating(ga.id.appId)));
        if (epoch !== _ratingsEpoch) return;  // stale batch - a newer run already started. abandon ship.
        candidates.forEach((ga, i) => {
            const r = ratings[i];
            if (!r) return;
            const cls = r.pct >= 80 ? 'sgfp-rt-good' : r.pct >= 50 ? 'sgfp-rt-mid' : 'sgfp-rt-bad';
            const badge = mkEl('span', { className: `sgfp-rating ${cls}`, title: T('badge_rating_t', r.pos, r.total) },
                [T('badge_rating', r.pct)]);
            ga.dom.inner.querySelector('.giveaway__heading')?.appendChild(badge);
        });
    }

    /* 6. DECORATIONS  (stickers on giveaways. I got carried away. no regrets.) */
    // DecorationRegistry: name > fn(ga, C) - new badge? one registerDecoration() call. I'm proud of this.
    const DecorationRegistry = new Map();
    function registerDecoration(name, fn) { DecorationRegistry.set(name, fn); }

    registerDecoration('chance', (ga, C) => {
        if (!C.x_showChance || ga.status.entered) return;
        const txt = ga.metrics.chance >= 100 ? '100%' : ga.metrics.chance.toFixed(2) + '%';
        ga.dom.inner.querySelector('.giveaway__links')?.appendChild(
            mkEl('span', { className: 'sgfp-chance' + (ga.metrics.chance < 1 ? ' low' : '') }, [T('badge_chance', txt)])
        );
    });

    registerDecoration('ptsBadge', (ga, C) => {
        if (!C.x_showPtsBadge) return;
        const cls = ga.data.cost <= 5 ? 'cheap' : ga.data.cost <= 25 ? 'mid' : 'exp';
        const linksArea = ga.dom.inner.querySelector('.giveaway__links');
        const enterBtn = linksArea?.querySelector('.sgfp-enter');
        const ptag = mkEl('span', { className: `sgfp-ptag ${cls}` }, [T('badge_price', ga.data.cost)]);
        if (enterBtn && enterBtn.nextSibling) linksArea.insertBefore(ptag, enterBtn.nextSibling);
        else if (linksArea) linksArea.appendChild(ptag);
    });

    registerDecoration('wlGlow', (ga, C) => {
        if (C.x_wlGlow && ga.status.isWl) ga.dom.outer.classList.add('sgfp-wl-glow');
    });

    registerDecoration('lvNegHighlight', (ga, C) => {
        if (C.x_highlightLvNeg && ga.status.lvNeg) ga.dom.outer.classList.add('sgfp-lvneg-hl');
    });

    registerDecoration('steamLink', (ga, C) => {
        if (!C.x_steamLink || !ga.id.appId || ga.dom.inner.querySelector('.sgfp-steam-link')) return;
        ga.dom.inner.querySelector('.giveaway__links')?.appendChild(
            mkEl('a', { className: 'sgfp-steam-link', href: `https://store.steampowered.com/app/${ga.id.appId}/`, target: '_blank', title: 'Steam Store' },
                [mkEl('i', { className: 'fa fa-steam' })])
        );
    });

    function decorate(giveaways) {
        giveaways.forEach(ga => {
            ga.dom.inner.querySelectorAll('.sgfp-chance, .sgfp-ptag, .sgfp-steam-link').forEach(e => e.remove());
            ga.dom.outer.classList.remove('sgfp-wl-glow', 'sgfp-dimmed', 'sgfp-hidden-ga', 'sgfp-lvneg-hl');
            DecorationRegistry.forEach(fn => fn(ga, C));
        });
    }

    /* 7. FILTER & SORT  (the main attraction. why we're all here. it just hides stuff.) */

    // FilterRegistry: name > factory(C) > predicate(ga) > bool (true = hide)
    // add a new filter? one line. I designed this. I'm not subtle about being pleased with myself.
    const FilterRegistry = new Map();
    function registerFilter(name, factory) { FilterRegistry.set(name, factory); }

    registerFilter('entered',   C => ga => C.f_hideEntered && ga.status.entered);
    registerFilter('group',     C => ga => C.f_hideGroup   && ga.status.isGroup);
    registerFilter('whitelist', C => ga => C.f_hideWL      && ga.status.isWhitelist);
    registerFilter('level',     C => ga => ga.data.level < C.f_minLv || ga.data.level > C.f_maxLv);
    registerFilter('entries',   C => ga => C.f_maxEntries > 0 && ga.data.entries > C.f_maxEntries);
    registerFilter('chance',    C => ga => C.f_minChance  > 0 && ga.metrics.chance < C.f_minChance);
    registerFilter('points',    C => {
        // exactSet is built once per applyFilters call - not per giveaway. I'm not a monster.
        const exactSet = C.f_exactP.trim()
            ? new Set(C.f_exactP.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)))
            : null;
        return ga => exactSet
            ? !exactSet.has(ga.data.cost)
            : (ga.data.cost < C.f_minP || ga.data.cost > C.f_maxP);
    });

    // SortRegistry: key > comparator(a, b)
    // new sort mode? SortRegistry.set(key, fn). yes, both registries are this clean. no, I won't stop.
    const SortRegistry = new Map([
        ['pts-asc',  (a, b) => a.data.cost      - b.data.cost],
        ['pts-desc', (a, b) => b.data.cost      - a.data.cost],
        ['ent-asc',  (a, b) => a.data.entries   - b.data.entries],
        ['ent-desc', (a, b) => b.data.entries   - a.data.entries],
        ['ch-desc',  (a, b) => b.metrics.chance - a.metrics.chance],
        ['lv-desc',  (a, b) => b.data.level     - a.data.level],
        ['end-asc',  (a, b) => a.data.endTime   - b.data.endTime],
    ]);

    let lastStats = { total: 0, shown: 0, hidden: 0 };
    function applyFilters(giveaways) {
        let shown = 0, hidden = 0;

        if (C.f_enabled) {
            // factories run once per call - predicates close over C and exactSet. efficient on purpose.
            const predicates = [...FilterRegistry.values()].map(factory => factory(C));
            giveaways.forEach(ga => {
                ga.dom.outer.classList.remove('sgfp-dimmed', 'sgfp-hidden-ga');
                if (predicates.some(pred => pred(ga))) {
                    hidden++;
                    ga.dom.outer.classList.add(C.f_dimMode ? 'sgfp-dimmed' : 'sgfp-hidden-ga');
                } else { shown++; }
            });
        } else {
            giveaways.forEach(ga => {
                ga.dom.outer.classList.remove('sgfp-dimmed', 'sgfp-hidden-ga');
                shown++;
            });
        }

        // 'default' sort uses originalIndex to undo user-applied sorting. they want it back. always.
        const sortFn = C.f_sort === 'default'
            ? (a, b) => a.data.originalIndex - b.data.originalIndex
            : SortRegistry.get(C.f_sort);
        if (sortFn) {
            const sortable = giveaways.filter(g => !g.status.isPinned);
            sortable.sort(sortFn);
            sortable.forEach(g => g.dom.outer.parentNode.appendChild(g.dom.outer));
        }

        lastStats = { total: giveaways.length, shown, hidden };
        updateStats();
    }
    function updateStats() {
        const map = { 'sgfp-s-total': lastStats.total, 'sgfp-s-shown': lastStats.shown, 'sgfp-s-hidden': lastStats.hidden, 'sgfp-s-pts': getPoints() };
        for (const [id, v] of Object.entries(map)) { const e = $id(id); if (e) e.textContent = v; }
    }

    /* 7b. AUTO SCROLL  (loads more pages as you scroll. you still won't win the game.) */
    class AutoScroller {
        constructor() {
            this._active   = false;
            this._loading  = false;
            this._page     = 1;
            this._done     = false;
            this._retries  = 0;  // reset on each successful fetch - eternal optimism
            // bind once - removeEventListener needs the EXACT same function reference. fun discovery.
            this._handler = this._onScroll.bind(this);
        }

        start() {
            if (this._active) return;
            this._active  = true;
            this._done    = false;
            this._retries = 0;
            const cur = document.querySelector('.pagination__navigation a.is-selected');
            this._page = cur ? (parseInt(cur.textContent, 10) || 1) : 1;
            window.addEventListener('scroll', this._handler);
            setTimeout(this._handler, TIMINGS.SCROLL_INIT_MS);
        }

        stop() {
            this._active = false;
            window.removeEventListener('scroll', this._handler);
        }

        _buildNextUrl() {
            const nextPage = this._page + 1;  // don't mutate yet - only increment on success. matters a lot.
            const loc = window.location;
            if (loc.pathname === '/' || loc.pathname === '') return `/giveaways/search?page=${nextPage}`;
            const url = new URL(loc.href);
            url.searchParams.set('page', nextPage);
            return url.toString();
        }

        _onScroll() {
            if (!this._active || this._loading || this._done) return;
            if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - TIMINGS.SCROLL_TRIGGER_PX) return;

            const nextPage = this._page + 1;
            const nextUrl = this._buildNextUrl();
            this._loading = true;

            const allRows = $$('.giveaway__row-outer-wrap');
            const lastRow = allRows[allRows.length - 1];
            if (!lastRow) { this._loading = false; return; }
            const parent = lastRow.parentNode;

            const loader = mkEl('div', { className: 'sgfp-scroll-loader' }, [T('scroll_load', nextPage)]);
            if (lastRow.nextSibling) parent.insertBefore(loader, lastRow.nextSibling);
            else parent.appendChild(loader);

            API.fetchPage(nextUrl)
                .then(html => {
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    const newRows = doc.querySelectorAll('.giveaway__row-outer-wrap');
                    if (newRows.length === 0) {
                        this._done = true;
                        loader.textContent = T('scroll_done');
                        loader.style.color = '#4ecb71';
                        setTimeout(() => loader.remove(), TIMINGS.LOADER_REMOVE_MS);
                        this._loading = false;
                        return;
                    }
                    let insertPoint = loader;
                    newRows.forEach(row => {
                        if (row.closest('.pinned-giveaways__inner-wrap')) return;
                        const imported = document.importNode(row, true);
                        insertPoint.parentNode.insertBefore(imported, insertPoint.nextSibling);
                        insertPoint = imported;
                    });
                    loader.remove();
                    this._page++;     // only here. not before. not during. here.
                    this._retries = 0;  // we made it, reset the shame counter
                    this._loading = false;
                    runAll();
                })
                .catch(err => {
                    this._retries++;
                    loader.textContent = T('scroll_err', this._retries, err.message);
                    if (this._retries >= 3) {
                        this._done = true;
                        this._loading = false;
                        loader.style.color = '#e05555';
                        setTimeout(() => loader.remove(), TIMINGS.ERROR_REMOVE_MS);
                    } else {
                        loader.style.color = '#c8b43c';
                        setTimeout(() => loader.remove(), TIMINGS.ERROR_REMOVE_MS);
                        // exponential backoff - sounds fancy, it's just FAIL_RESET_MS × retryCount
                        const backoff = TIMINGS.FAIL_RESET_MS * this._retries;
                        setTimeout(() => { this._loading = false; }, backoff);
                    }
                });
        }
    }
    const autoScroller = new AutoScroller();

    /* 8. RUN ALL  (the function that calls everything. yes, every time. yes, even that.) */
    function runAll() {
        const ga = parseAll();
        decorate(ga);
        addInlineEnterButtons(ga);
        applyFilters(ga);
        if (C.x_steamRating) addRatings(ga);
        if (C.x_autoScroll) autoScroller.start(); else autoScroller.stop();
    }

    /* 9. PANEL POSITIONING  (smart direction - opens toward free space. took embarrassingly long to get right.) */
    function positionPanel() {
        const panel = $id('sgfp-panel');
        const fab = $id('sgfp-fab');
        if (!panel || !fab) return;

        const fr = fab.getBoundingClientRect();
        const gap = 12;
        const vh = window.innerHeight, vw = window.innerWidth;

        // wipe all positioning first - old values fight new ones and everyone loses
        panel.style.top = ''; panel.style.bottom = '';
        panel.style.left = ''; panel.style.right = '';

        // vertical: top half > panel opens below. bottom half > panel opens above.
        const fabCenterY = fr.top + fr.height / 2;
        if (fabCenterY < vh / 2) {
            panel.style.top = `${fr.bottom + gap}px`;
        } else {
            panel.style.bottom = `${vh - fr.top + gap}px`;
        }

        // horizontal: right side > right-align. left side > left-align. straightforward. somehow.
        const fabCenterX = fr.left + fr.width / 2;
        if (fabCenterX > vw / 2) {
            panel.style.right = `${vw - fr.right}px`;
        } else {
            panel.style.left = `${fr.left}px`;
        }
    }

    function applyUISettings() {
        const panel = $id('sgfp-panel');
        const fab = $id('sgfp-fab');
        if (!panel || !fab) return;
        const scale = clamp(C.ui_scale, 60, 150);
        const w = clamp(C.ui_panelW, 240, 500);
        const fabSz = clamp(C.ui_fabSize, 32, 72);
        const opacity = clamp(C.ui_panelOpacity, 40, 100);
        panel.style.fontSize = `${12 * scale / 100}px`;
        panel.style.width = `${w}px`;
        panel.style.opacity = `${opacity / 100}`;
        fab.style.width = `${fabSz}px`;
        fab.style.height = `${fabSz}px`;
        const icon = fab.querySelector('.sgfp-fab-icon');
        if (icon) { icon.style.width = `${Math.round(fabSz * 0.65)}px`; icon.style.height = `${Math.round(fabSz * 0.65)}px`; }
        positionPanel();
    }

    /* 10. DRAGGABLE FAB  (drag the star anywhere. it saves position. it remembers. unlike me.) */
    function makeFabDraggable(fab) {
        let startX, startY, startLeft, startTop, dragging = false, moved = false;
        fab.addEventListener('mousedown', e => {
            if (e.button !== 0) return;
            dragging = true; moved = false;
            startX = e.clientX; startY = e.clientY;
            const r = fab.getBoundingClientRect();
            startLeft = r.left; startTop = r.top;
            fab.style.transition = 'none'; e.preventDefault();
        });
        document.addEventListener('mousemove', e => {
            if (!dragging) return;
            const dx = e.clientX - startX, dy = e.clientY - startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
            fab.style.left = `${clamp(startLeft + dx, 0, window.innerWidth - fab.offsetWidth)}px`;
            fab.style.top = `${clamp(startTop + dy, 0, window.innerHeight - fab.offsetHeight)}px`;
            fab.style.right = 'auto'; fab.style.bottom = 'auto';
            positionPanel();
        });
        document.addEventListener('mouseup', () => {
            if (!dragging) return;
            dragging = false; fab.style.transition = '';
            const r = fab.getBoundingClientRect();
            C.ui_fabX = Math.round(r.left); C.ui_fabY = Math.round(r.top); cfgSave(C);
        });
        fab.addEventListener('click', e => {
            if (moved) { e.preventDefault(); e.stopPropagation(); return; }
            $id('sgfp-panel').classList.toggle('open');
            fab.classList.toggle('active');
            positionPanel();
        });
    }
    function restoreFabPosition(fab) {
        if (C.ui_fabX >= 0 && C.ui_fabY >= 0) {
            fab.style.left = `${clamp(C.ui_fabX, 0, window.innerWidth - fab.offsetWidth)}px`;
            fab.style.top = `${clamp(C.ui_fabY, 0, window.innerHeight - fab.offsetHeight)}px`;
            fab.style.right = 'auto'; fab.style.bottom = 'auto';
        }
    }

    /* 11. CSS  (dark theme. blue accents. a suspicious amount of border-radius. I have a type.) */
    function injectCSS() {
        const s = document.createElement('style'); s.id = 'sgfp-css';
        s.textContent = `
/* ── FAB ── */
#sgfp-fab {
    position: fixed; bottom: 24px; right: 24px; z-index: 999999;
    width: ${C.ui_fabSize}px; height: ${C.ui_fabSize}px; border-radius: 50%;
    background: linear-gradient(135deg, #4a7ab5, #3a5a8a);
    border: 2px solid #5a8ac0; color: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: grab; box-shadow: 0 4px 16px rgba(0,0,0,.4);
    transition: all .2s; user-select: none;
}
#sgfp-fab:hover { box-shadow: 0 6px 24px rgba(74,122,181,.5); }
#sgfp-fab:active { cursor: grabbing; }
#sgfp-fab.active { background: linear-gradient(135deg, #3a6a3a, #2a5a2a); border-color: #4a8a4a; }
#sgfp-fab .sgfp-fab-icon { pointer-events: none; }

/* ── Panel ── */
#sgfp-panel {
    display: none; position: fixed;
    width: ${C.ui_panelW}px; height: 540px;
    background: #1b2028; border: 1px solid #2e3d4d;
    border-radius: 12px; color: #d0d8e2; font-family: 'Open Sans', Arial, sans-serif;
    font-size: 12px; z-index: 999998; box-shadow: 0 12px 48px rgba(0,0,0,.6);
    overflow: hidden; opacity: ${C.ui_panelOpacity / 100};
}
#sgfp-panel.open { display: flex; flex-direction: column; }

/* ── Tabs ── */
.sgfp-tabs { display: flex; background: #151a22; border-bottom: 1px solid #2e3d4d; flex-shrink: 0; }
.sgfp-tab {
    flex: 1; padding: 10px 0; text-align: center; cursor: pointer;
    font-size: 0.92em; font-weight: 600; color: #7a8a9a;
    transition: all .15s; border-bottom: 2px solid transparent;
}
.sgfp-tab:hover { color: #b0c0d0; }
.sgfp-tab.active { color: #7ab8e0; border-bottom-color: #4a8ab5; }

/* ── Tab content - FIXED HEIGHT ── */
.sgfp-tc { display: none; padding: 12px 16px; overflow-y: auto; height: 484px; }
.sgfp-tc.active { display: block; }
.sgfp-tc::-webkit-scrollbar { width: 5px; }
.sgfp-tc::-webkit-scrollbar-thumb { background: #2e3d4d; border-radius: 3px; }

/* ── Section ── */
.sgfp-sh {
    font-size: 0.75em; text-transform: uppercase; letter-spacing: 1.2px;
    color: #5a7a8a; margin: 10px 0 6px; padding-top: 8px;
    border-top: 1px solid rgba(255,255,255,.06);
}
.sgfp-sh:first-child { border-top: none; margin-top: 2px; padding-top: 0; }

/* ── Row ── */
.sgfp-r { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; min-height: 28px; }
.sgfp-r label { flex: 1; color: #b0bcc8; font-size: 0.96em; }
.sgfp-r .sgfp-hint { font-size: 0.78em; color: #607080; display: block; margin-top: 1px; }

/* ── Inputs ── */
.sgfp-n {
    width: 58px; background: #111820; border: 1px solid #2e3d4d;
    color: #e0e6ec; border-radius: 5px; padding: 4px 6px; text-align: center; font-size: 1em;
}
.sgfp-n:focus { border-color: #4a8ab5; outline: none; }
.sgfp-t {
    width: 100px; background: #111820; border: 1px solid #2e3d4d;
    color: #e0e6ec; border-radius: 5px; padding: 4px 8px; font-size: 0.92em;
}
.sgfp-t:focus { border-color: #4a8ab5; outline: none; }
.sgfp-t::placeholder { color: #445; }
.sgfp-sel {
    background: #111820; border: 1px solid #2e3d4d; color: #e0e6ec;
    border-radius: 5px; padding: 4px 6px; font-size: 0.92em; cursor: pointer;
}

/* ── SWITCH - compact pill ── */
.sgfp-sw {
    position: relative; display: block;
    width: 36px; min-width: 36px; max-width: 36px; height: 20px;
    flex-shrink: 0; flex-grow: 0;
}
.sgfp-sw input { opacity: 0; width: 0; height: 0; position: absolute; }
.sgfp-sw .sl {
    position: absolute; cursor: pointer; top: 0; left: 0;
    width: 36px; height: 20px;
    background: #2a2a38; border-radius: 20px; transition: .25s;
}
.sgfp-sw .sl::before {
    content: ''; position: absolute; height: 14px; width: 14px;
    left: 3px; top: 3px; background: #556;
    border-radius: 50%; transition: .25s;
}
.sgfp-sw input:checked + .sl { background: #28603a; }
.sgfp-sw input:checked + .sl::before { transform: translateX(16px); background: #4ecb71; }

/* ── Buttons ── */
.sgfp-btn {
    width: 100%; padding: 8px; margin-top: 8px; border: none;
    border-radius: 6px; cursor: pointer; font-size: 0.96em; font-weight: 700;
    background: linear-gradient(135deg, #3a6b8a, #2a5070); color: #e0e8f0;
    transition: all .15s; letter-spacing: .5px;
}
.sgfp-btn:hover { background: linear-gradient(135deg, #4a7b9a, #3a6080); }
.sgfp-btn-danger { background: linear-gradient(135deg, #5a3030, #4a2020) !important; }
.sgfp-btn-danger:hover { background: linear-gradient(135deg, #6a3a3a, #5a2a2a) !important; }

/* ── Slider ── */
.sgfp-slider-val { display: inline-block; min-width: 36px; text-align: right; color: #7ab8e0; font-weight: 700; font-size: 0.92em; }
.sgfp-range {
    -webkit-appearance: none; width: 90px; height: 4px; background: #2e3d4d;
    border-radius: 2px; outline: none; cursor: pointer; margin: 0 6px;
}
.sgfp-range::-webkit-slider-thumb {
    -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
    background: #4a8ab5; cursor: pointer; border: 2px solid #1b2028;
}

/* ── Stats ── */
.sgfp-stats {
    display: flex; justify-content: space-around;
    padding: 6px 0; background: #111820; flex-shrink: 0;
    border-bottom: 1px solid #2e3d4d;
}
.sgfp-stats > div { text-align: center; color: #7a8a9a; font-size: 0.7em; text-transform: uppercase; }
.sgfp-stats .n { display: block; font-size: 1.2em; font-weight: 700; color: #b0bcc8; }
.sgfp-stats .n.g { color: #4ecb71; } .sgfp-stats .n.r { color: #e05555; } .sgfp-stats .n.b { color: #7ab8e0; }

/* ── About ── */
.sgfp-about { text-align: center; padding: 24px 12px; }
.sgfp-about h2 { margin: 0 0 4px; font-size: 1.5em; color: #e8eef4; }
.sgfp-about .ver { color: #5a7a8a; font-size: 0.92em; margin-bottom: 16px; display: block; }
.sgfp-about p { color: #8a9aaa; font-size: 0.92em; line-height: 1.7; margin: 8px 0; }
.sgfp-about a { color: #7ab8e0; text-decoration: none; }
.sgfp-about a:hover { text-decoration: underline; }
.sgfp-about .sgfp-logo { font-size: 3.3em; margin-bottom: 8px; }

/* ═══ GIVEAWAY DECORATIONS ═══ */

/* Enter button - green for join, red for leave */
.sgfp-enter {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 10px; margin-right: 10px;
    cursor: pointer; font-size: 12px; font-weight: 600;
    border: 1px solid transparent; border-radius: 4px;
    transition: all .15s; text-decoration: none !important;
    line-height: 22px; vertical-align: middle;
}
.sgfp-enter-join {
    color: #4ecb71; border-color: #2a5a3a;
}
.sgfp-enter-join:hover { background: #2a5a3a; color: #fff; }
.sgfp-enter-leave {
    color: #e06060; border-color: #5a2a2a;
}
.sgfp-enter-leave:hover { background: #5a2a2a; color: #fff; }
.sgfp-enter.sgfp-loading { color: #999; border-color: #444; cursor: wait; }
.sgfp-enter.sgfp-no-pts { color: #e05555 !important; border-color: #5a2a2a !important; animation: sgfp-shake .3s; }
@keyframes sgfp-shake { 25%{transform:translateX(-3px)} 75%{transform:translateX(3px)} }

/* Scroll loader */
.sgfp-scroll-loader { text-align: center; padding: 20px; color: #7ab8e0; font-size: 13px; }

/* Chance badge - with label */
.sgfp-chance {
    display: inline-block; margin-left: 8px; padding: 2px 8px;
    background: rgba(78,203,113,.12); color: #4ecb71; border-radius: 10px;
    font-size: 12.5px; font-weight: 600; vertical-align: middle;
}
.sgfp-chance.low { background: rgba(224,85,85,.12); color: #e05555; }

/* Points badge - with label */
.sgfp-ptag {
    display: inline-block; padding: 2px 8px; margin-right: 6px;
    border-radius: 4px; font-size: 12.5px; font-weight: 600; vertical-align: middle;
}
.sgfp-ptag.cheap { background: rgba(78,203,113,.12); color: #4ecb71; }
.sgfp-ptag.mid   { background: rgba(200,180,60,.12); color: #c8b43c; }
.sgfp-ptag.exp   { background: rgba(224,85,85,.12); color: #e05555; }

/* Rating badge - with label */
.sgfp-rating {
    display: inline-block; padding: 2px 8px; margin-left: 6px;
    border-radius: 4px; font-size: 12.5px; font-weight: 600;
}
.sgfp-rt-good { background: rgba(78,203,113,.12); color: #4ecb71; }
.sgfp-rt-mid  { background: rgba(200,180,60,.12); color: #c8b43c; }
.sgfp-rt-bad  { background: rgba(224,85,85,.12); color: #e05555; }

/* Steam link */
.sgfp-steam-link {
    display: inline-block; margin-left: 8px; color: #6a9aba;
    font-size: 14px; vertical-align: middle; text-decoration: none !important;
}
.sgfp-steam-link:hover { color: #7ab8e0; }

/* Highlights */
.sgfp-wl-glow .giveaway__row-inner-wrap { box-shadow: inset 3px 0 0 #4ecb71 !important; }
.sgfp-dimmed { opacity: .2; transition: opacity .15s; }
.sgfp-dimmed:hover { opacity: .65; }
.sgfp-hidden-ga { display: none !important; }
.sgfp-lvneg-hl .giveaway__row-inner-wrap { box-shadow: inset 3px 0 0 #e05555 !important; }
        `;
        document.head.appendChild(s);
    }

    /* 12. BUILD PANEL  (UI factory. generates HTML strings like it's 2012. it works, don't touch it.) */
    function sw(id, lbl, chk, hint = '') {
        const h = hint ? `<span class="sgfp-hint">${hint}</span>` : '';
        return `<div class="sgfp-r"><label>${lbl}${h}</label><label class="sgfp-sw"><input type="checkbox" id="${id}" ${chk?'checked':''}><span class="sl"></span></label></div>`;
    }
    function num(id, lbl, val, min = 0, max = 9999) {
        return `<div class="sgfp-r"><label>${lbl}</label><input type="number" class="sgfp-n" id="${id}" value="${val}" min="${min}" max="${max}"></div>`;
    }
    function slider(id, lbl, val, min, max, step, unit = '') {
        return `<div class="sgfp-r"><label>${lbl}</label>
            <input type="range" class="sgfp-range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}">
            <span class="sgfp-slider-val" id="${id}-v">${val}${unit}</span></div>`;
    }

    function buildFilterTab() {
        return `
        <div class="sgfp-tc active" id="sgfp-t-filter">
            ${sw('sgfp-f-on', T('f_enabled'), C.f_enabled)}
            <div class="sgfp-sh">${T('sh_points')}</div>
            ${num('sgfp-f-minP', T('f_from'), C.f_minP, 0, 300)}
            ${num('sgfp-f-maxP', T('f_to'), C.f_maxP, 0, 300)}
            <div class="sgfp-r"><label>${T('f_exact')}<span class="sgfp-hint">${T('f_exact_hint')}</span></label>
                <input type="text" class="sgfp-t" id="sgfp-f-exactP" value="${C.f_exactP}" placeholder="${T('f_exact_ph')}"></div>
            <div class="sgfp-sh">${T('sh_level')}</div>
            ${num('sgfp-f-minLv', T('f_from'), C.f_minLv, 0, 10)}
            ${num('sgfp-f-maxLv', T('f_to'), C.f_maxLv, 0, 10)}
            <div class="sgfp-sh">${T('sh_entries')}</div>
            ${num('sgfp-f-maxE', T('f_max_entries'), C.f_maxEntries, 0, 99999)}
            ${num('sgfp-f-minC', T('f_min_chance'), C.f_minChance, 0, 100)}
            <div class="sgfp-sh">${T('sh_hide')}</div>
            ${sw('sgfp-f-hideE', T('f_hide_entered'), C.f_hideEntered)}
            ${sw('sgfp-f-hideG', T('f_hide_group'), C.f_hideGroup)}
            ${sw('sgfp-f-hideWL', T('f_hide_wl'), C.f_hideWL)}
            ${sw('sgfp-f-dim', T('f_dim'), C.f_dimMode)}
            <div class="sgfp-sh">${T('sh_sort')}</div>
            <div class="sgfp-r"><label>${T('f_sort_lbl')}</label>
                <select class="sgfp-sel" id="sgfp-f-sort">
                    <option value="default" ${C.f_sort==='default'?'selected':''}>${T('sort_default')}</option>
                    <option value="pts-asc" ${C.f_sort==='pts-asc'?'selected':''}>${T('sort_pts_asc')}</option>
                    <option value="pts-desc" ${C.f_sort==='pts-desc'?'selected':''}>${T('sort_pts_desc')}</option>
                    <option value="ent-asc" ${C.f_sort==='ent-asc'?'selected':''}>${T('sort_ent_asc')}</option>
                    <option value="ent-desc" ${C.f_sort==='ent-desc'?'selected':''}>${T('sort_ent_desc')}</option>
                    <option value="ch-desc" ${C.f_sort==='ch-desc'?'selected':''}>${T('sort_ch_desc')}</option>
                    <option value="lv-desc" ${C.f_sort==='lv-desc'?'selected':''}>${T('sort_lv_desc')}</option>
                    <option value="end-asc" ${C.f_sort==='end-asc'?'selected':''}>${T('sort_end_asc')}</option>
                </select></div>
        </div>`;
    }

    function buildFeatTab() {
        return `
        <div class="sgfp-tc" id="sgfp-t-feat">
            <div class="sgfp-sh">${T('sh_buttons')}</div>
            ${sw('sgfp-x-enter', T('x_enter'), C.x_inlineEnter, T('x_enter_hint'))}
            <div class="sgfp-sh">${T('sh_info')}</div>
            ${sw('sgfp-x-chance', T('x_chance'), C.x_showChance, T('x_chance_hint'))}
            ${sw('sgfp-x-pts', T('x_pts'), C.x_showPtsBadge, T('x_pts_hint'))}
            ${sw('sgfp-x-rating', T('x_rating'), C.x_steamRating, T('x_rating_hint'))}
            ${sw('sgfp-x-steam', T('x_steam'), C.x_steamLink)}
            <div class="sgfp-sh">${T('sh_highlight')}</div>
            ${sw('sgfp-x-wl', T('x_wl'), C.x_wlGlow)}
            ${sw('sgfp-x-lvneg', T('x_lvneg'), C.x_highlightLvNeg, T('x_lvneg_hint'))}
            <div class="sgfp-sh">${T('sh_scroll')}</div>
            ${sw('sgfp-x-scroll', T('x_scroll'), C.x_autoScroll, T('x_scroll_hint'))}
        </div>`;
    }

    function buildSettingsTab() {
        return `
        <div class="sgfp-tc" id="sgfp-t-settings">
            <div class="sgfp-sh">${T('sh_scale')}</div>
            ${slider('sgfp-ui-scale', T('ui_text'), C.ui_scale, 60, 150, 5, '%')}
            ${slider('sgfp-ui-panelW', T('ui_panel_w'), C.ui_panelW, 240, 500, 10, 'px')}
            ${slider('sgfp-ui-fabSize', T('ui_btn_sz'), C.ui_fabSize, 32, 72, 2, 'px')}
            ${slider('sgfp-ui-opacity', T('ui_opacity'), C.ui_panelOpacity, 40, 100, 5, '%')}
            <div class="sgfp-sh">${T('sh_pos')}</div>
            <div class="sgfp-r"><label style="color:#607080;font-size:0.83em">${T('ui_pos_hint')}</label></div>
            <button class="sgfp-btn sgfp-btn-danger" id="sgfp-ui-resetpos" style="margin-top:6px">${T('btn_resetpos')}</button>
            <div class="sgfp-sh">${T('sh_lang')}</div>
            <div class="sgfp-r"><label>${T('lang_lbl')}</label>
                <select class="sgfp-sel" id="sgfp-ui-lang">
                    <option value="auto" ${C.ui_lang==='auto'?'selected':''}>Auto</option>
                    <option value="en" ${C.ui_lang==='en'?'selected':''}>English</option>
                    <option value="ru" ${C.ui_lang==='ru'?'selected':''}>Русский</option>
                </select></div>
            <div class="sgfp-sh" style="margin-top:12px">${T('sh_data')}</div>
            <button class="sgfp-btn sgfp-btn-danger" id="sgfp-reset">${T('btn_resetall')}</button>
        </div>`;
    }

    function buildAboutTab() {
        return `
        <div class="sgfp-tc" id="sgfp-t-about">
            <div class="sgfp-about">
                <div class="sgfp-logo">⚡</div>
                <h2>SG Toolkit Pro</h2>
                <span class="ver">v${VER}</span>
                <p>${T('about_desc')}</p>
                <p style="margin-top:16px"><strong>${T('about_author')}</strong> d08 (pain)<br>
                    <a href="https://github.com/128team/tm_scripts/" target="_blank">🔗 github.com/128team/tm_scripts</a></p>
                <p style="color:#4a5a6a;font-size:0.83em;margin-top:24px">${T('about_tip')}</p>
            </div>
        </div>`;
    }

    function createPanelDOM() {
        const fab = mkEl('div', { id: 'sgfp-fab', title: T('fab_title') });
        fab.innerHTML = `<img class="sgfp-fab-icon" src="https://raw.githubusercontent.com/128team/assets/main/logo128b.jpeg" style="width:${Math.round(C.ui_fabSize * 0.65)}px;height:${Math.round(C.ui_fabSize * 0.65)}px;border-radius:4px;pointer-events:none">`;
        document.body.appendChild(fab);
        restoreFabPosition(fab);
        makeFabDraggable(fab);

        const panel = mkEl('div', { id: 'sgfp-panel' });
        panel.innerHTML = `
        <div class="sgfp-tabs">
            <div class="sgfp-tab active" data-tab="filter">${T('tab_filter')}</div>
            <div class="sgfp-tab" data-tab="feat">${T('tab_feat')}</div>
            <div class="sgfp-tab" data-tab="settings">${T('tab_settings')}</div>
            <div class="sgfp-tab" data-tab="about">${T('tab_about')}</div>
        </div>
        <div class="sgfp-stats">
            <div>${T('stat_total')}<span class="n" id="sgfp-s-total">0</span></div>
            <div>${T('stat_shown')}<span class="n g" id="sgfp-s-shown">0</span></div>
            <div>${T('stat_hidden')}<span class="n r" id="sgfp-s-hidden">0</span></div>
            <div>Points<span class="n b" id="sgfp-s-pts">0</span></div>
        </div>
        ${buildFilterTab()}
        ${buildFeatTab()}
        ${buildSettingsTab()}
        ${buildAboutTab()}`;
        document.body.appendChild(panel);
        return { fab, panel };
    }

    /* 13. REBUILD PANEL  (called when language changes - simplest way to re-translate everything.) */
    function rebuildPanel() {
        const wasOpen = $id('sgfp-panel')?.classList.contains('open');
        $id('sgfp-panel')?.remove();
        $id('sgfp-fab')?.remove();
        const { fab, panel } = createPanelDOM();
        bindPanelEvents(fab, panel);
        if (wasOpen) { panel.classList.add('open'); fab.classList.add('active'); positionPanel(); }
        runAll();
    }

    function bindPanelEvents(fab, panel) {
        // tab switching - remove active from all, add to clicked one. revolutionary UX pattern.
        panel.querySelectorAll('.sgfp-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                panel.querySelectorAll('.sgfp-tab').forEach(t => t.classList.remove('active'));
                panel.querySelectorAll('.sgfp-tc').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                $id(`sgfp-t-${tab.dataset.tab}`)?.classList.add('active');
            });
        });

        // all inputs feed the same debounced function. change anything > 300ms > runAll. clean.
        const debouncedApply = debounce(() => { readUI(); runAll(); }, TIMINGS.DEBOUNCE_MS);
        panel.querySelectorAll('.sgfp-sw input').forEach(inp => inp.addEventListener('change', debouncedApply));
        $id('sgfp-f-sort').addEventListener('change', debouncedApply);
        panel.querySelectorAll('.sgfp-n, .sgfp-t').forEach(inp => {
            inp.addEventListener('keydown', e => { if (e.key === 'Enter') debouncedApply(); });
            inp.addEventListener('change', debouncedApply);
        });
        panel.querySelectorAll('.sgfp-sel').forEach(sel => sel.addEventListener('change', debouncedApply));

        // sliders update their value label in real time. small detail. satisfying.
        panel.querySelectorAll('.sgfp-range').forEach(range => {
            const valEl = $id(range.id + '-v');
            if (!valEl) return;
            const unit = valEl.textContent.replace(/[\d]/g, '');
            range.addEventListener('input', () => { valEl.textContent = range.value + unit; });
            range.addEventListener('change', () => { readUISettings(); applyUISettings(); });
        });
        $id('sgfp-ui-resetpos').addEventListener('click', () => {
            C.ui_fabX = -1; C.ui_fabY = -1; cfgSave(C);
            fab.style.left = ''; fab.style.top = ''; fab.style.right = '24px'; fab.style.bottom = '24px';
            positionPanel();
        });
        // language selector - needs full panel rebuild to re-translate all strings
        $id('sgfp-ui-lang').addEventListener('change', () => {
            C.ui_lang = $id('sgfp-ui-lang').value;
            cfgSave(C);
            rebuildPanel();
        });
        $id('sgfp-reset').addEventListener('click', () => {
            if (confirm(T('confirm_reset'))) { cfgSave(DEFAULTS); location.reload(); }
        });

        document.addEventListener('keydown', e => {
            if (e.altKey && e.key.toLowerCase() === 'f') {
                panel.classList.toggle('open'); fab.classList.toggle('active'); positionPanel(); e.preventDefault();
            }
        });
        window.addEventListener('resize', () => positionPanel());

        applyUISettings();
    }

    function buildPanel() {
        const { fab, panel } = createPanelDOM();
        bindPanelEvents(fab, panel);
    }

    /* 14. READ UI > CONFIG  (DOM values > config object. boring. necessary. the glue.) */
    function readUI() {
        const n = (id, def = 0) => { const x = +$id(id).value; return Number.isNaN(x) ? def : x; };
        C.f_enabled     = $id('sgfp-f-on').checked;
        C.f_minP        = n('sgfp-f-minP');
        C.f_maxP        = n('sgfp-f-maxP', 300);
        C.f_exactP      = $id('sgfp-f-exactP').value.trim();
        C.f_minLv       = n('sgfp-f-minLv');
        C.f_maxLv       = n('sgfp-f-maxLv', 10);
        C.f_maxEntries  = n('sgfp-f-maxE');
        C.f_minChance   = n('sgfp-f-minC');
        C.f_hideEntered = $id('sgfp-f-hideE').checked;
        C.f_hideGroup   = $id('sgfp-f-hideG').checked;
        C.f_hideWL      = $id('sgfp-f-hideWL').checked;
        C.f_dimMode     = $id('sgfp-f-dim').checked;
        C.f_sort        = $id('sgfp-f-sort').value;
        C.x_inlineEnter = $id('sgfp-x-enter').checked;
        C.x_showChance  = $id('sgfp-x-chance').checked;
        C.x_showPtsBadge= $id('sgfp-x-pts').checked;
        C.x_steamRating = $id('sgfp-x-rating').checked;
        C.x_steamLink   = $id('sgfp-x-steam').checked;
        C.x_wlGlow      = $id('sgfp-x-wl').checked;
        C.x_highlightLvNeg = $id('sgfp-x-lvneg').checked;
        C.x_autoScroll  = $id('sgfp-x-scroll').checked;
        cfgSave(C);
    }
    function readUISettings() {
        const n = (id, def) => { const x = +$id(id).value; return Number.isNaN(x) ? def : x; };
        C.ui_scale       = n('sgfp-ui-scale', 100);
        C.ui_panelW      = n('sgfp-ui-panelW', 330);
        C.ui_fabSize     = n('sgfp-ui-fabSize', 48);
        C.ui_panelOpacity= n('sgfp-ui-opacity', 95);
        cfgSave(C);
    }

    /* 15. TAMPERMONKEY MENU  (one menu item. it opens the panel. that's the whole section.) */
    GM_registerMenuCommand('Toggle SG Toolkit Pro (Alt+F)', () => {
        $id('sgfp-panel')?.classList.toggle('open');
        $id('sgfp-fab')?.classList.toggle('active');
        positionPanel();
    });

    /* 16. INIT  (the main(). if there are no giveaways on the page we just... leave. quietly.) */
    function init() {
        if (!$$('.giveaway__row-outer-wrap').length) return;
        injectCSS();
        buildPanel();
        runAll();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();
