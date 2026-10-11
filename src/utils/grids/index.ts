import * as ENTRUST_GRID_CONFIG from "./configs/entrust";
import * as DEEPNET_GRID_CONFIG from "./configs/deepnet";

export const GRID_CONFIGS = {
  entrust: { ...ENTRUST_GRID_CONFIG },
  deepnet: { ...DEEPNET_GRID_CONFIG },
} as const;

export type BuiltInGridType = keyof typeof GRID_CONFIGS;
export type GridType = BuiltInGridType | "custom";

export const BUILT_IN_GRID_TYPES = Object.keys(
  GRID_CONFIGS,
) as BuiltInGridType[];
export const GRID_TYPES: GridType[] = [...BUILT_IN_GRID_TYPES, "custom"];

export interface GridConfig {
  CHALLENGE_PATTERNS: RegExp[];
  MATRIX_COLS: string[];
  MATRIX_ROWS: string[];
  MATRIX_CELL_LENGTH: number;
  RESPONSE_INPUT_FIELD_QUERY_SELECTOR: string;
}

/**
 * The ways the columns or rows of a custom grid can be labeled
 */
export const GRID_KEY_SETS = {
  letters: {
    max: 26,
    keys: (count: number) =>
      Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i)),
  },
  "numbers-from-0": {
    max: 100,
    keys: (count: number) => Array.from({ length: count }, (_, i) => `${i}`),
  },
  "numbers-from-1": {
    max: 99,
    keys: (count: number) =>
      Array.from({ length: count }, (_, i) => `${i + 1}`),
  },
} as const;

export type GridKeySet = keyof typeof GRID_KEY_SETS;

export const GRID_KEY_SET_NAMES = Object.keys(GRID_KEY_SETS) as GridKeySet[];

export interface CustomGridConfig {
  columns: { keySet: GridKeySet; count: number };
  rows: { keySet: GridKeySet; count: number };
  cellLength: number;
  /** regular expression for the challenge cells; empty to build one from the column and row keys */
  challengePattern: string;
  /** CSS selector for the response field(s); empty for the default */
  inputSelector: string;
}

export const MAX_CUSTOM_GRID_CELL_LENGTH = 10;

export const DEFAULT_RESPONSE_INPUT_FIELD_QUERY_SELECTOR = `input[type="password"]`;

export const DEFAULT_CUSTOM_GRID_CONFIG: CustomGridConfig = {
  columns: { keySet: "letters", count: 5 },
  rows: { keySet: "numbers-from-1", count: 5 },
  cellLength: 1,
  challengePattern: "",
  inputSelector: "",
};

interface BaseGrid {
  id: string;
  title: string;
  matrix: string[][];
}

export interface BuiltInGrid extends BaseGrid {
  type: BuiltInGridType;
}

export interface CustomGrid extends BaseGrid {
  type: "custom";
  config: CustomGridConfig;
}

export type Grid = BuiltInGrid | CustomGrid;

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

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Returns the regular expression source that matches one key of a column or row
 * @param {string[]} keys the column or row keys
 * @returns {string} the regular expression source
 */
const GetKeysPatternSource = (keys: string[]) =>
  `(?:${[...keys]
    // longest first, so "10" is tried before "1"
    .sort((a, b) => b.length - a.length)
    .map((key) =>
      /^[A-Z]$/.test(key) ? `[${key}${key.toLowerCase()}]` : escapeRegExp(key),
    )
    .join("|")})`;

/**
 * Returns the challenge pattern for a custom grid: one cell is a column key followed by a row key,
 * and a cell can't be the middle of a longer run of letters or numbers (like "A12" in a grid with rows 1-10)
 * @param {string[]} cols the column keys
 * @param {string[]} rows the row keys
 * @returns {RegExp} the challenge pattern
 */
export const GetChallengePatternFromKeys = (cols: string[], rows: string[]) => {
  const isNumbers = (keys: string[]) => /^\d+$/.test(keys[0] ?? "");
  const before = isNumbers(cols) ? "(?<!\\d)" : "(?<![A-Za-z])";
  const after = isNumbers(rows) ? "(?!\\d)" : "(?![A-Za-z])";

  return new RegExp(
    `${before}${GetKeysPatternSource(cols)}${GetKeysPatternSource(rows)}${after}`,
    "g",
  );
};

