import type { ParsedUrlResult, UrlParts } from "./types";

export function parseUrlInput(raw: string): ParsedUrlResult {
  try {
    const url = new URL(raw);
    return { ok: true, raw, url, parts: toUrlParts(url) };
  } catch (error) {
    return {
      ok: false,
      raw,
      error: error instanceof Error ? error.message : "Invalid URL",
    };
  }
}

export function editUrlPart(
  raw: string,
  patch: Partial<
    Pick<
      UrlParts,
      "protocol" | "username" | "password" | "hostname" | "port" | "pathname" | "search" | "hash"
    >
  >,
): ParsedUrlResult {
  const parsed = parseUrlInput(raw);
  if (!parsed.ok) return parsed;

  const next = new URL(parsed.url.href);
  if (patch.protocol !== undefined) next.protocol = patch.protocol;
  if (patch.username !== undefined) next.username = patch.username;
  if (patch.password !== undefined) next.password = patch.password;
  if (patch.hostname !== undefined) next.hostname = patch.hostname;
  if (patch.port !== undefined) next.port = patch.port;
  if (patch.pathname !== undefined) next.pathname = patch.pathname;
  if (patch.search !== undefined) next.search = patch.search;
  if (patch.hash !== undefined) next.hash = patch.hash;

  return { ok: true, raw: next.href, url: next, parts: toUrlParts(next) };
}

export function toUrlParts(url: URL): UrlParts {
  return {
    href: url.href,
    protocol: url.protocol,
    username: url.username,
    password: url.password,
    host: url.host,
    hostname: url.hostname,
    port: url.port,
    origin: url.origin,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
  };
}
