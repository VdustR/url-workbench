import { formEncode, strictEncodeURIComponent } from "../encoding/encodingLab";
import type { EncodingMode, SearchRow, SearchSettings } from "../url/types";

export type RowPrimitiveValue = string | null;

export function enabledRows(rows: SearchRow[]): SearchRow[] {
  return rows.filter((row) => row.enabled);
}

export function rowsToRepeatedEntries(rows: SearchRow[]): Array<[string, RowPrimitiveValue]> {
  return enabledRows(rows).map((row) => [row.key, row.valueKind === "bare" ? null : row.value]);
}

export function rowsToGroupedRecord(
  rows: SearchRow[],
): Record<string, RowPrimitiveValue | RowPrimitiveValue[]> {
  const record: Record<string, RowPrimitiveValue | RowPrimitiveValue[]> = {};

  for (const [key, value] of rowsToRepeatedEntries(rows)) {
    const current = record[key];
    if (current === undefined) {
      record[key] = value;
    } else if (Array.isArray(current)) {
      current.push(value);
    } else {
      record[key] = [current, value];
    }
  }

  return record;
}

export function rowsContainBracketNotation(rows: SearchRow[]): boolean {
  return rows.some((row) => /\[[^\]]*]/.test(row.key));
}

export function canSerializeRowsPreservingOrder(settings: SearchSettings): boolean {
  return (
    settings.sort === "preserveRows" &&
    (settings.arrayStyle === "repeat" || settings.arrayStyle === "none")
  );
}

export function serializeRowsInOrder(rows: SearchRow[], settings: SearchSettings): string {
  return enabledRows(rows)
    .map((row) => {
      const key = encodeRowPart(row.key, settings, "key");
      if (row.valueKind === "bare") return key;
      if (row.valueKind === "empty") return `${key}=`;
      return `${key}=${encodeRowPart(row.value, settings, "value")}`;
    })
    .join("&");
}

function encodeRowPart(value: string, settings: SearchSettings, part: "key" | "value"): string {
  if (settings.mode === "qs") {
    const advanced = settings.advanced.qs;
    if (!advanced.encode || (part === "key" && advanced.encodeValuesOnly)) return value;
    return encodeByMode(value, settings.encoding);
  }

  if (settings.mode === "query-string") {
    const advanced = settings.advanced.queryString;
    if (!advanced.encode) return value;
    return advanced.strict ? strictEncodeURIComponent(value) : encodeURIComponent(value);
  }

  return encodeURIComponent(value);
}

function encodeByMode(value: string, mode: EncodingMode): string {
  if (mode === "rfc1738" || mode === "form") return formEncode(value);
  if (mode === "rfc3986") return strictEncodeURIComponent(value);
  return encodeURIComponent(value);
}
