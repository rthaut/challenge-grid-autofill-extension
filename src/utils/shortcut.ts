import { type Grid, IsGridValid } from "@/utils/grids";

export const AUTOFILL_COMMAND = "autofill-grid";

// remembers the grid last filled on each site, in local storage (it's per device and not worth syncing)
export const LAST_GRID_BY_SITE_STORAGE_KEY = "lastGridBySite";

// when the shortcut opened the toolbar popup to choose a grid, in session storage so the popup can say why it opened
export const CHOOSE_GRID_REQUEST_STORAGE_KEY = "chooseGridRequestedAt";

// how long the request is valid, so a later popup opened from the toolbar doesn't show it
const CHOOSE_GRID_REQUEST_MAX_AGE_MS = 10_000;

export type ShortcutGridChoice =
  // `fromSeveral` is whether the grid was chosen from more than one valid grid
  | { status: "chosen"; grid: Grid; fromSeveral: boolean }
  | { status: "no-grids" }
  | { status: "ambiguous" };

/**
 * Returns the site a page belongs to (its host, including any port), or `undefined` for pages a grid can't be filled on
 * @param {string} [url] the page URL
 * @returns {string|undefined} the site
 */
export const GetSiteFromUrl = (url: string | undefined) => {
  try {
    const { protocol, host } = new URL(url ?? "");
    if (protocol === "http:" || protocol === "https:") {
      return host;
    }
    if (protocol === "file:") {
      return "file:";
    }
  } catch {
    // not a URL
  }
  return undefined;
};

/**
 * Returns the grid the keyboard shortcut should fill: the only grid, or the one last filled on the site
 * @param {Partial<Grid>[]} grids all grids from storage
 * @param {string} [rememberedGridId] the ID of the grid last filled on the site
 * @returns {ShortcutGridChoice} the grid, or why there isn't one
 */
export const ChooseGridForShortcut = (
  grids: Partial<Grid>[],
  rememberedGridId: string | undefined,
): ShortcutGridChoice => {
  const validGrids = grids.filter(IsGridValid);

  if (validGrids.length === 0) {
    return { status: "no-grids" };
  }

  if (validGrids.length === 1) {
    return { status: "chosen", grid: validGrids[0]!, fromSeveral: false };
  }

  const remembered = validGrids.find((grid) => grid.id === rememberedGridId);
  if (remembered) {
    return { status: "chosen", grid: remembered, fromSeveral: true };
  }

  return { status: "ambiguous" };
};

const GetLastGridBySite = async () => {
  const { [LAST_GRID_BY_SITE_STORAGE_KEY]: lastGridBySite } =
    await browser.storage.local.get({ [LAST_GRID_BY_SITE_STORAGE_KEY]: {} });

  return lastGridBySite as Record<string, string>;
};

/**
 * Returns the ID of the grid last filled on the page's site
 * @param {string} [url] the page URL
 * @returns {Promise<string|undefined>} the grid ID
 */
export const GetRememberedGridIdForUrl = async (url: string | undefined) => {
  const site = GetSiteFromUrl(url);
  return site === undefined ? undefined : (await GetLastGridBySite())[site];
};

/**
 * Remembers the grid that was filled on the page's site, for the keyboard shortcut
 * @param {string} [url] the page URL
 * @param {string} gridId the ID of the grid that was filled
 */
export const RememberGridForUrl = async (
  url: string | undefined,
  gridId: string,
) => {
  const site = GetSiteFromUrl(url);
  if (site === undefined) {
    return;
  }

  const lastGridBySite = await GetLastGridBySite();
  if (lastGridBySite[site] !== gridId) {
    await browser.storage.local.set({
      [LAST_GRID_BY_SITE_STORAGE_KEY]: { ...lastGridBySite, [site]: gridId },
    });
  }
};

/**
 * Opens the toolbar popup so the user can choose a grid for the shortcut, where the browser allows it
 * (Chrome and Edge 127 or later; some Firefox versions only allow it while handling the shortcut itself, before any `await`)
 * @returns {Promise<boolean>} whether the popup opened
 */
export const OpenPopupToChooseGrid = async () => {
  await browser.storage.session.set({
    [CHOOSE_GRID_REQUEST_STORAGE_KEY]: Date.now(),
  });

  try {
    await browser.action.openPopup();
    return true;
  } catch (error) {
    console.info("Couldn't open the popup to choose a grid:", error);
    await browser.storage.session.remove(CHOOSE_GRID_REQUEST_STORAGE_KEY);
    return false;
  }
};

/**
 * Returns whether the shortcut just opened the popup to choose a grid, and clears the request so it's only shown once
 * @returns {Promise<boolean>} whether the popup was opened to choose a grid
 */
export const TakeChooseGridRequest = async () => {
  const { [CHOOSE_GRID_REQUEST_STORAGE_KEY]: requestedAt } =
    await browser.storage.session.get(CHOOSE_GRID_REQUEST_STORAGE_KEY);
  if (typeof requestedAt !== "number") {
    return false;
  }

  await browser.storage.session.remove(CHOOSE_GRID_REQUEST_STORAGE_KEY);
  return Date.now() - requestedAt < CHOOSE_GRID_REQUEST_MAX_AGE_MS;
};
