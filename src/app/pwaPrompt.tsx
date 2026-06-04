import { useEffect, useState } from "react";
import styled from "@emotion/styled";

export type PwaPromptState = {
  isOffline: boolean;
  updateAvailable: boolean;
};

type EventListenerSource = Pick<EventTarget, "addEventListener" | "removeEventListener">;
type RuntimeEventListener = (event?: Event) => void;

type WindowLike = EventListenerSource & {
  document?: {
    readyState?: DocumentReadyState;
  };
  location?: {
    reload: () => void;
  };
};

type ServiceWorkerLike = EventListenerSource & {
  state: ServiceWorkerState;
};

type ServiceWorkerRegistrationLike = EventListenerSource & {
  installing?: ServiceWorkerLike | null;
  waiting?: ServiceWorkerLike | null;
};

type ServiceWorkerContainerLike = EventListenerSource & {
  controller?: unknown;
  register: (
    scriptUrl: string,
    options?: RegistrationOptions,
  ) => Promise<ServiceWorkerRegistrationLike>;
};

type NavigatorLike = {
  onLine?: boolean;
  serviceWorker?: ServiceWorkerContainerLike;
};

export type PwaPromptRuntimeOptions = {
  baseUrl: string;
  navigator: NavigatorLike;
  production: boolean;
  window: WindowLike;
  onOfflineChange: (isOffline: boolean) => void;
  onUpdateAvailable: () => void;
};

export function getInitialPwaPromptState(navigatorLike?: NavigatorLike): PwaPromptState {
  return {
    isOffline: navigatorLike?.onLine === false,
    updateAvailable: false,
  };
}

export function startPwaPromptRuntime({
  baseUrl,
  navigator,
  production,
  window,
  onOfflineChange,
  onUpdateAvailable,
}: PwaPromptRuntimeOptions) {
  let stopped = false;
  let updateNotified = false;
  const workerStateListeners: { listener: RuntimeEventListener; worker: ServiceWorkerLike }[] = [];
  const registrationUpdateListeners: {
    listener: RuntimeEventListener;
    registration: ServiceWorkerRegistrationLike;
  }[] = [];

  const syncOfflineState: RuntimeEventListener = () => {
    onOfflineChange(navigator.onLine === false);
  };

  window.addEventListener("offline", syncOfflineState);
  window.addEventListener("online", syncOfflineState);
  syncOfflineState();

  const serviceWorker = navigator.serviceWorker;

  if (!production || !serviceWorker) {
    return () => {
      window.removeEventListener("offline", syncOfflineState);
      window.removeEventListener("online", syncOfflineState);
    };
  }

  let hadController = Boolean(serviceWorker.controller);

  const markUpdateAvailable = () => {
    if (stopped || updateNotified) return;

    updateNotified = true;
    onUpdateAvailable();
  };

  const onControllerChange: RuntimeEventListener = () => {
    if (hadController) {
      markUpdateAvailable();
      return;
    }

    hadController = true;
  };

  const watchInstallingWorker = (registration: ServiceWorkerRegistrationLike) => {
    const installingWorker = registration.installing;

    if (!installingWorker) return;

    const onStateChange: RuntimeEventListener = () => {
      if (installingWorker.state === "installed" && hadController) {
        markUpdateAvailable();
      }
    };

    installingWorker.addEventListener("statechange", onStateChange);
    workerStateListeners.push({ listener: onStateChange, worker: installingWorker });
    onStateChange();
  };

  const registerServiceWorker: RuntimeEventListener = () => {
    void serviceWorker
      .register(`${ensureTrailingSlash(baseUrl)}sw.js`, {
        scope: ensureTrailingSlash(baseUrl),
      })
      .then((registration) => {
        if (stopped) return;

        if (registration.waiting && hadController) {
          markUpdateAvailable();
        }

        watchInstallingWorker(registration);
        const onUpdateFound: RuntimeEventListener = () => watchInstallingWorker(registration);
        registration.addEventListener("updatefound", onUpdateFound);
        registrationUpdateListeners.push({ listener: onUpdateFound, registration });
      })
      .catch(() => undefined);
  };

  serviceWorker.addEventListener("controllerchange", onControllerChange);

  if (!window.document || window.document.readyState === "complete") {
    registerServiceWorker();
  } else {
    window.addEventListener("load", registerServiceWorker);
  }

  return () => {
    stopped = true;
    window.removeEventListener("offline", syncOfflineState);
    window.removeEventListener("online", syncOfflineState);
    window.removeEventListener("load", registerServiceWorker);
    serviceWorker.removeEventListener("controllerchange", onControllerChange);

    for (const { listener, worker } of workerStateListeners) {
      worker.removeEventListener("statechange", listener);
    }

    for (const { listener, registration } of registrationUpdateListeners) {
      registration.removeEventListener("updatefound", listener);
    }
  };
}

