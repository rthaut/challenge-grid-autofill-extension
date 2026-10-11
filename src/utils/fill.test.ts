import { describe, expect, it } from "vitest";

import { GetTabFillResult } from "@/utils/fill";

describe("GetTabFillResult", () => {
  it("succeeds when any frame filled the grid", () => {
    expect(
      GetTabFillResult([{ status: "missing-challenge" }, { status: "filled" }]),
    ).toEqual({ status: "filled" });
  });

  it("reports the error from a frame that found the challenge over frames that didn't", () => {
    expect(
      GetTabFillResult([
        { status: "missing-challenge" },
        { status: "input-mismatch", response: "XYZ" },
        { status: "missing-challenge" },
      ]),
    ).toEqual({ status: "input-mismatch", response: "XYZ" });
  });

  it("reports a missing challenge when no frame responded", () => {
    expect(GetTabFillResult([])).toEqual({ status: "missing-challenge" });
  });
});
