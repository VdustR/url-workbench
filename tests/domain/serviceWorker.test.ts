import { describe, expect, it } from "vitest";
import serviceWorkerSource from "../../public/sw.js?raw";

describe("service worker lifecycle", () => {
  it("activates update workers without waiting for an extra skip-waiting message", () => {
    expect(serviceWorkerSource).toContain("self.skipWaiting()");
    expect(serviceWorkerSource).toContain("self.clients.claim()");
  });
});
