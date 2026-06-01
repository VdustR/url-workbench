import { describe, expect, it } from "vitest";
import { serializeWithNative } from "../../src/domain/parsers/nativeUrlSearchParams";
import { serializeWithQs } from "../../src/domain/parsers/qsAdapter";
import {
  queryStringSupportsRows,
  serializeWithQueryString,
} from "../../src/domain/parsers/queryStringAdapter";
import { rowsToGroupedRecord } from "../../src/domain/search/searchSerializers";
import type { SearchRow } from "../../src/domain/url/types";
import { defaultSettings, sampleRows } from "../../src/test/fixtures";

describe("parser adapters", () => {
  it("serializes native spaces as plus", () => {
    const rows: SearchRow[] = [
      {
        id: "space",
        enabled: true,
        key: "space",
        value: "a b",
        valueKind: "value",
      },
    ];
    expect(serializeWithNative(rows)).toBe("space=a+b");
  });

  it("serializes qs repeat arrays in row order", () => {
    expect(
      serializeWithQs(sampleRows, {
        ...defaultSettings,
        mode: "qs",
        arrayStyle: "repeat",
      }),
    ).toBe("tag=ui&empty=&tag=url&preview");
  });

  it("serializes query-string repeat arrays in row order", () => {
    expect(
      serializeWithQueryString(sampleRows, {
        ...defaultSettings,
        mode: "query-string",
        arrayStyle: "repeat",
      }),
    ).toBe("tag=ui&empty=&tag=url&preview");
  });

  it("serializes query-string bracket-separator arrays", () => {
    expect(
      serializeWithQueryString(sampleRows, {
        ...defaultSettings,
        mode: "query-string",
        arrayStyle: "bracket-separator",
      }),
    ).toBe("tag[]=ui|url&empty=&preview");
  });

  it("flags nested bracket rows as unsupported by query-string", () => {
    expect(
      queryStringSupportsRows([
        {
          id: "nested",
          enabled: true,
          key: "filter[name]",
          value: "ada",
          valueKind: "value",
        },
      ]),
    ).toBe(false);
  });

  it("uses a prototype-free record for user-controlled keys", () => {
    const record = rowsToGroupedRecord([
      {
        id: "proto",
        enabled: true,
        key: "__proto__",
        value: "polluted",
        valueKind: "value",
      },
      {
        id: "to-string",
        enabled: true,
        key: "toString",
        value: "safe",
        valueKind: "value",
      },
    ]);

    expect(Object.getPrototypeOf(record)).toBe(null);
    expect(record["__proto__"]).toBe("polluted");
    expect(record["toString"]).toBe("safe");
  });
});