/**
 * Returns the configuration for the supplied grid, from its type (built-in grids) or its own settings (custom grids)
 * @param {object} grid the grid (or just its `type` and, for a custom grid, its `config`)
 * @returns {GridConfig} the grid configuration
 */
export const GetGridConfig = (
  grid: Pick<BuiltInGrid, "type"> | Pick<CustomGrid, "type" | "config">,
): GridConfig => {
  if (grid.type !== "custom") {
    return { ...GRID_CONFIGS[grid.type] };
  }

  const { columns, rows, cellLength, challengePattern, inputSelector } =
    grid.config;
  const cols = GRID_KEY_SETS[columns.keySet].keys(columns.count);
  const rowKeys = GRID_KEY_SETS[rows.keySet].keys(rows.count);

  return {
    CHALLENGE_PATTERNS: [
      challengePattern
        ? new RegExp(challengePattern, "g")
        : GetChallengePatternFromKeys(cols, rowKeys),
    ],
    MATRIX_COLS: cols,
    MATRIX_ROWS: rowKeys,
    MATRIX_CELL_LENGTH: cellLength,
    RESPONSE_INPUT_FIELD_QUERY_SELECTOR:
      inputSelector || DEFAULT_RESPONSE_INPUT_FIELD_QUERY_SELECTOR,
  };
};

/**
 * Returns the matrix from the text of a CSV/TSV file, keeping only as many rows (from the end) and columns (from the start) as the grid has
 * @param {string} text the file contents
 * @param {GridConfig} config the grid configuration
 * @returns {string[][]} the matrix, which is smaller than the grid when the file is
 */
