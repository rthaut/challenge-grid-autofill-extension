export const GRIDS_STORAGE_KEY = "grids";

export const COLS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
export const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const EMPTY_MATRIX = new Array(10).fill("").map(() => new Array(10).fill(""));

export const GetGrids = async () => {
  const { [GRIDS_STORAGE_KEY]: grids } = await browser.storage.sync.get({
    [GRIDS_STORAGE_KEY]: [],
  });

  // console.log("Grids", grids);
  return grids;
};

export const GetGridByID = async (id) => {
  const grids = await GetGrids();

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

export const IsGridMatrixValid = (matrix) =>
  matrix.length === 10 &&
  matrix.every(
    (row) =>
      row.length === 10 && row.every((cell) => cell !== "" && cell.length === 1)
  );
