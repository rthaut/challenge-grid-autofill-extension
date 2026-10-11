import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { GetChallengeFromText } from "@/utils/autofill";
import {
  type CustomGridConfig,
  DEFAULT_CUSTOM_GRID_CONFIG,
  DEFAULT_RESPONSE_INPUT_FIELD_QUERY_SELECTOR,
  GetChallengePatternFromKeys,
  GetCustomGridConfigProblems,
  GetEmptyGridMatrix,
  GetGridConfig,
  GetMatrixFromText,
  GetResponseForChallenge,
  IsGridMatrixValid,
  IsGridValid,
  ResizeGridMatrix,
} from "@/utils/grids";

const readTestGrid = (name: string) =>
  readFileSync(`resources/test-grids/${name}`, "utf-8");

const ENTRUST = GetGridConfig({ type: "entrust" });
const DEEPNET = GetGridConfig({ type: "deepnet" });

// the setup from issue #11: 5x5, letters for columns, rows from 1, 3 characters per cell
const CUSTOM_CONFIG: CustomGridConfig = {
  ...DEFAULT_CUSTOM_GRID_CONFIG,
  cellLength: 3,
};
const CUSTOM = GetGridConfig({ type: "custom", config: CUSTOM_CONFIG });

describe("GetMatrixFromText", () => {
  it("reads a comma-separated grid", () => {
    const matrix = GetMatrixFromText(readTestGrid("Entrust.csv"), ENTRUST);

    expect(matrix).toHaveLength(10);
    expect(matrix.every((row) => row.length === 10)).toBe(true);
    expect(matrix[9]!.join("")).toBe("5XMQ536519");
  });

  it("skips a header row above the grid", () => {
    const matrix = GetMatrixFromText(
      readTestGrid("Basic with Headers.csv"),
      ENTRUST,
    );

    expect(matrix).toHaveLength(10);
    expect(matrix[0]!.join("")).toBe("LJZEMHXK3B");
  });

  it("ignores blank lines at the end of the file", () => {
    const matrix = GetMatrixFromText(readTestGrid("Basic 5x5.csv"), ENTRUST);

    expect(matrix).toHaveLength(5);
    expect(matrix[4]!.join("")).toBe("UVWXY");
  });

  it("reads tab-separated and single-quoted grids the same way", () => {
    expect(
      GetMatrixFromText(readTestGrid("Tab Separated.csv"), ENTRUST),
    ).toEqual(GetMatrixFromText(readTestGrid("Single Quotes.csv"), ENTRUST));
  });

  it("strips double quotes and a byte order mark, keeping empty cells", () => {
    const matrix = GetMatrixFromText(
      readTestGrid("Double-Quotes and Empty Cells.csv"),
      ENTRUST,
    );

    expect(matrix[0]!.slice(0, 3)).toEqual(["", "N", ""]);
  });

  it("drops columns beyond the grid's width", () => {
    const matrix = GetMatrixFromText(readTestGrid("Deepnet.csv"), ENTRUST);

    expect(matrix[0]).toHaveLength(10);
  });

  it("reads cells with more than one character", () => {
    const matrix = GetMatrixFromText(readTestGrid("Custom 5x5.csv"), CUSTOM);

    expect(matrix[3]![0]).toBe("OKO");
    expect(IsGridMatrixValid(CUSTOM, matrix)).toBe(true);
  });
});

describe("GetResponseForChallenge", () => {
  const entrust = GetMatrixFromText(readTestGrid("Entrust.csv"), ENTRUST);

  it("looks up each cell by column letter and row number", () => {
    expect(GetResponseForChallenge(["A1", "B2"], entrust, ENTRUST)).toEqual([
      "H",
      "P",
    ]);
  });

  it("handles two-digit rows", () => {
    expect(GetResponseForChallenge(["J10"], entrust, ENTRUST)).toEqual(["9"]);
  });

  it("accepts lowercase column letters", () => {
    expect(GetResponseForChallenge(["b2"], entrust, ENTRUST)).toEqual(["P"]);
  });

  it("uses the row keys of the grid type", () => {
    // Deepnet rows start at 0, so row "0" is the first row
    const deepnet = GetMatrixFromText(readTestGrid("Deepnet.csv"), DEEPNET);

    expect(GetResponseForChallenge(["A0", "A9"], deepnet, DEEPNET)).toEqual([
      deepnet[0]![0],
      deepnet[9]![0],
    ]);
  });

  it("returns whole cells for multi-character grids", () => {
    const custom = GetMatrixFromText(readTestGrid("Custom 5x5.csv"), CUSTOM);

    expect(GetResponseForChallenge(["A4", "B5", "A5"], custom, CUSTOM)).toEqual(
      ["OKO", "CWI", "INR"],
    );
  });

  it("returns null for a cell that isn't in the grid", () => {
    expect(GetResponseForChallenge(["A1", "K1"], entrust, ENTRUST)).toBeNull();
    expect(GetResponseForChallenge(["A11"], entrust, ENTRUST)).toBeNull();
  });

  it("returns null for an empty cell", () => {
    const matrix = entrust.map((row) => [...row]);
    matrix[0]![0] = "";

    expect(GetResponseForChallenge(["A1"], matrix, ENTRUST)).toBeNull();
  });

  it("finds cells when the columns are numbers and the rows are letters", () => {
    const config = GetGridConfig({
      type: "custom",
      config: {
        ...DEFAULT_CUSTOM_GRID_CONFIG,
        columns: { keySet: "numbers-from-1", count: 12 },
        rows: { keySet: "letters", count: 3 },
      },
    });
    const matrix = GetEmptyGridMatrix(config);
    matrix[2]![11] = "X";

    expect(GetResponseForChallenge(["12C"], matrix, config)).toEqual(["X"]);
  });
});

