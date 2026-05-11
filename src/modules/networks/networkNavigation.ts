const NETWORK_NAVIGATION_TARGET_KEY = "netbird-network-navigation-target";

export type NetworkNavigationTarget = {
  id: string;
  tab?: string;
  resource?: string;
  target?: string;
};

let inMemoryNetworkNavigationTarget: NetworkNavigationTarget | undefined;

type Router = {
  push: (href: string) => void;
};

export const buildNetworkHref = (
  target: NetworkNavigationTarget,
  cacheBust = true,
) => {
  const params = new URLSearchParams({ id: target.id });
  if (target.tab) params.set("tab", target.tab);
  if (target.resource) params.set("resource", target.resource);
  if (target.target) params.set("target", target.target);
  if (cacheBust) params.set("_nav", Date.now().toString());
  return `/network?${params.toString()}`;
};

export const rememberNetworkNavigationTarget = (
  target: NetworkNavigationTarget,
) => {
  inMemoryNetworkNavigationTarget = target;

  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(
    NETWORK_NAVIGATION_TARGET_KEY,
    JSON.stringify(target),
  );
};

export const consumeNetworkNavigationTarget = () => {
  const inMemoryTarget = inMemoryNetworkNavigationTarget;
  inMemoryNetworkNavigationTarget = undefined;

  if (typeof window === "undefined") return inMemoryTarget;

  const item = window.sessionStorage.getItem(NETWORK_NAVIGATION_TARGET_KEY);
  if (!item) return inMemoryTarget;

  window.sessionStorage.removeItem(NETWORK_NAVIGATION_TARGET_KEY);

  if (inMemoryTarget?.id) return inMemoryTarget;

  try {
    return JSON.parse(item) as NetworkNavigationTarget;
  } catch {
    return undefined;
  }
};

export const peekNetworkNavigationTarget = () => {
  if (inMemoryNetworkNavigationTarget?.id) {
    return inMemoryNetworkNavigationTarget;
  }

  if (typeof window === "undefined") return undefined;

  const item = window.sessionStorage.getItem(NETWORK_NAVIGATION_TARGET_KEY);
  if (!item) return undefined;

  try {
    return JSON.parse(item) as NetworkNavigationTarget;
  } catch {
    return undefined;
  }
};

export const navigateToNetwork = (
  router: Router,
  target: NetworkNavigationTarget,
) => {
  rememberNetworkNavigationTarget(target);
  router.push(buildNetworkHref(target));
};