export const GetMatrixFromText = (text: string, config: GridConfig) =>
  text
    .replace(/(?:\r?\n)+$/, "") // remove empty line(s) at end of file
    .split(/\r?\n/)
    .slice(config.MATRIX_ROWS.length * -1) // take last # rows (dirty way to skip optional column headers)
    .map(
      (row) =>
        row
          .split(/,|\t/)
          .map((cell) => cell.replace(/\"|\'/g, "").trim())
          .slice(0, config.MATRIX_COLS.length), // take first # columns
    );

/**
 * Returns an empty matrix for the supplied grid configuration
 * @param {GridConfig} config the grid configuration
 * @returns {string[][]} the empty matrix
 */
export const GetEmptyGridMatrix = (config: GridConfig) =>
  Array.from({ length: config.MATRIX_ROWS.length }, () =>
    Array<string>(config.MATRIX_COLS.length).fill(""),
  );

/**
 * Returns the `matrix` resized to the supplied grid configuration, keeping the values that still fit
 * @param {string[][]} matrix the grid matrix
 * @param {GridConfig} config the grid configuration
 * @returns {string[][]} the resized matrix
 */
export const ResizeGridMatrix = (
  matrix: string[][] | undefined,
  config: GridConfig,
) =>
  GetEmptyGridMatrix(config).map((row, rowIndex) =>
    row.map((_, colIndex) => matrix?.[rowIndex]?.[colIndex] ?? ""),
  );

/**
 * Returns the value of each cell in the `challenge`, looked up in the `matrix`
 * @param {string[]} challenge the challenge grid cells (like "A1"; letters can be either case)
 * @param {string[][]} matrix the grid matrix
 * @param {GridConfig} config the grid configuration
 * @returns {string[]|null} the response for each cell, or `null` if a cell isn't in the grid or is empty
 */
export const GetResponseForChallenge = (
  challenge: string[],
  matrix: string[][],
  config: GridConfig,
) => {
  const { MATRIX_COLS: cols, MATRIX_ROWS: rows } = config;

  const response: string[] = [];

  for (const cell of challenge.map((c) => c.toUpperCase())) {
    let value: string | undefined;
    for (const [colIndex, col] of cols.entries()) {
      const rowIndex = cell.startsWith(col)
        ? rows.indexOf(cell.slice(col.length))
        : -1;
      if (rowIndex >= 0) {
        value = matrix[rowIndex]?.[colIndex];
        break;
      }
    }

    if (!value) {
      return null;
    }
    response.push(value);
  }

  return response;
};

/**
 * Returns `true` if the supplied `matrix` matches the dimensions of the grid AND every cell has the right number of characters
 * @param {GridConfig} config the grid configuration
 * @param {string[][]} matrix the grid matrix
 * @returns {boolean}
 */
export const IsGridMatrixValid = (
  config: GridConfig,
  matrix: string[][] | undefined,
) =>
  matrix !== undefined &&
  Array.isArray(matrix) &&
  matrix.length === config.MATRIX_ROWS.length &&
  matrix.every(
    (row) =>
      row.length === config.MATRIX_COLS.length &&
      row.every((cell) => cell.length === config.MATRIX_CELL_LENGTH),
  );

/**
 * Returns `true` if the supplied grid type is valid
 * @param {string} type the type of grid
 * @returns {boolean}
 */
export const IsGridTypeValid = (type: unknown): type is GridType =>
  GRID_TYPES.includes(type as GridType);

export type CustomGridConfigProblem =
  | "columns"
  | "rows"
  | "keySets"
  | "cellLength"
  | "challengePattern"
  | "inputSelector";

const IsCountValid = ({ keySet, count }: CustomGridConfig["columns"]) =>
  keySet in GRID_KEY_SETS &&
  Number.isInteger(count) &&
  count >= 1 &&
  count <= GRID_KEY_SETS[keySet].max;

/**
 * Returns what's wrong with a custom grid configuration
 * @param {CustomGridConfig} config the custom grid configuration
 * @returns {CustomGridConfigProblem[]} the problems, or an empty array if the configuration is valid
 */
export const GetCustomGridConfigProblems = (
  config: CustomGridConfig | undefined,
): CustomGridConfigProblem[] => {
  if (config === undefined) {
    return ["columns", "rows", "cellLength"];
  }

  const problems: CustomGridConfigProblem[] = [];

  if (!IsCountValid(config.columns)) {
    problems.push("columns");
  }

  if (!IsCountValid(config.rows)) {
    problems.push("rows");
  }

  // one dimension has to be letters and the other numbers, or a cell like "11" or "AB" could be read more than one way
  if (
    (config.columns.keySet === "letters") ===
    (config.rows.keySet === "letters")
  ) {
    problems.push("keySets");
  }

  if (
    !Number.isInteger(config.cellLength) ||
    config.cellLength < 1 ||
    config.cellLength > MAX_CUSTOM_GRID_CELL_LENGTH
  ) {
    problems.push("cellLength");
  }

  if (config.challengePattern) {
    try {
      // a pattern that can match an empty string would never stop matching
      if (new RegExp(config.challengePattern).test("")) {
        problems.push("challengePattern");
      }
    } catch {
      problems.push("challengePattern");
    }
  }

  if (config.inputSelector && typeof document !== "undefined") {
    try {
      document.createDocumentFragment().querySelector(config.inputSelector);
    } catch {
      problems.push("inputSelector");
    }
  }

  return problems;
};

/**
 * Returns `true` if the supplied grid object is valid
 * @param {Partial<Grid>} grid the grid object
 * @returns {boolean}
 */
export const IsGridValid = (grid: Partial<Grid>): grid is Grid => {
  if (
    (grid.id ?? "").length === 0 ||
    (grid.title ?? "").length === 0 ||
    !IsGridTypeValid(grid.type)
  ) {
    return false;
  }

  if (grid.type === "custom") {
    const { config } = grid as Partial<CustomGrid>;
    if (GetCustomGridConfigProblems(config).length > 0) {
      return false;
    }
    return IsGridMatrixValid(
      GetGridConfig({ type: "custom", config: config! }),
      grid.matrix,
    );
  }

  return IsGridMatrixValid(GetGridConfig({ type: grid.type }), grid.matrix);
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
