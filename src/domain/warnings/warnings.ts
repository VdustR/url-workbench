import type { SearchRow, SearchSettings, UrlParts } from "../url/types";

export interface WorkbenchWarning {
  id: string;
  severity: "info" | "warning" | "danger";
  message: string;
  rowId?: string;
}

export interface WarningInput {
  parts?: UrlParts;
  rows: SearchRow[];
  settings: SearchSettings;
}

const tokenKeyPattern = /(token|secret|password|passwd|access[_-]?key|api[_-]?key)/i;

export function getWarnings(input: WarningInput): WorkbenchWarning[] {
  const warnings: WorkbenchWarning[] = [];

  if (input.parts?.username || input.parts?.password) {
    warnings.push({
      id: "url-userinfo",
      severity: "danger",
      message: "The URL contains userinfo. Credentials or tokens may be exposed.",
    });
  }

  for (const row of input.rows) {
    if (!row.enabled) {
      warnings.push({
        id: `row-disabled-${row.id}`,
        severity: "info",
        message: `"${row.key}" is disabled and omitted from output.`,
        rowId: row.id,
      });
    }

    if (row.key === "") {
      warnings.push({
        id: `row-empty-key-${row.id}`,
        severity: "warning",
        message: "A search parameter has an empty key.",
        rowId: row.id,
      });
    }

    if (tokenKeyPattern.test(row.key)) {
      warnings.push({
        id: `row-token-like-${row.id}`,
        severity: "danger",
        message: `"${row.key}" looks like it may contain sensitive data.`,
        rowId: row.id,
      });
    }

    if (input.settings.mode === "query-string" && /\[[^\]]*]/.test(row.key)) {
      warnings.push({
        id: `query-string-nesting-${row.id}`,
        severity: "warning",
        message: "query-string intentionally does not support nested syntax.",
        rowId: row.id,
      });
    }
  }

  if (input.settings.sort !== "preserveRows") {
    warnings.push({
      id: "sort-ignores-dnd",
      severity: "warning",
      message: "Current sort mode ignores drag-and-drop row order in output.",
    });
  }

  if (input.settings.mode === "native") {
    warnings.push({
      id: "native-normalization",
      severity: "info",
      message: "URLSearchParams uses fixed form-style serialization and may normalize bare keys.",
    });
  }

  return warnings;
}