describe("GetChallengePatternFromKeys", () => {
  const find = (text: string, cols: string[], rows: string[]) =>
    GetChallengeFromText(text, [GetChallengePatternFromKeys(cols, rows)]);

  const LETTERS = ["A", "B", "C", "D", "E"];
  const ONE_TO_TEN = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

  it("finds separated cells in order", () => {
    expect(find("Enter A4, B5, A5", LETTERS, ONE_TO_TEN)).toEqual([
      "A4",
      "B5",
      "A5",
    ]);
  });

  it("finds cells with no separators", () => {
    expect(find("A1B2C3", LETTERS, ONE_TO_TEN)).toEqual(["A1", "B2", "C3"]);
  });

  it("prefers two-digit rows", () => {
    expect(find("A10 B1", LETTERS, ONE_TO_TEN)).toEqual(["A10", "B1"]);
  });

  it("matches lowercase letters", () => {
    expect(find("a4", LETTERS, ONE_TO_TEN)).toEqual(["a4"]);
  });

  it("ignores letters and numbers outside the grid", () => {
    expect(find("F1 A11 A0", LETTERS, ONE_TO_TEN)).toEqual([]);
  });

  it("ignores cells inside longer words", () => {
    expect(find("Step 2: see BA3", LETTERS, ONE_TO_TEN)).toEqual([]);
  });

  it("finds number-then-letter cells", () => {
    expect(find("1A 12C", ["1", "12"], ["A", "B", "C"])).toEqual(["1A", "12C"]);
  });
});

describe("GetGridConfig", () => {
  it("builds the columns and rows of a custom grid", () => {
    expect(CUSTOM.MATRIX_COLS).toEqual(["A", "B", "C", "D", "E"]);
    expect(CUSTOM.MATRIX_ROWS).toEqual(["1", "2", "3", "4", "5"]);
    expect(CUSTOM.MATRIX_CELL_LENGTH).toBe(3);
  });

  it("numbers rows from 0", () => {
    const config = GetGridConfig({
      type: "custom",
      config: {
        ...CUSTOM_CONFIG,
        rows: { keySet: "numbers-from-0", count: 3 },
      },
    });

    expect(config.MATRIX_ROWS).toEqual(["0", "1", "2"]);
  });

  it("uses the default field selector unless one is set", () => {
    expect(CUSTOM.RESPONSE_INPUT_FIELD_QUERY_SELECTOR).toBe(
      DEFAULT_RESPONSE_INPUT_FIELD_QUERY_SELECTOR,
    );
    expect(
      GetGridConfig({
        type: "custom",
        config: { ...CUSTOM_CONFIG, inputSelector: "#grid" },
      }).RESPONSE_INPUT_FIELD_QUERY_SELECTOR,
    ).toBe("#grid");
  });

  it("uses the custom challenge pattern instead of the keys when one is set", () => {
    const config = GetGridConfig({
      type: "custom",
      config: { ...CUSTOM_CONFIG, challengePattern: "Cell: ([A-E][1-5])" },
    });

    expect(
      GetChallengeFromText("A1 Cell: B2", config.CHALLENGE_PATTERNS),
    ).toEqual(["B2"]);
  });
});

