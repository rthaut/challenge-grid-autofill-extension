import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  GetEmptyGridMatrix,
  GetMatrixFromText,
  GetResponseForChallengeFromGridMatrix,
  IsGridMatrixValid,
} from "@/utils/grids";

const readTestGrid = (name: string) =>
  readFileSync(`resources/test-grids/${name}`, "utf-8");

describe("GetMatrixFromText", () => {
  it("reads a comma-separated grid", () => {
    const matrix = GetMatrixFromText(readTestGrid("Entrust.csv"), "entrust");

    expect(matrix).toHaveLength(10);
    expect(matrix.every((row) => row.length === 10)).toBe(true);
    expect(matrix[9]).toEqual([
      "5",
      "X",
      "M",
      "Q",
      "5",
      "3",
      "6",
      "5",
      "1",
      "9",
    ]);
  });

  it("skips a header row above the grid", () => {
    const matrix = GetMatrixFromText(
      readTestGrid("Basic with Headers.csv"),
      "entrust",
    );

    expect(matrix).toHaveLength(10);
    expect(matrix[0]).toEqual([
      "L",
      "J",
      "Z",
      "E",
      "M",
      "H",
      "X",
      "K",
      "3",
      "B",
    ]);
  });

  it("reads tab-separated and single-quoted grids the same way", () => {
    expect(
      GetMatrixFromText(readTestGrid("Tab Separated.csv"), "entrust"),
    ).toEqual(GetMatrixFromText(readTestGrid("Single Quotes.csv"), "entrust"));
  });

  it("strips double quotes and a byte order mark, keeping empty cells", () => {
    const matrix = GetMatrixFromText(
      readTestGrid("Double-Quotes and Empty Cells.csv"),
      "entrust",
    );

    expect(matrix[0]!.slice(0, 3)).toEqual(["", "N", ""]);
  });

  it("drops columns beyond the grid's width", () => {
    const matrix = GetMatrixFromText(readTestGrid("Deepnet.csv"), "entrust");

    expect(matrix[0]).toHaveLength(10);
  });
});

describe("GetResponseForChallengeFromGridMatrix", () => {
  const matrix = GetMatrixFromText(readTestGrid("Entrust.csv"), "entrust");

  it("looks up each cell by column letter and row number", () => {
    expect(
      GetResponseForChallengeFromGridMatrix("entrust", ["A1", "B2"], matrix),
    ).toBe("HP");
  });

  it("handles two-digit rows", () => {
    expect(
      GetResponseForChallengeFromGridMatrix("entrust", ["J10"], matrix),
    ).toBe("9");
  });

  it("uses the row keys of the grid type", () => {
    // Deepnet rows start at 0, so row "0" is the first row
    const deepnet = GetMatrixFromText(readTestGrid("Deepnet.csv"), "deepnet");

    expect(
      GetResponseForChallengeFromGridMatrix("deepnet", ["A0"], deepnet),
    ).toBe(deepnet[0]![0]);
    expect(
      GetResponseForChallengeFromGridMatrix("deepnet", ["A9"], deepnet),
    ).toBe(deepnet[9]![0]);
  });
});

describe("IsGridMatrixValid", () => {
  const matrix = GetMatrixFromText(readTestGrid("Entrust.csv"), "entrust");

  it("accepts a complete grid", () => {
    expect(IsGridMatrixValid("entrust", matrix)).toBe(true);
  });

  it("rejects an empty cell", () => {
    const withEmptyCell = matrix.map((row) => [...row]);
    withEmptyCell[4]![4] = "";

    expect(IsGridMatrixValid("entrust", withEmptyCell)).toBe(false);
  });

  it("rejects a cell with more than one character", () => {
    const withLongCell = matrix.map((row) => [...row]);
    withLongCell[0]![0] = "AB";

    expect(IsGridMatrixValid("entrust", withLongCell)).toBe(false);
  });

  it("rejects a grid with the wrong number of rows", () => {
    expect(IsGridMatrixValid("entrust", matrix.slice(1))).toBe(false);
  });

  it("rejects an empty grid of the right size", () => {
    expect(IsGridMatrixValid("entrust", GetEmptyGridMatrix("entrust"))).toBe(
      false,
    );
  });
});
