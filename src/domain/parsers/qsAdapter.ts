import * as qs from "qs";
import { rowsToGroupedRecord } from "../search/searchSerializers";
import type { SearchRow, SearchSettings } from "../url/types";

type QsArrayFormat = "indices" | "brackets" | "repeat" | "comma";

export function serializeWithQs(rows: SearchRow[], settings: SearchSettings): string {
  const advanced = settings.advanced.qs;
  const options: qs.IStringifyOptions = {
    addQueryPrefix: false,
    arrayFormat: toQsArrayFormat(settings.arrayStyle),
    charset: advanced.charset,
    charsetSentinel: advanced.charsetSentinel,
    commaRoundTrip: advanced.commaRoundTrip,
    encode: advanced.encode,
    encodeValuesOnly: advanced.encodeValuesOnly,
    format: settings.encoding === "rfc1738" || settings.encoding === "form" ? "RFC1738" : "RFC3986",
    skipNulls: advanced.skipNulls,
    sort: settings.sort === "alpha" ? (a: string, b: string) => a.localeCompare(b) : undefined,
    strictNullHandling: advanced.strictNullHandling,
  };

  if (advanced.encodeDotInKeys) {
    Object.assign(options, { allowDots: true, encodeDotInKeys: true });
  } else {
    options.allowDots = advanced.allowDots;
  }

  return qs.stringify(rowsToGroupedRecord(rows), options);
}

export function parseWithQs(query: string, settings: SearchSettings): unknown {
  const advanced = settings.advanced.qs;
  const options: qs.IParseOptions = {
    allowSparse: advanced.allowSparse,
    arrayLimit: advanced.arrayLimit,
    charset: advanced.charset,
    charsetSentinel: advanced.charsetSentinel,
    comma: settings.arrayStyle === "comma",
    depth: advanced.depth,
    duplicates: advanced.duplicates,
    ignoreQueryPrefix: true,
    interpretNumericEntities: advanced.interpretNumericEntities,
    parameterLimit: advanced.parameterLimit,
    parseArrays: advanced.parseArrays,
    strictDepth: advanced.strictDepth,
    strictNullHandling: advanced.strictNullHandling,
    throwOnLimitExceeded: advanced.throwOnLimitExceeded,
  };

  if (advanced.decodeDotInKeys) {
    Object.assign(options, { allowDots: true, decodeDotInKeys: true });
  } else {
    options.allowDots = advanced.allowDots;
  }

  return qs.parse(query, options);
}

function toQsArrayFormat(arrayStyle: SearchSettings["arrayStyle"]): QsArrayFormat {
  if (arrayStyle === "brackets" || arrayStyle === "bracket") return "brackets";
  if (arrayStyle === "indices" || arrayStyle === "index") return "indices";
  if (arrayStyle === "comma") return "comma";
  return "repeat";
}
