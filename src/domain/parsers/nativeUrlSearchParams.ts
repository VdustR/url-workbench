import { rowsToRepeatedEntries } from "../search/searchSerializers";
import type { SearchRow } from "../url/types";

export function serializeWithNative(rows: SearchRow[]): string {
  const params = new URLSearchParams();
  for (const [key, value] of rowsToRepeatedEntries(rows)) {
    params.append(key, value ?? "");
  }
  return params.toString();
}
