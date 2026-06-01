export type ParserMode = "native" | "qs" | "query-string";
export type ValueKind = "value" | "empty" | "bare";
export type SortMode = "preserveRows" | "libraryDefault" | "alpha";
export type EncodingMode = "native" | "rfc3986" | "rfc1738" | "form";

export interface SearchRow {
  id: string;
  enabled: boolean;
  key: string;
  value: string;
  valueKind: ValueKind;
  groupId?: string;
}

export interface QsAdvancedSettings {
  encode: boolean;
  encodeValuesOnly: boolean;
  allowDots: boolean;
  encodeDotInKeys: boolean;
  decodeDotInKeys: boolean;
  strictNullHandling: boolean;
  skipNulls: boolean;
  duplicates: "combine" | "first" | "last";
  commaRoundTrip: boolean;
  charset: "utf-8" | "iso-8859-1";
  charsetSentinel: boolean;
  interpretNumericEntities: boolean;
  depth: number;
  strictDepth: boolean;
  parameterLimit: number;
  arrayLimit: number;
  throwOnLimitExceeded: boolean;
  parseArrays: boolean;
  allowSparse: boolean;
}

export interface QueryStringAdvancedSettings {
  encode: boolean;
  decode: boolean;
  strict: boolean;
  skipNull: boolean;
  skipEmptyString: boolean;
  parseNumbers: boolean;
  parseBooleans: boolean;
  parseFragmentIdentifier: boolean;
  types: Record<string, "string" | "number" | "boolean" | "string[]" | "number[]">;
}

export interface SearchSettings {
  mode: ParserMode;
  arrayStyle:
    | "repeat"
    | "indices"
    | "brackets"
    | "comma"
    | "none"
    | "bracket"
    | "index"
    | "separator"
    | "bracket-separator"
    | "colon-list-separator";
  arrayFormatSeparator: string;
  encoding: EncodingMode;
  sort: SortMode;
  advanced: {
    qs: QsAdvancedSettings;
    queryString: QueryStringAdvancedSettings;
  };
}

export interface UrlParts {
  href: string;
  protocol: string;
  username: string;
  password: string;
  host: string;
  hostname: string;
  port: string;
  origin: string;
  pathname: string;
  search: string;
  hash: string;
}

export type ParsedUrlResult =
  | { ok: true; raw: string; url: URL; parts: UrlParts }
  | { ok: false; raw: string; error: string };