describe("GetCustomGridConfigProblems", () => {
  it("accepts the default settings", () => {
    expect(GetCustomGridConfigProblems(DEFAULT_CUSTOM_GRID_CONFIG)).toEqual([]);
  });

  it("requires settings", () => {
    expect(GetCustomGridConfigProblems(undefined)).not.toEqual([]);
  });

  it("limits the number of columns and rows to the labels available", () => {
    expect(
      GetCustomGridConfigProblems({
        ...DEFAULT_CUSTOM_GRID_CONFIG,
        columns: { keySet: "letters", count: 27 },
        rows: { keySet: "numbers-from-1", count: 0 },
      }),
    ).toEqual(["columns", "rows"]);
  });

  it("rejects a count that isn't a whole number", () => {
    expect(
      GetCustomGridConfigProblems({
        ...DEFAULT_CUSTOM_GRID_CONFIG,
        columns: { keySet: "letters", count: NaN },
      }),
    ).toEqual(["columns"]);
  });

  it("needs letters for one dimension and numbers for the other", () => {
    expect(
      GetCustomGridConfigProblems({
        ...DEFAULT_CUSTOM_GRID_CONFIG,
        rows: { keySet: "letters", count: 5 },
      }),
    ).toEqual(["keySets"]);
    expect(
      GetCustomGridConfigProblems({
        ...DEFAULT_CUSTOM_GRID_CONFIG,
        columns: { keySet: "numbers-from-0", count: 5 },
      }),
    ).toEqual(["keySets"]);
  });

  it("limits the cell length", () => {
    expect(
      GetCustomGridConfigProblems({ ...CUSTOM_CONFIG, cellLength: 0 }),
    ).toEqual(["cellLength"]);
    expect(
      GetCustomGridConfigProblems({ ...CUSTOM_CONFIG, cellLength: 11 }),
    ).toEqual(["cellLength"]);
  });

  it("rejects a challenge pattern that isn't valid or matches nothing", () => {
    expect(
      GetCustomGridConfigProblems({ ...CUSTOM_CONFIG, challengePattern: "(" }),
    ).toEqual(["challengePattern"]);
    expect(
      GetCustomGridConfigProblems({ ...CUSTOM_CONFIG, challengePattern: "x*" }),
    ).toEqual(["challengePattern"]);
  });

  it("rejects a field selector that isn't valid CSS", () => {
    expect(
      GetCustomGridConfigProblems({
        ...CUSTOM_CONFIG,
        inputSelector: "input[",
      }),
    ).toEqual(["inputSelector"]);
  });
});

describe("IsGridMatrixValid", () => {
  const matrix = GetMatrixFromText(readTestGrid("Entrust.csv"), ENTRUST);

  it("accepts a complete grid", () => {
    expect(IsGridMatrixValid(ENTRUST, matrix)).toBe(true);
  });

  it("rejects an empty cell", () => {
    const withEmptyCell = matrix.map((row) => [...row]);
    withEmptyCell[4]![4] = "";

    expect(IsGridMatrixValid(ENTRUST, withEmptyCell)).toBe(false);
  });

  it("rejects a cell with the wrong number of characters", () => {
    const withLongCell = matrix.map((row) => [...row]);
    withLongCell[0]![0] = "AB";

    expect(IsGridMatrixValid(ENTRUST, withLongCell)).toBe(false);
  });

  it("rejects a grid with the wrong number of rows", () => {
    expect(IsGridMatrixValid(ENTRUST, matrix.slice(1))).toBe(false);
  });

  it("rejects an empty grid of the right size", () => {
    expect(IsGridMatrixValid(ENTRUST, GetEmptyGridMatrix(ENTRUST))).toBe(false);
  });
});

describe("ResizeGridMatrix", () => {
  it("keeps the values that still fit and empties the new cells", () => {
    const matrix = [
      ["A", "B"],
      ["C", "D"],
    ];
    const config = GetGridConfig({
      type: "custom",
      config: {
        ...DEFAULT_CUSTOM_GRID_CONFIG,
        columns: { keySet: "letters", count: 3 },
        rows: { keySet: "numbers-from-1", count: 1 },
      },
    });

    expect(ResizeGridMatrix(matrix, config)).toEqual([["A", "B", ""]]);
  });
});

describe("IsGridValid", () => {
  const custom = {
    id: "custom",
    title: "Custom",
    type: "custom" as const,
    config: CUSTOM_CONFIG,
    matrix: GetMatrixFromText(readTestGrid("Custom 5x5.csv"), CUSTOM),
  };

  it("accepts a complete custom grid", () => {
    expect(IsGridValid(custom)).toBe(true);
  });

  it("rejects a custom grid with invalid settings", () => {
    expect(
      IsGridValid({ ...custom, config: { ...CUSTOM_CONFIG, cellLength: 0 } }),
    ).toBe(false);
  });

  it("rejects a custom grid whose values don't match its settings", () => {
    expect(
      IsGridValid({ ...custom, config: { ...CUSTOM_CONFIG, cellLength: 2 } }),
    ).toBe(false);
  });

  it("rejects a grid with no title", () => {
    expect(IsGridValid({ ...custom, title: "" })).toBe(false);
  });
});
