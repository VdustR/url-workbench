import type { SearchRow, SearchSettings } from "./types";

export const sampleRows: SearchRow[] = [
  {
    id: "row-tag-ui",
    enabled: true,
    key: "tag",
    value: "ui",
    valueKind: "value",
  },
  {
    id: "row-empty",
    enabled: true,
    key: "empty",
    value: "",
    valueKind: "empty",
  },
  {
    id: "row-tag-url",
    enabled: true,
    key: "tag",
    value: "url",
    valueKind: "value",
  },
  {
    id: "row-preview",
    enabled: true,
    key: "preview",
    value: "",
    valueKind: "bare",
  },
  {
    id: "row-debug",
    enabled: false,
    key: "debug",
    value: "true",
    valueKind: "value",
  },
];

export const defaultSettings: SearchSettings = {
  mode: "qs",
  arrayStyle: "repeat",
  arrayFormatSeparator: "|",
  encoding: "rfc3986",
  sort: "preserveRows",
  advanced: {
    qs: {
      encode: true,
      encodeValuesOnly: false,
      allowDots: false,
      encodeDotInKeys: false,
      decodeDotInKeys: false,
      strictNullHandling: true,
      skipNulls: false,
      duplicates: "combine",
      commaRoundTrip: false,
      charset: "utf-8",
      charsetSentinel: false,
      interpretNumericEntities: false,
      depth: 5,
      strictDepth: false,
      parameterLimit: 1000,
      arrayLimit: 20,
      throwOnLimitExceeded: false,
      parseArrays: true,
      allowSparse: false,
    },
    queryString: {
      encode: true,
      decode: true,
      strict: true,
      skipNull: false,
      skipEmptyString: false,
      parseNumbers: false,
      parseBooleans: false,
      parseFragmentIdentifier: false,
      types: {},
    },
  },
};

export const urlFixtures = {
  complex: "https://user:pass@docs.example.com:8443/a/b?tag=ui&tag=url&empty=&preview#notes",
  ipv6: "https://[2001:db8::1]:8443/path?tag=ipv6",
  unicodeHost: "https://mañana.example/path?emoji=%F0%9F%8C%95",
  encoded: "https://example.com/path?space=a+b&encoded=%252F",
};
