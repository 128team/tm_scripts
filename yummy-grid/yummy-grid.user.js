// ==UserScript==
// @name         YummyAnime Grid View
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Сетка аниме с большими постерами
// @author       d08
// @match        https://ru.yummyani.me/*
// @match        https://yummyani.me/*
// @match        http://ru.yummyani.me/*
// @match        http://yummyani.me/*
// @include      https://ru.yummyani.me/*
// @include      https://yummyani.me/*
// @grant        none
// @run-at       document-end
// @noframes
// ==/UserScript==


(function() {
    'use strict';
        var css = document.createElement('style');
    css.textContent = '#ym-grid-toggle{position:fixed!important;top:10px!important;left:10px!important;z-index:2147483647!important;width:50px!important;height:50px!important;border:3px solid #fff!important;border-radius:50%!important;background:#e91e63!important;color:#fff!important;font-size:22px!important;cursor:pointer!important;box-shadow:0 4px 20px rgba(0,0,0,.7)!important;display:flex!important;align-items:center!important;justify-content:center!important;line-height:1!important;padding:0!important;margin:0!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;font-family:sans-serif!important;}#ym-grid-toggle.on{background:#3cce7b!important;}.ym-grid{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(130px,1fr))!important;gap:12px!important;padding:10px 8px!important;}.ym-card{position:relative;border-radius:10px;overflow:hidden;background:#1e1e2e;}.ym-card-poster{position:relative;width:100%;aspect-ratio:2/3;overflow:hidden;display:block;text-decoration:none;}.ym-card-poster img{width:100%;height:100%;object-fit:cover;display:block;}.ym-dot{position:absolute;top:6px;left:6px;width:10px;height:10px;border-radius:50%;z-index:3;border:1.5px solid rgba(0,0,0,.4);}.ym-rating{position:absolute;top:5px;right:5px;background:rgba(0,0,0,.75);color:#ffc107;font-size:12px;font-weight:700;padding:3px 6px;border-radius:6px;z-index:3;display:flex;align-items:center;gap:3px;}.ym-rating svg{width:11px;height:11px;fill:#ffc107;}.ym-score{position:absolute;bottom:5px;left:5px;background:rgba(60,206,123,.9);color:#fff;font-size:11px;font-weight:700;padding:2px 6px;border-radius:5px;z-index:3;display:flex;align-items:center;gap:3px;}.ym-score svg{width:11px;height:11px;fill:#fff;}.ym-fav{position:absolute;bottom:5px;right:5px;z-index:3;}.ym-fav svg{width:16px;height:16px;fill:#be46c6;}.ym-info{padding:6px 7px 8px;}.ym-title{font-size:11.5px;font-weight:600;color:#e0e0e0;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word;text-decoration:none;}.ym-hide{display:none!important;}';
    document.head.appendChild(css);

    var STAR = '<svg viewBox="0 0 20 20"><path d="M13.6 5.7 11.3.8A1.5 1.5 0 0 0 10 0c-.3 0-.5 0-.8.2l-.5.6-2.3 5-5.2.7-.7.3a1.5 1.5 0 0 0 0 2.3l3.7 3.8-1 5.3A1.5 1.5 0 0 0 4.7 20c.3 0 .5 0 .8-.2l4.6-2.5 4.6 2.5c.5.3 1 .3 1.5 0a1.5 1.5 0 0 0 .6-1.6l-.9-5.3L19.6 9c.4-.4.5-1 .3-1.6a1.5 1.5 0 0 0-1.1-1l-5.2-.8Z"/></svg>';
    var HEART = '<svg viewBox="0 0 20 20"><path d="M18.4 2.8a5.3 5.3 0 0 0-4-1.8 5 5 0 0 0-3.1 1.1c-.5.4-1 .8-1.3 1.3-.4-.5-.8-1-1.3-1.3A5 5 0 0 0 5.6 1a5 5 0 0 0-4 1.8A6.4 6.4 0 0 0 0 7c0 1.7.6 3.3 2 5 1.2 1.4 3 2.9 5 4.6l2.2 2a1.2 1.2 0 0 0 1.6 0l2.3-2c2-1.7 3.7-3.2 5-4.7a7.6 7.6 0 0 0 1.9-5c0-1.6-.6-3.1-1.6-4.2Z"/></svg>';

    var isOn = false, savedUl = null, gridDiv = null;

    function findItems() {
        var result = [];
        var imgs = document.querySelectorAll('img');
        for (var i = 0; i < imgs.length; i++) {
            var src = imgs[i].getAttribute('src') || '';
            if (src.indexOf('posters') !== -1) {
                var li = imgs[i].closest('li');
                if (li && result.indexOf(li) === -1) result.push(li);
            }
        }
        return result;
    }

    function parse(li) {
        var a = li.querySelector('a');
        var href = a ? (a.getAttribute('href') || '#') : '#';
        var img = null;
        var allImg = li.querySelectorAll('img');
        for (var i = 0; i < allImg.length; i++) {
            if ((allImg[i].getAttribute('src') || '').indexOf('posters') !== -1) { img = allImg[i]; break; }
        }
        var poster = '';
        if (img) {
            poster = img.getAttribute('data-medium') || img.getAttribute('data-big') || img.getAttribute('src') || '';
            if (poster.indexOf('//') === 0) poster = 'https:' + poster;
        }
        var title = '';
        var spans = li.querySelectorAll('span');
        for (var i = 0; i < spans.length; i++) {
            var t = spans[i].textContent.trim();
            if (t.length > title.length && t.length > 3 && t.length < 80 && !/^\d+\.?\d*$/.test(t) && !/^\d+[дdhчм]/.test(t)) title = t;
        }
        var dotColor = '';
        var dotEl = li.querySelector('span[data-status]');
        if (!dotEl) {
            var allS = li.querySelectorAll('span[title]');
            for (var i = 0; i < allS.length; i++) { if ((allS[i].getAttribute('title') || '').indexOf('татус') !== -1) { dotEl = allS[i]; break; } }
        }
        if (dotEl) try { dotColor = window.getComputedStyle(dotEl).backgroundColor; } catch(e) {}
        var ratingText = '';
        var allS2 = li.querySelectorAll('span[data-balloon]');
        for (var i = 0; i < allS2.length; i++) {
            if ((allS2[i].getAttribute('data-balloon') || '').indexOf('ейтинг') !== -1) { ratingText = allS2[i].textContent.replace(/[^\d.]/g, ''); break; }
        }
        if (!ratingText) { var m = li.textContent.match(/(\d\.\d{2})/g); if (m) ratingText = m[m.length - 1]; }
        var userScore = '';
        var scoreEl = li.querySelector('span[data-rating]');
        if (scoreEl) { var v = parseFloat(scoreEl.getAttribute('data-rating')); if (v > 0) userScore = '' + Math.round(v); }
        var isFav = false;
        var svgs = li.querySelectorAll('svg');
        for (var i = 0; i < svgs.length; i++) { if ((svgs[i].getAttribute('fill') || '').indexOf('pink') !== -1) { isFav = true; break; } }
        return { href: href, poster: poster, title: title, dotColor: dotColor, rating: ratingText, score: userScore, fav: isFav };
    }

    function makeCard(d) {
        var c = document.createElement('div');
        c.className = 'ym-card';
        var h = '<a class="ym-card-poster" href="' + d.href + '">';
        if (d.poster) h += '<img src="' + d.poster + '" loading="lazy">';
        if (d.dotColor) h += '<span class="ym-dot" style="background-color:' + d.dotColor + '"></span>';
        if (d.rating) h += '<span class="ym-rating">' + STAR + d.rating + '</span>';
        if (d.score) h += '<span class="ym-score">' + STAR + d.score + '</span>';
        if (d.fav) h += '<span class="ym-fav">' + HEART + '</span>';
        h += '</a><div class="ym-info"><a class="ym-title" href="' + d.href + '">' + d.title + '</a></div>';
        c.innerHTML = h;
        return c;
    }

    function turnOn() {
        var items = findItems();
        if (!items.length) return false;
        savedUl = items[0].parentElement;
        if (!savedUl) return false;
        if (gridDiv) gridDiv.remove();
        gridDiv = document.createElement('div');
        gridDiv.className = 'ym-grid';
        gridDiv.id = 'ym-grid-box';
        for (var i = 0; i < items.length; i++) gridDiv.appendChild(makeCard(parse(items[i])));
        savedUl.parentNode.insertBefore(gridDiv, savedUl.nextSibling);
        savedUl.classList.add('ym-hide');
        isOn = true;
        try { localStorage.setItem('ymg', '1'); } catch(e) {}
        return true;
    }

    function turnOff() {
        if (gridDiv) { gridDiv.remove(); gridDiv = null; }
        if (savedUl) savedUl.classList.remove('ym-hide');
        isOn = false;
        try { localStorage.setItem('ymg', '0'); } catch(e) {}
    }

    var btn = document.createElement('div');
    btn.id = 'ym-grid-toggle';
    btn.textContent = '\u229E';
    btn.setAttribute('style', 'position:fixed!important;top:10px!important;left:10px!important;z-index:2147483647!important;width:50px!important;height:50px!important;border:3px solid #fff!important;border-radius:50%!important;background:#e91e63!important;color:#fff!important;font-size:22px!important;cursor:pointer!important;box-shadow:0 4px 20px rgba(0,0,0,.7)!important;display:flex!important;align-items:center!important;justify-content:center!important;line-height:1!important;padding:0!important;margin:0!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;');
    btn.addEventListener('touchend', function(e) {
        e.preventDefault();
        if (isOn) { turnOff(); btn.style.background = '#e91e63'; btn.textContent = '\u229E'; }
        else { if (turnOn()) { btn.style.background = '#3cce7b'; btn.textContent = '\u2630'; } }
    });
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        if (isOn) { turnOff(); btn.style.background = '#e91e63'; btn.textContent = '\u229E'; }
        else { if (turnOn()) { btn.style.background = '#3cce7b'; btn.textContent = '\u2630'; } }
    });

    function insertBtn() {
        if (document.body) { document.body.appendChild(btn); }
        else { setTimeout(insertBtn, 10); }
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