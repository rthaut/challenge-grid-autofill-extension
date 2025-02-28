import * as ENTRUST_GRID_CONFIG from "./configs/entrust";
import * as DEEPNET_GRID_CONFIG from "./configs/deepnet";

export const GRID_CONFIGS = {
  entrust: { ...ENTRUST_GRID_CONFIG },
  deepnet: { ...DEEPNET_GRID_CONFIG },
} as const;

export type GridType = keyof typeof GRID_CONFIGS;

export const GRID_TYPES = Object.keys(GRID_CONFIGS) as GridType[];

export interface Grid {
  id: string;
  title: string;
  type: GridType;
  matrix: string[][];
}

export interface GridConfig {
  CHALLENGE_PATTERNS: RegExp[];
  MATRIX_COLS: string[];
  MATRIX_ROWS: string[];
  RESPONSE_INPUT_FIELD_QUERY_SELECTOR: string;
}

export const GRIDS_STORAGE_KEY = "grids";

/**
 * Returns all grids from browser sync storage
 * @returns {Promise<Grid[]>} the grids in storage
 */
export const GetGridsFromStorage = async (): Promise<Grid[]> => {
  const { [GRIDS_STORAGE_KEY]: grids } = await browser.storage.sync.get({
    [GRIDS_STORAGE_KEY]: [],
  });

  return grids as Grid[]; // TODO: remove this cast
};

/**
 * Returns the specified grid (by `id`) from browser sync storage
 * @param {string} id the ID of an existing grid
 * @returns {Promise<object|undefined>} the grid from storage
 */
export const GetGridFromStorageByID = async (
  id: Grid["id"],
): Promise<Grid | undefined> => {
  const grids = await GetGridsFromStorage();

  const grid = grids.find((grid) => grid.id === id);

  return grid;
};

/**
 * Injects the content script into the active tab and attempts to autofill the supplied `grid`
 * @param {object} grid the grid object
 * @returns {Promise<void>}
 */
export const FillGridInActiveTab = async (grid: Grid) => {
  try {
    const activeTab = await browser.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => tabs[0]);

    if (activeTab && activeTab.id) {
      return await FillGridInTab(activeTab.id, grid);
    }
  } catch (error) {
    console.error("Failed to fill grid in active tab:", error);
  }
};

/**
 * Injects the content script into the specified tab and attempts to autofill the supplied `grid`
 * @param {number} tabId the ID of the tab to target
 * @param {object} grid the grid object
 * @returns {Promise<void>}
 */
export const FillGridInTab = async (tabId: number, grid: Grid) => {
  try {
    const injectionResults = await browser.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ["/content-scripts/content.js"],
    });

    // NOTE: Chrome throws a runtime error on `executeScript` if the script fails to load/execute, but Firefox has an `error` property on the result object, so we just throw the error if it exists to be consistent
    for (const injectionResult of injectionResults) {
      if (injectionResult.error) {
        throw injectionResult.error;
      }
    }

    await browser.tabs.sendMessage(tabId, {
      action: "fill-grid",
      grid,
    });
  } catch (error) {
    console.error("Failed to fill grid in tab:", error);
  }
};

/**
 * Returns an empty matrix for the supplied grid `type`
 * @param {string} type the type of grid
 * @returns {string[][]} the empty matrix
 */
export const GetEmptyGridMatrix = (type: GridType) => {
  const { MATRIX_COLS: cols, MATRIX_ROWS: rows } = GRID_CONFIGS[type];

  return Array(rows.length)
    .fill("")
    .map(() => Array(cols.length).fill(""));
};

/**
 * Returns the response to a given `challenge` using the supplied grid `type` and `matrix`
 * @param {string} type the type of the grid
 * @param {string[]} challenge the array of challenge grid cells (in A# format)
 * @param {string[][]} matrix the grid matrix
 * @returns {string} the response for the challenge
 */
export const GetResponseForChallengeFromGridMatrix = (
  type: GridType,
  challenge: string[],
  matrix: string[][],
) => {
  const { MATRIX_COLS: cols, MATRIX_ROWS: rows } = GRID_CONFIGS[type];

  let response = "";

  challenge.forEach((c) => {
    const col = c[0];
    const row = c.split("").slice(1).join("");
    response += matrix[rows.indexOf(row)][cols.indexOf(col)];
  });

  return response;
};

/**
 * Returns `true` if the supplied `matrix` matches the dimensions of the supplied grid `type` AND every cell has one non-empty character
 * @param {string} type the type of grid
 * @param {string[][]} matrix the grid matrix
 * @returns {boolean}
 */
export const IsGridMatrixValid = (
  type: GridType,
  matrix: string[][] | undefined,
) => {
  const { MATRIX_COLS: cols, MATRIX_ROWS: rows } = GRID_CONFIGS[type];

  return (
    matrix !== undefined &&
    Array.isArray(matrix) &&
    matrix.length === rows.length &&
    matrix.every(
      (row) =>
        row.length === cols.length &&
        row.every((cell) => cell !== "" && cell.length === 1),
    )
  );
};

/**
 * Returns `true` if the supplied grid type is valid
 * @param {string} type the type of grid
 * @returns {boolean}
 */
export const IsGridTypeValid = (type: unknown): type is GridType =>
  GRID_TYPES.includes(type as GridType);

/**
 * Returns `true` if the supplied grid object is valid
 * @param {Partial<Grid>} grid the grid object
 * @returns {boolean}
 */
export const IsGridValid = (grid: Partial<Grid>): grid is Grid =>
  (grid.id ?? "").length > 0 &&
  (grid.title ?? "").length > 0 &&
  IsGridTypeValid(grid.type) &&
  IsGridMatrixValid(grid.type, grid.matrix);

/**
 * Opens the Create/Edit Grid page in a new popup window
 * @param {string} [id] (optional) the ID of an existing grid to edit
 * @returns {Promise<Windows.window>} the created window
 */
export const OpenEditPage = (id: string | null = null) => {
  let url = browser.runtime.getURL("/create-edit-grid.html");
  if (id) {
    url += `?id=${id}`;
  }

  return browser.windows.create({
    url,
    type: "popup",
    width: 600,
    height: 820,
  });
};
