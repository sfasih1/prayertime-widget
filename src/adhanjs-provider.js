/*
  Adhan.js (local) Provider for PrayerTimeWidget
  Computes prayer times in the browser using adhan-js (https://github.com/batoulapps/adhan-js)
  Requires that window.adhan is available (load from CDN before this file), e.g.
  <script src="https://cdn.jsdelivr.net/npm/adhan@4.4.2/dist/Adhan.js"></script>
*/
(function (global) {
  'use strict';
  var root = global.PrayerTimeWidget = global.PrayerTimeWidget || {};
  root.providers = root.providers || {};

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function toHHMM(date, tz) {
    if (!date) return '';
    if (tz) {
      try {
        var fmt = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz });
        var parts = fmt.formatToParts(date);
        var hh = parts.find(p => p.type === 'hour')?.value || '00';
        var mm = parts.find(p => p.type === 'minute')?.value || '00';
        return hh + ':' + mm;
      } catch (e) {
        // fallback to local
      }
    }
    return pad(date.getHours()) + ':' + pad(date.getMinutes());
  }

  function computeTimesByCoords(opts) {
    if (!global.adhan) throw new Error('PrayerTimeWidget.providers.adhanjs requires adhan-js. Include it before this script.');
    var adhan = global.adhan;
    var lat = opts.latitude, lon = opts.longitude;
    var date = opts.date ? new Date(opts.date) : new Date();
    var tz = opts.timezonestring || undefined;

    var params;
    if (opts.method === 'karachi' || opts.method === 2 || !opts.method) {
      params = adhan.CalculationMethod.Karachi();
    } else {
      // Default to Karachi and allow custom angles below
      params = adhan.CalculationMethod.Karachi();
    }

    // Ensure 18° angles for Fajr and Isha if requested (default Karachi uses 18/18)
    if (opts.fajrAngle != null) params.fajrAngle = Number(opts.fajrAngle);
    if (opts.ishaAngle != null) params.ishaAngle = Number(opts.ishaAngle);

    // Madhab (Asr): 0 Shafi, 1 Hanafi
    if (opts.school === 1) params.madhab = adhan.Madhab.Hanafi; else params.madhab = adhan.Madhab.Shafi;

    // Build objects
    var coords = new adhan.Coordinates(lat, lon);
    var times = new adhan.PrayerTimes(coords, date, params);

    return {
      Fajr: toHHMM(times.fajr, tz),
      Dhuhr: toHHMM(times.dhuhr, tz),
      Asr: toHHMM(times.asr, tz),
      Maghrib: toHHMM(times.maghrib, tz),
      Isha: toHHMM(times.isha, tz)
    };
  }

  root.providers.adhanjs = {
    computeTimesByCoords: computeTimesByCoords
  };
})(typeof window !== 'undefined' ? window : this);