export function usePwaPromptState(): PwaPromptState {
  const [state, setState] = useState(() =>
    getInitialPwaPromptState(typeof navigator === "undefined" ? undefined : navigator),
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return undefined;

    return startPwaPromptRuntime({
      baseUrl: import.meta.env.BASE_URL,
      navigator,
      production: import.meta.env.PROD,
      window,
      onOfflineChange: (isOffline) => {
        setState((current) => {
          if (current.isOffline === isOffline) return current;
          return { ...current, isOffline };
        });
      },
      onUpdateAvailable: () => {
        setState((current) => {
          if (current.updateAvailable) return current;
          return { ...current, updateAvailable: true };
        });
      },
    });
  }, []);

  return state;
}

export function reloadPageForPwaUpdate() {
  window.location.reload();
}

export function PwaPrompt({
  state,
  onReload = reloadPageForPwaUpdate,
}: {
  state: PwaPromptState;
  onReload?: () => void;
}) {
  if (!state.isOffline && !state.updateAvailable) return null;

  const title = state.updateAvailable ? "Update ready" : "Offline mode";
  const message = state.updateAvailable
    ? "A newer offline copy is installed. Reload to use it."
    : "You are offline. The cached workbench is active.";

  return (
    <PromptDock
      aria-live="polite"
      aria-label={state.updateAvailable ? "Update available" : undefined}
      data-kind={state.updateAvailable ? "update" : "offline"}
      role={state.updateAvailable ? "region" : "status"}
    >
      <PromptIndicator aria-hidden="true" />
      <PromptText>
        <strong>{title}</strong>
        <span>{message}</span>
      </PromptText>
      {state.updateAvailable ? (
        <PromptButton type="button" onClick={onReload}>
          Reload
        </PromptButton>
      ) : null}
    </PromptDock>
  );
}

function ensureTrailingSlash(path: string) {
  return path.endsWith("/") ? path : `${path}/`;
}

const PromptDock = styled.aside`
  position: fixed;
  right: max(14px, env(safe-area-inset-right));
  bottom: max(14px, env(safe-area-inset-bottom));
  z-index: 30;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  width: min(430px, calc(100vw - 28px));
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--ink);
  background: var(--panel);
  box-shadow: 0 18px 46px oklch(0.2 0.033 255 / 0.2);

  &[data-kind="update"] {
    border-color: oklch(0.49 0.15 260 / 0.3);
  }

  @media (max-width: 560px) {
    right: max(10px, env(safe-area-inset-right));
    bottom: max(10px, env(safe-area-inset-bottom));
    grid-template-columns: auto minmax(0, 1fr);
    width: min(100vw - 20px, 560px);
  }
`;

const PromptIndicator = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--amber);

  [data-kind="update"] & {
    background: var(--blue);
  }
`;

const PromptText = styled.span`
  display: grid;
  gap: 2px;
  min-width: 0;

  strong {
    color: var(--ink);
    font-size: 13px;
    font-weight: 820;
    line-height: 1.2;
  }

  span {
    color: var(--muted);
    font-size: 12px;
    line-height: 1.35;
  }
`;

const PromptButton = styled.button`
  min-height: 38px;
  border: 0;
  border-radius: 8px;
  padding: 0 12px;
  color: var(--inverse-ink);
  background: var(--ink);
  font-weight: 780;
  cursor: pointer;
  transition-property: background-color, transform;
  transition-duration: 150ms;

  &:hover {
    background: var(--ink-hover);
  }

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 3px solid var(--focus-ring);
    outline-offset: 2px;
  }

  @media (max-width: 560px) {
    grid-column: 1 / -1;
    width: 100%;
    min-height: 44px;
  }
`;
