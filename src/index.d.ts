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
    }
    export interface FetchByCityOptions {
      city: string;
      country: string;
      state?: string;
      date?: Date | string;
      method?: number | 'karachi';
      school?: 0 | 1;
    }
    export function fetchTimesByCoords(opts: FetchByCoordsOptions): Promise<PrayerTimes>;
    export function fetchTimesByCity(opts: FetchByCityOptions): Promise<PrayerTimes>;
    export const methods: { karachi: number };
  }
}

export function init(options: InitOptions): Instance;
