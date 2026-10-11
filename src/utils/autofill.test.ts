import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  AutofillGridInDocument,
  FillResponseInputs,
  GetChallengeFromText,
} from "@/utils/autofill";
import {
  type CustomGridConfig,
  type Grid,
  type GridType,
  GetGridConfig,
  GetMatrixFromText,
} from "@/utils/grids";

const TEST_PAGES_DIR = "resources/test-pages";

interface Scenario {
  grid: string;
  type: GridType;
  config?: CustomGridConfig;
  response: string | null;
}

const loadTestPage = (name: string) =>
  new DOMParser().parseFromString(
    readFileSync(`${TEST_PAGES_DIR}/${name}`, "utf-8"),
    "text/html",
  );

const loadTestGrid = ({ grid, type, config }: Scenario): Grid => {
  const gridConfig =
    type === "custom"
      ? GetGridConfig({ type, config: config! })
      : GetGridConfig({ type });
  const matrix = GetMatrixFromText(
    readFileSync(`resources/test-grids/${grid}`, "utf-8"),
    gridConfig,
  );

  return type === "custom"
    ? { id: "test", title: "Test", type, config: config!, matrix }
    : { id: "test", title: "Test", type, matrix };
};

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

    expect(FillResponseInputs(inputs, ["NOT", "HPI"])).toBe(true);
    expect(inputs[0]!.value).toBe("NOTHPI");
  });

  it("puts one cell in each input when there is one per cell", () => {
    const inputs = createInputs(3);

    expect(FillResponseInputs(inputs, ["NOT", "HPI", "ZMY"])).toBe(true);
    expect(inputs.map((input) => input.value)).toEqual(["NOT", "HPI", "ZMY"]);
  });

  it("puts one character in each input when there is one per character", () => {
    const inputs = createInputs(6);

    expect(FillResponseInputs(inputs, ["NOT", "HPI"])).toBe(true);
    expect(inputs.map((input) => input.value).join(",")).toBe("N,O,T,H,P,I");
  });

  it("fills nothing when the number of inputs doesn't fit", () => {
    const inputs = createInputs(2);

    expect(FillResponseInputs(inputs, ["X", "Y", "Z"])).toBe(false);
    expect(inputs.map((input) => input.value)).toEqual(["", ""]);
  });

  it("fills nothing when there are no inputs", () => {
    expect(FillResponseInputs([], ["X", "Y", "Z"])).toBe(false);
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
    expect(scenarios.length).toBeGreaterThanOrEqual(6);
  });

  it.each(scenarios)("$name", ({ name, scenario }) => {
    const document = loadTestPage(name);

    const result = AutofillGridInDocument(document, loadTestGrid(scenario));
    const values = [
      ...document.querySelectorAll<HTMLInputElement>(
        'form input[name^="response"]',
      ),
    ].map((input) => input.value);
    const others = [
      ...document.querySelectorAll<HTMLInputElement>(
        'form input:not([name^="response"])',
      ),
    ].map((input) => input.value);

    if (scenario.response === null) {
      expect(result.status).not.toBe("filled");
      expect(values.every((value) => value === "")).toBe(true);
    } else {
      expect(result.status).toBe("filled");
      expect(values.join("")).toBe(scenario.response);
    }
    expect(others.every((value) => value === "")).toBe(true);
  });

  it("reports a missing challenge", () => {
    const document = new DOMParser().parseFromString(
      `<p>Enter your password</p><input type="password" />`,
      "text/html",
    );
    const grid = loadTestGrid({
      grid: "Entrust.csv",
      type: "entrust",
      response: null,
    });

    expect(AutofillGridInDocument(document, grid)).toEqual({
      status: "missing-challenge",
    });
  });

  it("reports a challenge cell that isn't in the grid", () => {
    const document = new DOMParser().parseFromString(
      `<p>Challenge: A1 K1</p><input type="password" />`,
      "text/html",
    );
    const grid = loadTestGrid({
      grid: "Entrust.csv",
      type: "entrust",
      response: null,
    });

    expect(AutofillGridInDocument(document, grid)).toEqual({
      status: "response-error",
      challenge: ["A1", "K1"],
    });
  });
});
