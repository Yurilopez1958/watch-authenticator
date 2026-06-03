/**
 * Símbolos químicos de elementos relevantes para análisis XRF
 * de aleaciones usadas en relojería.
 */
export type ElementSymbol =
  | 'Fe' | 'Cr' | 'Ni' | 'Mo' | 'Mn' | 'Cu' | 'Si' | 'C' | 'S' | 'P' | 'N'
  | 'Au' | 'Ag' | 'Pt' | 'Pd' | 'Ru' | 'Rh' | 'Ir'
  | 'Ti' | 'Zn' | 'Sn' | 'Co' | 'Al' | 'W' | 'Nb';

export type MaterialKind =
  | 'steel'
  | 'gold'
  | 'platinum'
  | 'titanium'
  | 'ceramic'
  | 'other';

export type Brand = {
  id: string;
  name: string;
  country?: string;
  foundedYear?: number;
};

export type Model = {
  id: string;
  brandId: string;
  /** High-level collection (e.g. "Submariner", "Day-Date", "Lady-Datejust"). Used to group in UIs. */
  collection: string;
  /** "men" | "women" | "unisex" — based on case size and how Rolex markets the piece. */
  audience: 'men' | 'women' | 'unisex';
  name: string;
  reference: string;
  yearStart: number;
  yearEnd?: number;
  caliber?: string;
  caseDiameterMm?: number;
};

export type Material = {
  id: string;
  name: string;
  kind: MaterialKind;
  description?: string;
};

/** Especificación de un elemento dentro de una aleación de referencia. */
export type ElementSpec = {
  element: ElementSymbol;
  minPct: number;
  maxPct: number;
  /** Tolerancia absoluta extra (puntos %) más allá del rango antes de marcar fuera de rango. */
  toleranceAbs?: number;
  /** Si está fuera de rango más allá de tolerancia, descalifica automáticamente. */
  isCritical?: boolean;
};

/**
 * Perfil de referencia: composición esperada de un material en una marca/modelo/año.
 * Puede provenir de datos públicos o de mediciones propias verificadas.
 */
export type ReferenceProfile = {
  id: string;
  materialId: string;
  brandId: string;
  /** Si es null, aplica a toda la marca para los años dados. */
  modelId?: string;
  yearStart: number;
  yearEnd?: number;
  source: 'public' | 'measured';
  notes?: string;
  elements: ElementSpec[];
};

export type WatchPart =
  | 'case-back'
  | 'case-side'
  | 'lug'
  | 'bracelet-link'
  | 'clasp'
  | 'bezel'
  | 'crown'
  | 'movement'
  | 'hands'
  | 'logo'
  | 'dial'
  | 'serial-number';

export type ElementReading = {
  element: ElementSymbol;
  pct: number;
  /** ±error reportado por el instrumento, en puntos %. */
  errorPct?: number;
};

export type XRFMeasurement = {
  id: string;
  watchId?: string;
  partMeasured: WatchPart;
  measuredAt: string;
  instrument: 'niton-xl' | 'other';
  /** ID del disparo que devuelve el software del Niton. */
  serialReading?: string;
  readings: ElementReading[];
  notes?: string;
};

export type Watch = {
  id: string;
  brandId: string;
  modelId: string;
  serialNumber?: string;
  yearOfManufacture: number;
  /** Si es referencia, sus mediciones enriquecen la base. Si es authentication, queremos verificarlo. */
  purpose: 'authentication' | 'reference';
  notes?: string;
};

export type Photo = {
  id: string;
  watchId: string;
  part: WatchPart;
  storagePath: string;
  takenAt: string;
  notes?: string;
};

/** Distinctive features of an in-house Rolex caliber. */
export type Movement = {
  id: string;
  /** Caliber number engraved on the movement, e.g. "3235". */
  caliber: string;
  yearStart: number;
  yearEnd?: number;
  jewels: number;
  powerReserveHours: number;
  /** Vibrations per hour. 28800 = 4 Hz / 8 ticks per second. */
  vph: number;
  escapement: 'lever' | 'chronergy';
  /** COSC chronometer certified. All modern Rolex movements are. */
  cosc: boolean;
  /** Functional complications (date, day-date, GMT, chronograph, moon phase, etc.). */
  features: readonly (
    | 'date'
    | 'day'
    | 'gmt'
    | 'chronograph'
    | 'small-seconds'
    | 'moon-phase'
    | 'power-reserve'
    | 'world-time'
    | 'travel-time'
    | 'annual-calendar'
    | 'perpetual-calendar'
    | 'split-seconds'
    | 'minute-repeater'
    | 'flyback'
  )[];
  /** Plain-language identifying notes (e.g. red reversing wheels). */
  notes?: string;
};

export type MovementCheckStatus =
  | 'match'
  | 'mismatch'
  | 'not-provided'
  | 'unknown-model';

export type MovementCheck = {
  status: MovementCheckStatus;
  expectedCaliber?: string;
  observedCaliber?: string;
  /** Detailed reference of the expected movement, when available. */
  expected?: Movement;
  /** Human-readable explanation, in English. */
  note?: string;
};

/** Resultado de comparar una medición vs un perfil de referencia. */
export type ElementMatch = {
  element: ElementSymbol;
  measured: number;
  expectedMin: number;
  expectedMax: number;
  status: 'in-range' | 'borderline' | 'out-of-range';
  /** Desviación en puntos % respecto al borde más cercano del rango. 0 si en rango. */
  deviationPct: number;
  isCritical: boolean;
};

export type MatchVerdict = 'likely-authentic' | 'inconclusive' | 'likely-fake';

export type MatchResult = {
  profileId: string;
  materialName: string;
  /** Puntuación 0–100. >85 likely-authentic, 60–85 inconclusive, <60 likely-fake. */
  overallScore: number;
  verdict: MatchVerdict;
  elementMatches: ElementMatch[];
  /** Mensajes en español describiendo banderas notables del análisis. */
  flags: string[];
};
