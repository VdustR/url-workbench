import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PwaPrompt, startPwaPromptRuntime, type PwaPromptState } from "./pwaPrompt";

class FakeEventTarget extends EventTarget {
  emit(type: string) {
    this.dispatchEvent(new Event(type));
  }
}

class FakeWindow extends FakeEventTarget {
  document = { readyState: "complete" as DocumentReadyState };
}

class FakeWorker extends FakeEventTarget {
  state: ServiceWorkerState = "installing";
}

class FakeRegistration extends FakeEventTarget {
  installing: FakeWorker | null = null;
  waiting: FakeWorker | null = null;
}

class FakeServiceWorkerContainer extends FakeEventTarget {
  controller: object | null = null;
  registration = new FakeRegistration();
  registerCalls: { url: string; options: RegistrationOptions }[] = [];

  async register(url: string, options: RegistrationOptions = {}) {
    this.registerCalls.push({ url, options });
    return this.registration;
  }
}

function renderPrompt(state: PwaPromptState) {
  return renderToStaticMarkup(<PwaPrompt state={state} onReload={() => undefined} />);
}

async function flushPromises() {
  await new Promise<void>((resolve) => queueMicrotask(resolve));
}

describe("PwaPrompt", () => {
  it("stays hidden when the app is online and current", () => {
    expect(renderPrompt({ isOffline: false, updateAvailable: false })).toBe("");
  });

  it("renders cached-workbench status while offline", () => {
    const markup = renderPrompt({ isOffline: true, updateAvailable: false });

    expect(markup).toContain("Offline mode");
    expect(markup).toContain("cached workbench");
    expect(markup).not.toContain("Reload");
  });

  it("renders a reload prompt when an update is ready", () => {
    const markup = renderPrompt({ isOffline: false, updateAvailable: true });

    expect(markup).toContain("Update ready");
    expect(markup).toContain("Reload");
    expect(markup).toContain('role="region"');
    expect(markup).toContain('aria-label="Update available"');
    expect(markup).not.toContain('role="status"');
  });
});

describe("startPwaPromptRuntime", () => {
  it("tracks offline and online browser events", () => {
    const window = new FakeWindow();
    const navigator = { onLine: true };
    const offlineStates: boolean[] = [];

    const stop = startPwaPromptRuntime({
      baseUrl: "/",
      navigator,
      production: false,
      window,
      onOfflineChange: (isOffline) => offlineStates.push(isOffline),
      onUpdateAvailable: () => undefined,
    });

    navigator.onLine = false;
    window.emit("offline");
    navigator.onLine = true;
    window.emit("online");

    expect(offlineStates).toEqual([false, true, false]);

    stop();
  });

  it("registers the scoped service worker and reports a waiting update", async () => {
    const window = new FakeWindow();
    const serviceWorker = new FakeServiceWorkerContainer();
    serviceWorker.controller = {};
    serviceWorker.registration.waiting = new FakeWorker();
    const updateEvents: string[] = [];

    startPwaPromptRuntime({
      baseUrl: "/url-workbench/",
      navigator: { onLine: true, serviceWorker },
      production: true,
      window,
      onOfflineChange: () => undefined,
      onUpdateAvailable: () => updateEvents.push("update"),
    });
    await flushPromises();

    expect(serviceWorker.registerCalls).toEqual([
      {
        url: "/url-workbench/sw.js",
        options: { scope: "/url-workbench/" },
      },
    ]);
    expect(updateEvents).toEqual(["update"]);
  });

  it("waits for window load before registering the service worker", async () => {
    const window = new FakeWindow();
    const serviceWorker = new FakeServiceWorkerContainer();
    window.document.readyState = "loading";

    startPwaPromptRuntime({
      baseUrl: "/",
      navigator: { onLine: true, serviceWorker },
      production: true,
      window,
      onOfflineChange: () => undefined,
      onUpdateAvailable: () => undefined,
    });
    await flushPromises();

    expect(serviceWorker.registerCalls).toEqual([]);

    window.document.readyState = "complete";
    window.emit("load");
    await flushPromises();

    expect(serviceWorker.registerCalls).toEqual([{ url: "/sw.js", options: { scope: "/" } }]);
  });

  it("does not show an update prompt for the first service worker claim", async () => {
    const window = new FakeWindow();
    const serviceWorker = new FakeServiceWorkerContainer();
    const updateEvents: string[] = [];

    startPwaPromptRuntime({
      baseUrl: "/",
      navigator: { onLine: true, serviceWorker },
      production: true,
      window,
      onOfflineChange: () => undefined,
      onUpdateAvailable: () => updateEvents.push("update"),
    });
    await flushPromises();

    serviceWorker.controller = {};
    serviceWorker.emit("controllerchange");

    expect(updateEvents).toEqual([]);
  });

  it("reports an update when a new installing worker reaches installed", async () => {
    const window = new FakeWindow();
    const serviceWorker = new FakeServiceWorkerContainer();
    const installingWorker = new FakeWorker();
    const updateEvents: string[] = [];
    serviceWorker.controller = {};

    startPwaPromptRuntime({
      baseUrl: "/",
      navigator: { onLine: true, serviceWorker },
      production: true,
      window,
      onOfflineChange: () => undefined,
      onUpdateAvailable: () => updateEvents.push("update"),
    });
    await flushPromises();

    serviceWorker.registration.installing = installingWorker;
    serviceWorker.registration.emit("updatefound");
    installingWorker.state = "installed";
    installingWorker.emit("statechange");

    expect(updateEvents).toEqual(["update"]);
  });

  it("reports each service worker update once", async () => {
    const window = new FakeWindow();
    const serviceWorker = new FakeServiceWorkerContainer();
    const installingWorker = new FakeWorker();
    const updateEvents: string[] = [];
    serviceWorker.controller = {};

    startPwaPromptRuntime({
      baseUrl: "/",
      navigator: { onLine: true, serviceWorker },
      production: true,
      window,
      onOfflineChange: () => undefined,
      onUpdateAvailable: () => updateEvents.push("update"),
    });
    await flushPromises();

    serviceWorker.registration.installing = installingWorker;
    serviceWorker.registration.emit("updatefound");
    installingWorker.state = "installed";
    installingWorker.emit("statechange");
    serviceWorker.emit("controllerchange");

    expect(updateEvents).toEqual(["update"]);
  });
});
