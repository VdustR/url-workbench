import type { SearchRow } from "../url/types";

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
