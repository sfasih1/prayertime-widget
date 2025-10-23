export as namespace PrayerTimeWidget;

export interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface InitOptions {
  target: string | Element;
  city?: string;
  date?: Date | string;
  times: PrayerTimes;
  jamaatTimes?: Partial<PrayerTimes>;
  theme?: 'auto' | 'light' | 'dark';
  compact?: boolean;
}

export interface Instance {
  destroy: () => void;
}

export namespace providers {
  export namespace aladhan {
    export interface FetchByCoordsOptions {
      latitude: number;
      longitude: number;
      date?: Date | string;
      method?: number | 'karachi';
      school?: 0 | 1;
      tune?: string | number[];
      latitudeAdjustmentMethod?: 0 | 1 | 2; // none, mid, one-seventh
      midnightMode?: 'Standard' | 'Jafari';
      shafaq?: 'general' | 'ahmer' | 'abyad';
      timezonestring?: string; // e.g., 'America/New_York'
    }
    export interface FetchByCityOptions {
      city: string;
      country: string;
      state?: string;
      date?: Date | string;
      method?: number | 'karachi';
      school?: 0 | 1;
      tune?: string | number[];
      latitudeAdjustmentMethod?: 0 | 1 | 2;
      midnightMode?: 'Standard' | 'Jafari';
      shafaq?: 'general' | 'ahmer' | 'abyad';
      timezonestring?: string;
    }
    export function fetchTimesByCoords(opts: FetchByCoordsOptions): Promise<PrayerTimes>;
    export function fetchTimesByCity(opts: FetchByCityOptions): Promise<PrayerTimes>;
    export const methods: { karachi: number };
  }
  export namespace adhanjs {
    export interface ComputeByCoordsOptions {
      latitude: number;
      longitude: number;
      date?: Date | string;
      method?: number | 'karachi';
      school?: 0 | 1; // 0 Shafi, 1 Hanafi
      fajrAngle?: number; // explicitly set e.g., 18
      ishaAngle?: number; // explicitly set e.g., 18
      timezonestring?: string; // IANA zone, e.g., 'America/New_York'
    }
    export function computeTimesByCoords(opts: ComputeByCoordsOptions): PrayerTimes;
  }
}

export function init(options: InitOptions): Instance;
