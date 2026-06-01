import { atom, computed } from "nanostores";
import { compareEncodings } from "../domain/encoding/encodingLab";
import { parseWithQs } from "../domain/parsers/qsAdapter";
import { serializeWithNative } from "../domain/parsers/nativeUrlSearchParams";
import {
  parseWithQueryString,
  serializeWithQueryString,
} from "../domain/parsers/queryStringAdapter";
import { serializeWithQs } from "../domain/parsers/qsAdapter";
import { decodeShareUrl, encodeShareUrl } from "../domain/share/shareState";
import {
  createSearchRow,
  deleteRow,
  duplicateRow,
  moveRow,
  setRowEnabled,
  updateRow,
} from "../domain/search/searchRows";
import { editUrlPart, parseUrlInput } from "../domain/url/urlAnatomy";
import { defaultSettings, sampleRows, urlFixtures } from "../domain/url/defaults";
import type {
  EncodingMode,
  QsAdvancedSettings,
  QueryStringAdvancedSettings,
  SearchRow,
  SearchSettings,
  UrlParts,
} from "../domain/url/types";
import { getWarnings } from "../domain/warnings/warnings";

interface WorkbenchState {
  url: string;
  rows: SearchRow[];
  settings: SearchSettings;
}

export interface ParserPreview {
  serialized: string;
  parsed: unknown;
}

const fallbackUrl = urlFixtures.complex;
let rowCounter = 0;

const initialState = readInitialState();

export const $urlInput = atom(initialState.url);
export const $rows = atom(initialState.rows);
export const $settings = atom(initialState.settings);
export const $encodingSample = atom("a b/?:&=+%#[]!'()*🌕");

export const $parsedUrl = computed($urlInput, (urlInput) => parseUrlInput(urlInput));
export const $serializedSearch = computed([$rows, $settings], (rows, settings) =>
  serializeRows(rows, settings),
);
export const $previewUrl = computed(
  [$urlInput, $serializedSearch],
  (urlInput, serializedSearch) => replaceSearch(urlInput, serializedSearch) ?? urlInput,
);
export const $parserPreview = computed([$rows, $settings], (rows, settings): ParserPreview => {
  const serialized = serializeRows(rows, settings);
  return {
    serialized,
    parsed: parseSerializedSearch(serialized, settings),
  };
});
export const $warnings = computed([$parsedUrl, $rows, $settings], (parsed, rows, settings) =>
  getWarnings({ parts: parsed.ok ? parsed.parts : undefined, rows, settings }),
);
export const $encodingComparison = computed($encodingSample, (value) => compareEncodings(value));

$previewUrl.listen(syncLocation);
$rows.listen(syncShareState);
$settings.listen(syncShareState);

export function setUrlInput(nextUrl: string): void {
  $urlInput.set(nextUrl);
  const parsed = parseUrlInput(nextUrl);
  if (parsed.ok) {
    $rows.set(rowsFromSearch(parsed.parts.search));
  }
  syncShareState();
}

export function setUrlPart(
  part: keyof Pick<
    UrlParts,
    "protocol" | "username" | "password" | "hostname" | "port" | "pathname" | "search" | "hash"
  >,
  value: string,
): void {
  const normalizedValue = part === "search" ? normalizeSearchInput(value) : value;
  const result = editUrlPart($urlInput.get(), { [part]: normalizedValue });
  if (!result.ok) return;
  $urlInput.set(result.raw);
  if (part === "search") {
    $rows.set(rowsFromSearch(result.parts.search));
  }
  syncShareState();
}

export function addRow(): void {
  commitRows([
    ...$rows.get(),
    createSearchRow({
      id: nextRowId(),
      key: "name",
      value: "value",
    }),
  ]);
}

export function setRow(rowId: string, patch: Partial<Omit<SearchRow, "id">>): void {
  commitRows(updateRow($rows.get(), rowId, patch));
}

export function toggleRow(rowId: string, enabled: boolean): void {
  commitRows(setRowEnabled($rows.get(), rowId, enabled));
}

export function removeRow(rowId: string): void {
  commitRows(deleteRow($rows.get(), rowId));
}

export function copyRow(rowId: string): void {
  commitRows(duplicateRow($rows.get(), rowId, nextRowId()));
}

export function reorderRow(activeId: string, overId: string): void {
  const rows = $rows.get();
  const toIndex = rows.findIndex((row) => row.id === overId);
  if (toIndex === -1) return;
  commitRows(moveRow(rows, activeId, toIndex));
}

export function moveRowByStep(rowId: string, step: number): void {
  const rows = $rows.get();
  const index = rows.findIndex((row) => row.id === rowId);
  if (index === -1) return;
  commitRows(moveRow(rows, rowId, index + step));
}

export function setSearchSettings(patch: Partial<SearchSettings>): void {
  const next = { ...$settings.get(), ...patch };
  commitSettings(next);
}

export function setQsSetting<Key extends keyof QsAdvancedSettings>(
  key: Key,
  value: QsAdvancedSettings[Key],
): void {
  const current = $settings.get();
  commitSettings({
    ...current,
    advanced: {
      ...current.advanced,
      qs: {
        ...current.advanced.qs,
        [key]: value,
      },
    },
  });
}

export function setQueryStringSetting<Key extends keyof QueryStringAdvancedSettings>(
  key: Key,
  value: QueryStringAdvancedSettings[Key],
): void {
  const current = $settings.get();
  commitSettings({
    ...current,
    advanced: {
      ...current.advanced,
      queryString: {
        ...current.advanced.queryString,
        [key]: value,
      },
    },
  });
}

