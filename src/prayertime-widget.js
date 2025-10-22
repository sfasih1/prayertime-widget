 /*
  PrayerTimeWidget v0.1.0
  A tiny, build-free web widget to display daily prayer times.

  Usage:
  <script src="./src/prayertime-widget.js"></script>
  <div id="my-widget"></div>
  <script>
    PrayerTimeWidget.init({
      target: '#my-widget',
      city: 'Dubai',
      times: {
        Fajr: '05:12',
        Dhuhr: '12:08',
        Asr: '15:24',
        Maghrib: '18:01',
        Isha: '19:19'
      },
      theme: 'light' // or 'dark'
    });
  </script>
*/
(function (global, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else {
    global.PrayerTimeWidget = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var DEFAULTS = {
    target: null, // CSS selector or Element
    city: '',
    date: null, // Date or null for today
    times: null, // { Fajr, Dhuhr, Asr, Maghrib, Isha }
    jamaatTimes: null, // optional { Fajr, Dhuhr, Asr, Maghrib, Isha }
    theme: 'auto', // 'auto' | 'light' | 'dark'
    compact: false,
  };

  function merge(target) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i] || {};
      for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
    }
    return target;
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function to24h(t) {
    // Accepts '5:12', '05:12', '18:01', '6:01 pm', etc.; returns 'HH:MM'
    if (!t) return '';
    var s = String(t).trim().toLowerCase();
    var am = s.indexOf('am') !== -1;
    var pm = s.indexOf('pm') !== -1;
    s = s.replace(/\s*(am|pm)\s*/g, '');
    var parts = s.split(':');
    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1] || '0', 10);
    if (pm && h < 12) h += 12;
    if (am && h === 12) h = 0;
    return (h < 10 ? '0' + h : '' + h) + ':' + (m < 10 ? '0' + m : '' + m);
  }

  function minutesSinceMidnight(date) {
    var h = date.getHours();
    var m = date.getMinutes();
    return h * 60 + m;
  }

  function minutesFromHHMM(hhmm) {
    var parts = (hhmm || '00:00').split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function format12h(hhmm) {
    var mins = minutesFromHHMM(hhmm);
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    var suffix = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12 || 12;
    return h12 + ':' + (m < 10 ? '0' + m : m) + ' ' + suffix;
  }

  function resolveTheme(opt) {
    if (opt.theme === 'light' || opt.theme === 'dark') return opt.theme;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function normalizeTimes(times) {
    if (!times) return null;
    var keys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    var out = {};
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (times[k]) out[k] = to24h(times[k]);
    }
    return out;
  }

  function nextPrayer(nowMins, times) {
    // times is 24h map
    var order = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    var next = null;
    var nextName = null;
    for (var i = 0; i < order.length; i++) {
      var name = order[i];
      var t = minutesFromHHMM(times[name]);
      if (t > nowMins) {
        next = t; nextName = name; break;
      }
    }
    if (next == null) { // wrap to tomorrow's Fajr
      next = minutesFromHHMM(times['Fajr']) + 24 * 60;
      nextName = 'Fajr';
    }
    return { name: nextName, minutes: next };
  }

  function countdown(now, targetMins) {
    var nowMins = minutesSinceMidnight(now);
    var diff = targetMins - nowMins;
    if (diff < 0) diff += 24 * 60;
    var h = Math.floor(diff / 60);
    var m = diff % 60;
    return { h: h, m: m };
  }

  function render(container, opt) {
    var theme = resolveTheme(opt);
    container.className = 'ptw ' + (opt.compact ? 'ptw--compact ' : '') + 'ptw--' + theme;

    // Header
    var header = el('div', 'ptw__header');
    var city = el('div', 'ptw__city', opt.city ? String(opt.city) : '');
    var date = el('div', 'ptw__date', (opt.date || new Date()).toDateString());
    header.appendChild(city);
    header.appendChild(date);

    // Times table (3 columns: Prayer | Time | Jamaat)
    var keys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    var now = new Date();
    var nowMins = minutesSinceMidnight(now);
    var next = nextPrayer(nowMins, opt.times);

    var tableWrap = el('div', 'ptw__table-wrap');
    var table = el('table', 'ptw__table');
    var thead = el('thead');
    var htr = el('tr');
    htr.appendChild(el('th', 'ptw__th', 'Prayer'));
    htr.appendChild(el('th', 'ptw__th', 'Time'));
    htr.appendChild(el('th', 'ptw__th', 'Jamaat'));
    thead.appendChild(htr);
    var tbody = el('tbody');

    for (var i = 0; i < keys.length; i++) {
      var name = keys[i];
      var tr = el('tr', 'ptw__tr');
      if (name === next.name) tr.classList.add('ptw__row--next');
      var tdName = el('td', 'ptw__td ptw__name', name);
      var tdTime = el('td', 'ptw__td ptw__time', format12h(opt.times[name]));
      var jamaat = (opt.jamaatTimes && opt.jamaatTimes[name]) ? format12h(opt.jamaatTimes[name]) : '—';
      var tdJamaat = el('td', 'ptw__td ptw__jamaat', jamaat);
      tr.appendChild(tdName);
      tr.appendChild(tdTime);
      tr.appendChild(tdJamaat);
      tbody.appendChild(tr);
    }
    table.appendChild(thead);
    table.appendChild(tbody);
    tableWrap.appendChild(table);

    // Footer - countdown
    var target = next.minutes;
    var cd = countdown(now, target);
    var cde = el('div', 'ptw__countdown', 'Next ' + next.name + ' in ' + cd.h + 'h ' + (cd.m < 10 ? '0' : '') + cd.m + 'm');

    // Clear and attach
    container.innerHTML = '';
    container.appendChild(header);
    container.appendChild(tableWrap);
    container.appendChild(cde);
  }

  function injectStyles() {
    if (document.getElementById('ptw-styles')) return;
    var style = el('style');
    style.id = 'ptw-styles';
    style.textContent = "\n/* Core wrapper: black/white base with pink accent */\n.ptw{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,\"Noto Sans\",\"Helvetica Neue\",Arial,\"Apple Color Emoji\",\"Segoe UI Emoji\";\n  --ptw-bg:#ffffff;--ptw-fg:#000000;--ptw-border:#000000;--ptw-accent:#ec4899;\n  background:var(--ptw-bg);color:var(--ptw-fg);border:1px solid var(--ptw-border);border-radius:12px;padding:12px;max-width:420px;}\n.ptw--dark{--ptw-bg:#0b1220;--ptw-fg:#e5e7eb;--ptw-border:#1f2937;--ptw-accent:#f472b6;}\n.ptw--compact{padding:8px;border-radius:10px;max-width:360px;}\n.ptw__header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;}\n.ptw__city{font-weight:700;}\n.ptw__date{font-size:12px;opacity:.8;}\n/* Table layout */\n.ptw__table-wrap{overflow-x:auto;}\n.ptw__table{width:100%;border-collapse:collapse;}\n.ptw__th,.ptw__td{border:1px solid var(--ptw-border);padding:8px 10px;text-align:left;}\n.ptw__th{background:var(--ptw-bg);color:var(--ptw-fg);font-weight:700;}\n.ptw__time,.ptw__jamaat{font-weight:600;}\n.ptw__row--next td{color:var(--ptw-accent);}\n.ptw__row--next .ptw__name{font-weight:700;}\n.ptw__countdown{margin-top:12px;font-size:12px;opacity:.9;}\n";
    document.head.appendChild(style);
  }

  function resolveTarget(target) {
    if (!target) return null;
    if (typeof target === 'string') return document.querySelector(target);
    if (target instanceof Element) return target;
    return null;
  }

  function init(options) {
    var opt = merge({}, DEFAULTS, options || {});
    injectStyles();

    var container = resolveTarget(opt.target);
    if (!container) throw new Error('PrayerTimeWidget: target not found');

    opt.date = opt.date ? new Date(opt.date) : new Date();
    opt.times = normalizeTimes(opt.times);
    if (!opt.times) throw new Error('PrayerTimeWidget: times are required');
    if (opt.jamaatTimes) opt.jamaatTimes = normalizeTimes(opt.jamaatTimes);

    render(container, opt);

    // Optional ticking countdown update each minute
    var interval = setInterval(function () {
      try { render(container, opt); } catch (e) { clearInterval(interval); }
    }, 60 * 1000);

    return { destroy: function () { clearInterval(interval); container.innerHTML = ''; } };
  }

  // Auto daily refresher
  function msUntilNextRefresh(offsetMinutes) {
    var now = new Date();
    var tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    var ms = tomorrow.getTime() - now.getTime();
    if (offsetMinutes && offsetMinutes > 0) ms += offsetMinutes * 60 * 1000; // e.g., run at 00:01
    return ms;
  }

  function autoDaily(opts) {
    // opts: { target, city, theme?, compact?, getTimes: () => Promise<times>, getJamaatTimes?: () => Promise<times>|null, jamaatUrl?: string, refreshOffsetMinutes?: number }
    if (!opts || !opts.target || !opts.getTimes) throw new Error('PrayerTimeWidget.autoDaily: target and getTimes are required');
    var destroyed = false;
    var timer = null;
    var instance = null;
    var refreshOffset = opts.refreshOffsetMinutes == null ? 1 : opts.refreshOffsetMinutes; // default 1 minute past midnight

    async function fetchJamaatIfAny() {
      try {
        if (typeof opts.getJamaatTimes === 'function') {
          return await opts.getJamaatTimes();
        }
        if (opts.jamaatUrl) {
          var res = await fetch(opts.jamaatUrl, { headers: { 'Accept': 'application/json' } });
          if (!res.ok) throw new Error('Failed to fetch jamaat JSON: ' + res.status);
          var json = await res.json();
          // Allow either direct map {Fajr:..} or nested { jamaat: {..} } or { times: {..} }
          var data = (json && (json.jamaat || json.times || json)) || null;
          return data;
        }
      } catch (e) {
        console.warn('PrayerTimeWidget.autoDaily: jamaat fetch failed', e);
      }
      return null;
    }

    function scheduleNext() {
      if (destroyed) return;
      clearTimeout(timer);
      timer = setTimeout(async function () {
        if (destroyed) return;
        try {
          var results = await Promise.all([opts.getTimes(), fetchJamaatIfAny()]);
          var times = results[0];
          var j = results[1];
          if (instance && instance.destroy) instance.destroy();
          instance = init({ target: opts.target, city: opts.city, times: times, jamaatTimes: j || undefined, theme: opts.theme, compact: opts.compact });
        } catch (e) {
          // simple retry after 5 minutes on failure
          clearTimeout(timer);
          timer = setTimeout(scheduleNext, 5 * 60 * 1000);
          return;
        }
        scheduleNext();
      }, msUntilNextRefresh(refreshOffset));
    }

    (async function bootstrap() {
      try {
        var results = await Promise.all([opts.getTimes(), fetchJamaatIfAny()]);
        var times = results[0];
        var j = results[1];
        instance = init({ target: opts.target, city: opts.city, times: times, jamaatTimes: j || undefined, theme: opts.theme, compact: opts.compact });
      } catch (e) {
        console.error('PrayerTimeWidget.autoDaily initial fetch failed', e);
      }
      scheduleNext();
    })();

    return {
      destroy: function () {
        destroyed = true;
        clearTimeout(timer);
        if (instance && instance.destroy) instance.destroy();
      }
    };
  }

  return { init: init, autoDaily: autoDaily };
});
