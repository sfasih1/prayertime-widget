# PrayerTime Widget

A tiny, build-free web widget to display daily prayer times. Drop the script on any page and initialize with your times.

## Features
- No build step, no dependencies
- Auto/dark/light themes
- Highlights next upcoming prayer with a minute-by-minute countdown
- Compact mode option

## Quick start
1. Include the script

```html
<script src="./src/prayertime-widget.js"></script>
```

2. Add a container element

```html
<div id="my-widget"></div>
```

3. Initialize

```html
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
    theme: 'auto', // 'auto' | 'light' | 'dark'
    compact: false
  });
</script>
```

Open `demo/index.html` for a working example.

## Options
- target: CSS selector or DOM element where the widget renders (required)
- city: string label shown in header
- date: Date or date string; defaults to today
- times: object with keys Fajr, Dhuhr, Asr, Maghrib, Isha (required). Values can be "HH:MM" 24h or 12h with am/pm
- jamaatTimes: optional object with keys Fajr, Dhuhr, Asr, Maghrib, Isha. Values like times; displayed in the 3rd column
- theme: 'auto' uses system preference; 'light' or 'dark' to force
- compact: boolean for tighter spacing and smaller max width

## Styling
Default colors are black/white with a pink accent. You can override colors using CSS variables on `.ptw` or a parent element:

```css
.ptw { 
  --ptw-bg: #ffffff;  /* background */
  --ptw-fg: #000000;  /* text */
  --ptw-border: #000000; /* table borders */
  --ptw-accent: #ec4899; /* highlight for next prayer */
}
```

Layout is a semantic table with 3 columns: Prayer | Time | Jamaat.

## Roadmap
- Optional fetch from API (e.g., Aladhan) with latitude/longitude or city
- Localization of prayer names
- 24h/12h display toggle
- Accessibility enhancements

## License
MIT

## Using calculation methods (Aladhan)

You can fetch daily timings from the public Aladhan API and choose the calculation method, including University of Islamic Sciences, Karachi.

1) Include the provider script after the widget script:

```html
<script src="./src/prayertime-widget.js"></script>
<script src="./src/aladhan-provider.js"></script>
```

2) Fetch timings by city with the Karachi method and render:

```html
<script>
  (async () => {
    const times = await PrayerTimeWidget.providers.aladhan.fetchTimesByCity({
      city: 'Karachi',
      country: 'Pakistan',
      method: 'karachi', // University of Islamic Sciences, Karachi
      school: 1           // Hanafi (optional)
    });
    const jamaat = { Fajr: '05:30', Dhuhr: '01:30 pm', Asr: '04:45 pm', Maghrib: 'At Sunset', Isha: '08:00 pm' };
    PrayerTimeWidget.init({ target: '#my-widget', city: 'Karachi', times, jamaatTimes: jamaat, theme: 'auto' });
  })();
</script>
```

Alternatively, fetch by coordinates:

```html
<script>
  (async () => {
    const times = await PrayerTimeWidget.providers.aladhan.fetchTimesByCoords({
      latitude: 24.8607,
      longitude: 67.0011,
      method: 'karachi', // or numeric ID 2
      school: 1
    });
    PrayerTimeWidget.init({ target: '#my-widget', city: 'Karachi', times });
  })();
</script>
```

Notes:
- `method: 'karachi'` maps to Aladhan method ID 2.
- You may pass the numeric method ID directly (e.g., `method: 2`).
- `school` (0 Shafi, 1 Hanafi) affects Asr calculation.

## Nightly auto-refresh

To automatically refresh timings nightly (at local midnight + an offset), use `autoDaily` with a `getTimes` function. For example, Flower Hill, Maryland (USA) using Karachi method:

```html
<script src="./src/prayertime-widget.js"></script>
<script src="./src/aladhan-provider.js"></script>
<div id="widget-flower-hill"></div>
<script>
  PrayerTimeWidget.autoDaily({
    target: '#widget-flower-hill',
    city: 'Flower Hill, MD',
    theme: 'auto',
    refreshOffsetMinutes: 1, // run just after midnight
    getTimes: async () => {
      return await PrayerTimeWidget.providers.aladhan.fetchTimesByCity({
        city: 'Flower Hill',
        state: 'Maryland',
        country: 'United States',
        method: 'karachi',
        school: 1
      });
    }
  });
</script>
```

`autoDaily` returns `{ destroy() }` you can call to stop updates.

### Non-developers: update Jamaat times via JSON

Host a small JSON file on your site (same domain recommended) and point `jamaatUrl` at it. Example schema:

```json
{
  "city": "Flower Hill, MD",
  "lastUpdated": "2025-10-22",
  "jamaat": {
    "Fajr": "05:30",
    "Dhuhr": "01:30 pm",
    "Asr": "04:45 pm",
    "Maghrib": "At Sunset",
    "Isha": "08:00 pm"
  }
}
```

You may also use a flat object (without the `jamaat` wrapper):

```json
{
  "Fajr": "05:30",
  "Dhuhr": "01:30 pm",
  "Asr": "04:45 pm",
  "Maghrib": "At Sunset",
  "Isha": "08:00 pm"
}
```

Wire it up with `jamaatUrl` (works with `autoDaily`):

```html
<script>
  PrayerTimeWidget.autoDaily({
    target: '#widget-flower-hill',
    city: 'Flower Hill, MD',
    theme: 'auto',
    refreshOffsetMinutes: 1,
    jamaatUrl: '/path/to/jamaat-times.json',
    getTimes: async () => {
      return await PrayerTimeWidget.providers.aladhan.fetchTimesByCity({
        city: 'Flower Hill', state: 'Maryland', country: 'United States', method: 'karachi', school: 1
      });
    }
  });
</script>
```

Non-developers can update that JSON file (via a CMS, shared drive sync, or replacing the file) and the widget will pick it up after the next nightly refresh. To force an immediate refresh, just reload the page.
