import queryString from "query-string";
import {
  canSerializeRowsPreservingOrder,
  rowsContainBracketNotation,
  rowsToGroupedRecord,
  serializeRowsInOrder,
} from "../search/searchSerializers";
import type { SearchRow, SearchSettings } from "../url/types";

type QueryStringArrayFormat =
  | "none"
  | "bracket"
  | "index"
  | "comma"
  | "separator"
  | "bracket-separator"
  | "colon-list-separator";

export function serializeWithQueryString(rows: SearchRow[], settings: SearchSettings): string {
  if (canSerializeRowsPreservingOrder(settings)) {
    return serializeRowsInOrder(rows, settings);
  }

  const advanced = settings.advanced.queryString;
  return queryString.stringify(rowsToGroupedRecord(rows), {
    arrayFormat: toQueryStringArrayFormat(settings.arrayStyle),
    arrayFormatSeparator: settings.arrayFormatSeparator,
    encode: advanced.encode,
    skipEmptyString: advanced.skipEmptyString,
    skipNull: advanced.skipNull,
    sort:
      settings.sort === "preserveRows"
        ? false
        : settings.sort === "alpha"
          ? (a: string, b: string) => a.localeCompare(b)
          : undefined,
    strict: advanced.strict,
  });
}

export function parseWithQueryString(
  query: string,
  settings: SearchSettings,
): Record<string, unknown> {
  const advanced = settings.advanced.queryString;
  return queryString.parse(query, {
    arrayFormat: toQueryStringArrayFormat(settings.arrayStyle),
    arrayFormatSeparator: settings.arrayFormatSeparator,
    decode: advanced.decode,
    parseBooleans: advanced.parseBooleans,
    parseFragmentIdentifier: advanced.parseFragmentIdentifier,
    parseNumbers: advanced.parseNumbers,
    sort: settings.sort === "preserveRows" ? false : undefined,
    types: advanced.types,
  });
}

export function queryStringSupportsRows(rows: SearchRow[]): boolean {
  return !rowsContainBracketNotation(rows);
}

function toQueryStringArrayFormat(
  arrayStyle: SearchSettings["arrayStyle"],
): QueryStringArrayFormat {
  if (arrayStyle === "brackets") return "bracket";
  if (arrayStyle === "indices") return "index";
  if (arrayStyle === "repeat") return "none";
  if (arrayStyle === "bracket") return "bracket";
  if (arrayStyle === "index") return "index";
  if (arrayStyle === "comma") return "comma";
  if (arrayStyle === "separator") return "separator";
  if (arrayStyle === "bracket-separator") return "bracket-separator";
  if (arrayStyle === "colon-list-separator") return "colon-list-separator";
  return "none";
}
