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
// @ts-expect-error a plain script for the test pages, without types
import { trackInputs } from "../../resources/test-pages/tracked-inputs.js";

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

  it("fires bubbling input and change events, like typing does", () => {
    const form = document.createElement("form");
    const inputs = createInputs(2);
    form.append(...inputs);
    const events: string[] = [];
    form.addEventListener("input", (event) =>
      events.push(`input:${(event.target as HTMLInputElement).value}`),
    );
    form.addEventListener("change", (event) =>
      events.push(`change:${(event.target as HTMLInputElement).value}`),
    );

    FillResponseInputs(inputs, ["X", "Y"]);

    expect(events).toEqual(["input:X", "change:X", "input:Y", "change:Y"]);
  });

  it("fills inputs that a page tracks the way React does", () => {
    const inputs = createInputs(3);
    const getTrackedValues = trackInputs(inputs);

    FillResponseInputs(inputs, ["X", "Y", "Z"]);

    expect(getTrackedValues()).toEqual(["X", "Y", "Z"]);
  });

  it("can't fill a tracked input just by setting its value and firing an event", () => {
    // checks that the tracking in the test pages is as strict as React's
    const [input] = createInputs(1);
    const getTrackedValues = trackInputs([input]);

    input!.value = "X";
    input!.dispatchEvent(new Event("input", { bubbles: true }));

    expect(getTrackedValues()).toEqual([""]);
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

  it("fills the page that tracks its fields the way React does", () => {
    const page = loadTestPage("tracked-entrust-split.html");
    document.body.innerHTML = page.body.innerHTML;
    const getTrackedValues = trackInputs([
      ...document.querySelectorAll<HTMLInputElement>(
        'form input[name^="response"]',
      ),
    ]);
    const scenario = JSON.parse(
      page.getElementById("scenario")!.textContent!,
    ) as Scenario;

    const result = AutofillGridInDocument(document, loadTestGrid(scenario));

    expect(result.status).toBe("filled");
    expect(getTrackedValues().join("")).toBe(scenario.response);
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