export function setEncodingMode(value: EncodingMode): void {
  setSearchSettings({ encoding: value });
}

export function setEncodingSample(value: string): void {
  $encodingSample.set(value);
}

export function currentShareUrl(): string {
  const origin =
    typeof window === "undefined" ? undefined : window.location.origin + window.location.pathname;
  return encodeShareUrl($previewUrl.get(), $rows.get(), $settings.get(), origin);
}

function commitRows(rows: SearchRow[]): void {
  const settings = $settings.get();
  $rows.set(rows);
  const nextUrl = replaceSearch($urlInput.get(), serializeRows(rows, settings));
  if (nextUrl) {
    $urlInput.set(nextUrl);
  }
  syncShareState();
}

function commitSettings(settings: SearchSettings): void {
  $settings.set(settings);
  const nextUrl = replaceSearch($urlInput.get(), serializeRows($rows.get(), settings));
  if (nextUrl) {
    $urlInput.set(nextUrl);
  }
  syncShareState();
}

function serializeRows(rows: SearchRow[], settings: SearchSettings): string {
  if (settings.mode === "native") return serializeWithNative(rows);
  if (settings.mode === "query-string") return serializeWithQueryString(rows, settings);
  return serializeWithQs(rows, settings);
}

function parseSerializedSearch(serialized: string, settings: SearchSettings): unknown {
  if (settings.mode === "qs") return parseWithQs(serialized, settings);
  if (settings.mode === "query-string") return parseWithQueryString(serialized, settings);
  return Object.fromEntries(new URLSearchParams(serialized).entries());
}

function readInitialState(): WorkbenchState {
  const fallback: WorkbenchState = {
    url: fallbackUrl,
    rows: cloneRows(sampleRows),
    settings: cloneSettings(defaultSettings),
  };

  if (typeof window === "undefined") return fallback;

  try {
    const params = new URLSearchParams(window.location.search);
    const shareState = params.get("state");
    if (shareState) {
      const decoded = decodeShareUrl(window.location.href);
      const decodedSettings = mergeSettings(defaultSettings, decoded.settings);
      return {
        url: decoded.url || fallback.url,
        rows: decoded.rows.length > 0 ? decoded.rows : rowsFromUrl(decoded.url || fallback.url),
        settings: decodedSettings,
      };
    }

    const targetUrl = params.get("url");
    if (targetUrl) {
      return {
        url: targetUrl,
        rows: rowsFromUrl(targetUrl),
        settings: fallback.settings,
      };
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function syncLocation(url: string): void {
  if (typeof window === "undefined") return;
  const current = new URL(window.location.href);
  current.searchParams.set("url", url);
  window.history.replaceState({}, "", current.href);
}

function syncShareState(): void {
  if (typeof window === "undefined") return;
  const current = new URL(window.location.href);
  const share = new URL(currentShareUrl());
  const state = share.searchParams.get("state");
  current.searchParams.set("url", $previewUrl.get());
  if (state) {
    current.searchParams.set("state", state);
  }
  window.history.replaceState({}, "", current.href);
}

function rowsFromUrl(url: string): SearchRow[] {
  const parsed = parseUrlInput(url);
  if (!parsed.ok) return cloneRows(sampleRows);
  return rowsFromSearch(parsed.parts.search);
}

function rowsFromSearch(search: string): SearchRow[] {
  const query = search.startsWith("?") ? search.slice(1) : search;
  if (!query) return [];

  return query.split("&").map((segment) => {
    const equalIndex = segment.indexOf("=");
    const rawKey = equalIndex === -1 ? segment : segment.slice(0, equalIndex);
    const rawValue = equalIndex === -1 ? "" : segment.slice(equalIndex + 1);
    return createSearchRow({
      id: nextRowId(),
      key: decodeQueryComponent(rawKey),
      value: decodeQueryComponent(rawValue),
      valueKind: equalIndex === -1 ? "bare" : rawValue === "" ? "empty" : "value",
    });
  });
}

function replaceSearch(urlInput: string, serializedSearch: string): string | undefined {
  const parsed = parseUrlInput(urlInput);
  if (!parsed.ok) return undefined;
  const next = new URL(parsed.url.href);
  next.search = serializedSearch;
  return next.href;
}

function normalizeSearchInput(value: string): string {
  if (value === "") return "";
  return value.startsWith("?") ? value : `?${value}`;
}

function decodeQueryComponent(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

function nextRowId(): string {
  rowCounter += 1;
  return `row-${Date.now().toString(36)}-${rowCounter}`;
}

function cloneRows(rows: SearchRow[]): SearchRow[] {
  return rows.map((row) => ({ ...row }));
}

function cloneSettings(settings: SearchSettings): SearchSettings {
  return {
    ...settings,
    advanced: {
      qs: { ...settings.advanced.qs },
      queryString: {
        ...settings.advanced.queryString,
        types: { ...settings.advanced.queryString.types },
      },
    },
  };
}

function mergeSettings(base: SearchSettings, value: SearchSettings | undefined): SearchSettings {
  if (!value) return cloneSettings(base);
  return {
    ...base,
    ...value,
    advanced: {
      qs: {
        ...base.advanced.qs,
        ...value.advanced?.qs,
      },
      queryString: {
        ...base.advanced.queryString,
        ...value.advanced?.queryString,
        types: {
          ...base.advanced.queryString.types,
          ...value.advanced?.queryString?.types,
        },
      },
    },
  };
}
