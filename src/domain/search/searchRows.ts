import type { SearchRow } from "../url/types";

export function createSearchRow(
  partial: Partial<Omit<SearchRow, "id">> & { id: string },
): SearchRow {
  return {
    enabled: true,
    key: "",
    value: "",
    valueKind: "value",
    ...partial,
  };
}

export function moveRow(rows: SearchRow[], rowId: string, toIndex: number): SearchRow[] {
  const fromIndex = rows.findIndex((row) => row.id === rowId);
  if (fromIndex === -1) return rows;

  const boundedIndex = Math.max(0, Math.min(toIndex, rows.length - 1));
  const next = rows.slice();
  const [row] = next.splice(fromIndex, 1);
  if (!row) return rows;
  next.splice(boundedIndex, 0, row);
  return next;
}

export function setRowEnabled(rows: SearchRow[], rowId: string, enabled: boolean): SearchRow[] {
  return rows.map((row) => (row.id === rowId ? { ...row, enabled } : row));
}

export function updateRow(
  rows: SearchRow[],
  rowId: string,
  patch: Partial<Omit<SearchRow, "id">>,
): SearchRow[] {
  return rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row));
}

export function deleteRow(rows: SearchRow[], rowId: string): SearchRow[] {
  return rows.filter((row) => row.id !== rowId);
}

export function duplicateRow(rows: SearchRow[], rowId: string, nextId: string): SearchRow[] {
  const index = rows.findIndex((row) => row.id === rowId);
  if (index === -1) return rows;
  const row = rows[index];
  if (!row) return rows;
  const next = rows.slice();
  next.splice(index + 1, 0, { ...row, id: nextId });
  return next;
}

export function serializeRowsPreservingOrder(rows: SearchRow[]): string {
  return rows
    .filter((row) => row.enabled)
    .map((row) => serializeRow(row))
    .join("&");
}

export function serializeRow(row: SearchRow): string {
  const key = encodeURIComponent(row.key);
  if (row.valueKind === "bare") return key;
  if (row.valueKind === "empty") return `${key}=`;
  return `${key}=${encodeURIComponent(row.value)}`;
}
