import { describe, expect, it } from "vitest";
import {
  deleteRow,
  duplicateRow,
  moveRow,
  serializeRowsPreservingOrder,
  setRowEnabled,
} from "../../src/domain/search/searchRows";
import { sampleRows } from "../../src/test/fixtures";

describe("search row operations", () => {
  it("moves rows by id", () => {
    const rows = moveRow(sampleRows, "row-empty", 0);
    expect(rows.map((row) => row.id)).toEqual([
      "row-empty",
      "row-tag-ui",
      "row-tag-url",
      "row-preview",
      "row-debug",
    ]);
  });

  it("toggles enabled state without deleting row", () => {
    const rows = setRowEnabled(sampleRows, "row-debug", true);
    expect(rows.find((row) => row.id === "row-debug")?.enabled).toBe(true);
    expect(rows).toHaveLength(sampleRows.length);
  });

  it("duplicates a row next to the original row", () => {
    const rows = duplicateRow(sampleRows, "row-tag-ui", "row-tag-ui-copy");
    expect(rows.map((row) => row.id).slice(0, 2)).toEqual(["row-tag-ui", "row-tag-ui-copy"]);
  });

  it("deletes a row without touching other rows", () => {
    const rows = deleteRow(sampleRows, "row-debug");
    expect(rows.some((row) => row.id === "row-debug")).toBe(false);
    expect(rows).toHaveLength(sampleRows.length - 1);
  });

  it("serializes enabled rows in row order", () => {
    expect(serializeRowsPreservingOrder(sampleRows)).toBe("tag=ui&empty=&tag=url&preview");
  });
});
