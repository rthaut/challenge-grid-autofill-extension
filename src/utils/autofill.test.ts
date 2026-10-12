import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  AutofillGridInDocument,
  FillResponseInputs,
  GetChallengeFromText,
} from "@/utils/autofill";
import { GetMatrixFromText, type Grid, type GridType } from "@/utils/grids";

const TEST_PAGES_DIR = "resources/test-pages";

interface Scenario {
  grid: string;
  type: GridType;
  response: string | null;
}

const loadTestPage = (name: string) =>
  new DOMParser().parseFromString(
    readFileSync(`${TEST_PAGES_DIR}/${name}`, "utf-8"),
    "text/html",
  );

const createInputs = (count: number) =>
  Array.from({ length: count }, () => document.createElement("input"));

describe("GetChallengeFromText", () => {
  const pattern = /([a-zA-Z]\d{1,2})/g;

  it("finds every cell in the order it appears", () => {
    expect(GetChallengeFromText("Enter [A1] [J10] [C3]:", [pattern])).toEqual([
      "A1",
      "J10",
      "C3",
    ]);
  });

  it("finds cells with no separators", () => {
    expect(GetChallengeFromText("A1B2C3", [pattern])).toEqual([
      "A1",
      "B2",
      "C3",
    ]);
  });

  it("uses the whole match when the pattern has no capture group", () => {
    expect(GetChallengeFromText("cell: A1", [/[A-Z]\d/g])).toEqual(["A1"]);
  });

  it("returns nothing when there is no challenge", () => {
    expect(GetChallengeFromText("Enter your password", [pattern])).toEqual([]);
  });

  it("finds the challenge again when the same pattern is reused", () => {
    GetChallengeFromText("A1 B2", [pattern]);

    expect(GetChallengeFromText("A1 B2", [pattern])).toEqual(["A1", "B2"]);
  });
});

describe("FillResponseInputs", () => {
  it("puts the whole response in a single input", () => {
    const inputs = createInputs(1);

    expect(FillResponseInputs(inputs, "XYZ")).toBe(true);
    expect(inputs[0]!.value).toBe("XYZ");
  });

  it("puts one character in each input when there is one per character", () => {
    const inputs = createInputs(3);

    expect(FillResponseInputs(inputs, "XYZ")).toBe(true);
    expect(inputs.map((input) => input.value)).toEqual(["X", "Y", "Z"]);
  });

  it("fills nothing when the number of inputs doesn't fit", () => {
    const inputs = createInputs(2);

    expect(FillResponseInputs(inputs, "XYZ")).toBe(false);
    expect(inputs.map((input) => input.value)).toEqual(["", ""]);
  });

  it("fills nothing when there are no inputs", () => {
    expect(FillResponseInputs([], "XYZ")).toBe(false);
  });
});

describe("AutofillGridInDocument", () => {
  // every test page with a #scenario is checked here; the rest are manual only
  const scenarios = readdirSync(TEST_PAGES_DIR)
    .filter(
      (name) =>
        name.endsWith(".html") &&
        readFileSync(`${TEST_PAGES_DIR}/${name}`, "utf-8").includes(
          'id="scenario"',
        ),
    )
    .map((name) => ({
      name,
      scenario: JSON.parse(
        loadTestPage(name).getElementById("scenario")!.textContent!,
      ) as Scenario,
    }));

  it("finds the test pages", () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(4);
  });

  it.each(scenarios)("$name", ({ name, scenario }) => {
    const document = loadTestPage(name);
    const grid: Grid = {
      id: "test",
      title: "Test",
      type: scenario.type,
      matrix: GetMatrixFromText(
        readFileSync(`resources/test-grids/${scenario.grid}`, "utf-8"),
        scenario.type,
      ),
    };

    const result = AutofillGridInDocument(document, grid);
    const values = [...document.querySelectorAll("form input")].map(
      (input) => (input as HTMLInputElement).value,
    );

    if (scenario.response === null) {
      expect(result.status).not.toBe("filled");
      expect(values.every((value) => value === "")).toBe(true);
    } else {
      expect(result.status).toBe("filled");
      expect(values.join("")).toBe(scenario.response);
    }
  });

  it("reports a missing challenge", () => {
    const document = new DOMParser().parseFromString(
      `<p>Enter your password</p><input type="password" />`,
      "text/html",
    );
    const grid: Grid = {
      id: "test",
      title: "Test",
      type: "entrust",
      matrix: GetMatrixFromText(
        readFileSync("resources/test-grids/Entrust.csv", "utf-8"),
        "entrust",
      ),
    };

    expect(AutofillGridInDocument(document, grid)).toEqual({
      status: "missing-challenge",
    });
  });
});
