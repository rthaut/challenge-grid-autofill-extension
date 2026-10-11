import { type Grid, IsGridValid } from "@/utils/grids";

export const AUTOFILL_COMMAND = "autofill-grid";

// remembers the grid last filled on each site, in local storage (it's per device and not worth syncing)
export const LAST_GRID_BY_SITE_STORAGE_KEY = "lastGridBySite";

export type ShortcutGridChoice =
  | { status: "chosen"; grid: Grid }
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
    return { status: "chosen", grid: validGrids[0]! };
  }

  const remembered = validGrids.find((grid) => grid.id === rememberedGridId);
  if (remembered) {
    return { status: "chosen", grid: remembered };
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
