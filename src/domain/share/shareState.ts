import * as qs from "qs";
import type { SearchRow, SearchSettings } from "../url/types";

export interface DecodedShareState {
  url: string;
  rows: SearchRow[];
  settings: SearchSettings;
}

const shareStateOptions = {
  arrayFormat: "indices" as const,
  encode: true,
  strictNullHandling: true,
};

export function encodeShareUrl(
  targetUrl: string,
  rows: SearchRow[],
  settings: SearchSettings,
  origin = "https://vdustr.github.io/url-workbench/",
): string {
  const url = new URL(origin);
  url.searchParams.set("url", targetUrl);
  url.searchParams.set(
    "state",
    qs.stringify(
      {
        rows: JSON.stringify(rows),
        settings: JSON.stringify(settings),
      },
      shareStateOptions,
    ),
  );
  return url.href;
}

export function decodeShareUrl(shareUrl: string): DecodedShareState {
  const url = new URL(shareUrl);
  const targetUrl = url.searchParams.get("url") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const parsed = qs.parse(state, { ignoreQueryPrefix: true });
  return {
    url: targetUrl,
    rows: parseJsonField<SearchRow[]>(parsed.rows, []),
    settings: parseJsonField<SearchSettings>(
      parsed.settings,
      undefined as unknown as SearchSettings,
    ),
  };
}

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
