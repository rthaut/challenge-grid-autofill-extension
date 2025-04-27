import * as ENTRUST_GRID_CONFIG from "./configs/entrust";
import * as DEEPNET_GRID_CONFIG from "./configs/deepnet";

export const GRID_CONFIGS = {
  entrust: { ...ENTRUST_GRID_CONFIG },
  deepnet: { ...DEEPNET_GRID_CONFIG },
} as const;

export type StandardGridType = keyof typeof GRID_CONFIGS;
export type GridType = StandardGridType | "custom";

export const STANDARD_GRID_TYPES = Object.keys(
  GRID_CONFIGS,
) as StandardGridType[];

export const GRID_TYPES = [...STANDARD_GRID_TYPES, "custom"] as GridType[];

export interface StandardGrid {
  id: string;
  title: string;
  type: StandardGridType;
  matrix: string[][];
}

export interface GridConfig {
  matrixCols: string[];
  matrixRows: string[];
  matrixCellLength: number;
  challengePatterns: RegExp[];
  responseInputFieldQuerySelector: string;
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  matrixCols: [],
  matrixRows: [],
  matrixCellLength: 0,
  challengePatterns: [],
  responseInputFieldQuerySelector: `input[type="password"]`,
} as const;

export interface CustomGrid extends Omit<StandardGrid, "type">, GridConfig {
  type: "custom";
}

export type Grid = StandardGrid | CustomGrid;

export const GRIDS_STORAGE_KEY = "grids";

export const GRID_DIMENSION_CONFIGS = {
  "A-Z": {
    max: 26,
    pattern: /[a-zA-Z]{1}/,
    apply: (length: number) =>
      Array(length)
        .fill("")
        .map((_, i) => String.fromCharCode(65 + i)),
  },
  "0-9": {
    max: 10,
    pattern: /\d{1}/,
    apply: (length: number) =>
      Array(length)
        .fill("")
        .map((_, i) => String(i)),
  },
  "1-9": {
    max: 10,
    pattern: /\d{1,2}/,
    apply: (length: number) =>
      Array(length)
        .fill("")
        .map((_, i) => String(i + 1)),
  },
};

export type GridDimensionConfig = keyof typeof GRID_DIMENSION_CONFIGS;

/**
 * Returns all grids from browser sync storage
 * @returns {Promise<StandardGrid[]>} the grids in storage
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
 * @param {Grid} grid the grid object
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
 * @param {Grid} grid the grid object
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
 * Returns an empty matrix for the supplied column and row arrays
 * @param {string[]} cols the grid columns
 * @param {string[]} rows the grid rows
 * @returns {string[][]} the empty matrix
 */
export const GetEmptyGridMatrix = (cols: string[], rows: string[]) =>
  Array(rows.length)
    .fill("")
    .map(() => Array(cols.length).fill(""));

/**
 * Returns the response to a given `challenge` using the supplied grid `matrix` and
 * @param {string[]} challenge the array of challenge grid cells (in A# format)
 * @param {string[][]} matrix the grid matrix
 * @param {string[]} cols the grid columns
 * @param {string[]} rows the grid rows
 * @returns {string} the response for the challenge
 */
export const GetResponseForChallengeFromMatrix = (
  challenge: string[],
  matrix: string[][],
  cols: string[],
  rows: string[],
) => {
  let response = "";

  challenge.forEach((c) => {
    const col = c[0];
    const row = c.split("").slice(1).join("");
    response += matrix[rows.indexOf(row)][cols.indexOf(col)];
  });

  return response;
};

/**
 * Returns `true` if the supplied `matrix` matches the supplied dimensions AND every cell has the correct number of non-empty characters
 * @param {string[][]} matrix the grid matrix
 * @param {number} colsLength the number of columns that should be in the matrix
 * @param {number} rowsLength the number of rows that should be in the matrix
 * @param {number} cellLength the number of characters that should be in each cell
 * @returns {boolean}
 */
export const IsGridMatrixValid = (
  matrix: string[][] | undefined,
  colsLength: number,
  rowsLength: number,
  cellLength: number,
): matrix is string[][] => {
  if (matrix === undefined || !Array.isArray(matrix)) {
    return false;
  }

  return (
    matrix.length === rowsLength &&
    matrix.every(
      (row) =>
        row.length === colsLength &&
        row.every(
          (cell) => cell.trim() !== "" && cell.trim().length === cellLength,
        ),
    )
  );
};

/**
 * Returns `true` if the supplied grid type is valid
 * @param {string} type the type of grid
 * @returns {boolean}
 */
export const IsGridTypeValid = (type: unknown): type is GridType =>
  type === "custom" || IsStandardGridType(type);

/**
 * Returns `true` if the supplied grid type is a standard grid type
 * @param {string} type the type of grid
 * @returns {boolean}
 */
export const IsStandardGridType = (type: unknown): type is StandardGridType =>
  STANDARD_GRID_TYPES.includes(type as StandardGridType);

