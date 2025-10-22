/*
  Aladhan Provider for PrayerTimeWidget
  Provides helper functions to fetch daily timings from Aladhan API
  with support for method selection (e.g., 'karachi').
*/
(function (global) {
  'use strict';

  var root = global.PrayerTimeWidget = global.PrayerTimeWidget || {};
  root.providers = root.providers || {};

  var METHOD_MAP = {
    // Only including the requested one explicitly to avoid wrong mappings.
    // Users may also pass a numeric method ID directly.
    karachi: 2
  };

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function formatDDMMYYYY(d) {
    var dt = (d instanceof Date) ? d : (d ? new Date(d) : new Date());
    return pad(dt.getDate()) + '-' + pad(dt.getMonth() + 1) + '-' + dt.getFullYear();
  }

  function resolveMethod(method) {
    if (method == null) return undefined; // use Aladhan default
    if (typeof method === 'number') return method;
    var key = String(method).toLowerCase();
    return METHOD_MAP[key] != null ? METHOD_MAP[key] : undefined;
  }

  function toQuery(params) {
    var s = [];
    for (var k in params) if (params[k] != null) s.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
    return s.join('&');
  }

  function extractTimes(json) {
    if (!json || !json.data || !json.data.timings) throw new Error('Invalid Aladhan response');
    var t = json.data.timings;
    return {
      Fajr: t.Fajr,
      Dhuhr: t.Dhuhr,
      Asr: t.Asr,
      Maghrib: t.Maghrib,
      Isha: t.Isha
    };
  }

  async function fetchTimesByCoords(opts) {
    var method = resolveMethod(opts.method);
    var school = opts.school; // 0 (Shafi) | 1 (Hanafi)
    var dateStr = formatDDMMYYYY(opts.date);
    var params = {
      latitude: opts.latitude,
      longitude: opts.longitude,
      method: method,
      school: school,
      date: dateStr
    };
    var url = 'https://api.aladhan.com/v1/timings?' + toQuery(params);
    var res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('Aladhan request failed: ' + res.status);
    var json = await res.json();
    if (json.code !== 200) throw new Error('Aladhan error: ' + (json.status || json.code));
    return extractTimes(json);
  }

  async function fetchTimesByCity(opts) {
    var method = resolveMethod(opts.method);
    var school = opts.school; // 0 (Shafi) | 1 (Hanafi)
    var dateStr = formatDDMMYYYY(opts.date);
    var params = {
      city: opts.city,
      country: opts.country,
      state: opts.state,
      method: method,
      school: school,
      date: dateStr
    };
    var url = 'https://api.aladhan.com/v1/timingsByCity?' + toQuery(params);
    var res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('Aladhan request failed: ' + res.status);
    var json = await res.json();
    if (json.code !== 200) throw new Error('Aladhan error: ' + (json.status || json.code));
    return extractTimes(json);
  }

  root.providers.aladhan = {
    fetchTimesByCoords: fetchTimesByCoords,
    fetchTimesByCity: fetchTimesByCity,
    methods: METHOD_MAP
  };

})(typeof window !== 'undefined' ? window : this);
