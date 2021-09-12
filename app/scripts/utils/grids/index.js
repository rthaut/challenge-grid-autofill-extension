import * as ENTRUST_GRID_CONFIG from "./configs/entrust";
import * as DEEPNET_GRID_CONFIG from "./configs/deepnet";

export const GRID_CONFIGS = {
  entrust: { ...ENTRUST_GRID_CONFIG },
  deepnet: { ...DEEPNET_GRID_CONFIG },
};

export const GRIDS_STORAGE_KEY = "grids";

export const GetGridsFromStorage = async () => {
  const { [GRIDS_STORAGE_KEY]: grids } = await browser.storage.sync.get({
    [GRIDS_STORAGE_KEY]: [],
  });

  // console.log("Grids", grids);
  return grids;
};

export const GetGridFromStorageByID = async (id) => {
  const grids = await GetGridsFromStorage();

  const grid = grids.find((grid) => grid.id === id);

  // console.log(id, grid);
  return grid;
};

export const FillGridInActiveTab = (grid) =>
  browser.tabs
    .query({
      active: true,
      currentWindow: true,
    })
    .then((tabs) =>
      browser.tabs.sendMessage(tabs[0].id, {
        action: "fill-grid",
        grid,
      })
    );

export const GetEmptyGridMatrix = (type) => {
  const { MATRIX_COLS: cols, MATRIX_ROWS: rows } = GRID_CONFIGS[type];

  return new Array(rows.length).fill(new Array(cols.length).fill(""));
};

/**
 * Returns the response to a challenge using the supplied grid matrix
 * @param {string} type the type of the grid
 * @param {string[]} challenge the array of challenge grid cells (in A# format)
 * @param {string[][]} matrix the grid matrix
 * @returns {string} the response for the challenge
 */
export const GetResponseForChallengeFromGridMatrix = (
  type,
  challenge,
  matrix
) => {
  const { MATRIX_COLS: cols, MATRIX_ROWS: rows } = GRID_CONFIGS[type];

  let response = "";

  challenge.forEach((c) => {
    const col = c[0];
    const row = c.split("").slice(1).join("");
    response += matrix[rows.indexOf(row)][cols.indexOf(col)];
  });

  // console.log({ response });
  return response;
};

export const IsGridMatrixValid = (type, matrix) => {
  const { MATRIX_COLS: cols, MATRIX_ROWS: rows } = GRID_CONFIGS[type];

  return (
    matrix.length === rows.length &&
    matrix.every(
      (row) =>
        row.length === cols.length &&
        row.every((cell) => cell !== "" && cell.length === 1)
    )
  );
};

export const IsGridTypeValid = (type) =>
  Object.keys(GRID_CONFIGS).includes(type);