/**
 * Returns `true` if the supplied grid config object has all required properties to define a custom grid matrix
 * @param {Partial<GridConfig>} config the grid config object to validate
 * @returns {boolean}
 */
export const IsCustomGridConfigValidForMatrix = (
  config: Partial<GridConfig>,
): config is Pick<
  GridConfig,
  "matrixCols" | "matrixRows" | "matrixCellLength"
> => {
  if (
    config.matrixCols === undefined ||
    !Array.isArray(config.matrixCols) ||
    !config.matrixCols.length
  ) {
    return false;
  }

  if (
    config.matrixRows === undefined ||
    !Array.isArray(config.matrixRows) ||
    !config.matrixRows.length
  ) {
    return false;
  }

  if (
    config.matrixCellLength === undefined ||
    typeof config.matrixCellLength !== "number" ||
    config.matrixCellLength < 1
  ) {
    return false;
  }

  return true;
};

/**
 * Returns the grid config values for the supplied custom grid
 * @param {Partial<CustomGrid>} grid the custom grid object
 * @returns {Partial<GridConfig>} the grid config values
 */
export const GetConfigValuesFromCustomGrid = (
  grid: Partial<CustomGrid>,
): Partial<GridConfig> => {
  if (IsStandardGridType(grid.type)) {
    return GRID_CONFIGS[grid.type];
  }

  return {
    matrixCols: grid.matrixCols,
    matrixRows: grid.matrixRows,
    matrixCellLength: grid.matrixCellLength,
    challengePatterns: grid.challengePatterns,
    responseInputFieldQuerySelector: grid.responseInputFieldQuerySelector,
  };
};

/**
 * Returns the grid config values for the supplied grid, using the default grid config values as a fallback
 * @param {Grid} grid the grid object
 * @returns {GridConfig} the grid config values
 */
export const GetConfigValuesWithDefaultsForGrid = (
  grid: Partial<Grid>,
): GridConfig => {
  if (IsStandardGridType(grid.type)) {
    return GRID_CONFIGS[grid.type];
  }

  if (grid.type === "custom") {
    return {
      matrixCols: grid.matrixCols ?? DEFAULT_GRID_CONFIG.matrixCols,
      matrixRows: grid.matrixRows ?? DEFAULT_GRID_CONFIG.matrixRows,
      matrixCellLength:
        grid.matrixCellLength ?? DEFAULT_GRID_CONFIG.matrixCellLength,
      challengePatterns:
        grid.challengePatterns ?? DEFAULT_GRID_CONFIG.challengePatterns,
      responseInputFieldQuerySelector:
        grid.responseInputFieldQuerySelector ??
        DEFAULT_GRID_CONFIG.responseInputFieldQuerySelector,
    };
  }

  return DEFAULT_GRID_CONFIG;
};

/**
 * Returns `true` if the supplied grid object is valid
 * @param {Partial<Grid>} grid the grid object
 * @returns {boolean}
 */
export const IsGridValid = (
  grid: Partial<Grid>,
  customConfig?: Partial<GridConfig>,
): grid is Grid => {
  console.info("Validating grid", grid);

  if (grid.id === undefined || grid.id === "") {
    console.info("Grid id is undefined or empty");
    return false;
  }

  if (grid.title === undefined || grid.title === "") {
    console.info("Grid title is undefined or empty");
    return false;
  }

  if (!IsGridTypeValid(grid.type)) {
    console.info("Grid type is invalid");
    return false;
  }

  if (IsStandardGridType(grid.type)) {
    const { matrixCols, matrixRows, matrixCellLength } =
      GRID_CONFIGS[grid.type];
    return IsGridMatrixValid(
      grid.matrix,
      matrixCols.length,
      matrixRows.length,
      matrixCellLength,
    );
  }

  // at this point, we know it is a custom grid, but we have to validate the config first, then the matrix
  const gridWithConfig: Partial<CustomGrid> = {
    ...(grid as CustomGrid),
    ...customConfig,
  };
  const config = GetConfigValuesFromCustomGrid(gridWithConfig);
  if (!IsCustomGridConfigValidForMatrix(config)) {
    return false;
  }

  const isMatrixValid = IsGridMatrixValid(
    grid.matrix,
    config.matrixCols.length,
    config.matrixRows.length,
    config.matrixCellLength,
  );

  if (!isMatrixValid) {
    console.info("Custom grid matrix is invalid");
    return false;
  }

  if (
    gridWithConfig.challengePatterns === undefined ||
    !Array.isArray(gridWithConfig.challengePatterns) ||
    !gridWithConfig.challengePatterns.length
  ) {
    console.info("Custom grid challenge patterns are invalid");
    return false;
  }

  if (
    gridWithConfig.responseInputFieldQuerySelector === undefined ||
    typeof gridWithConfig.responseInputFieldQuerySelector !== "string" ||
    !gridWithConfig.responseInputFieldQuerySelector.length
  ) {
    console.info("Custom grid response input field query selector is invalid");
    return false;
  }

  return true;
};

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
