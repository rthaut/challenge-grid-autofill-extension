import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";

import { type Grid, GetGridConfig, GetMatrixFromText } from "@/utils/grids";
import {
  ChooseGridForShortcut,
  GetRememberedGridIdForUrl,
  GetSiteFromUrl,
  RememberGridForUrl,
} from "@/utils/shortcut";

const entrustGrid = (id: string): Grid => ({
  id,
  title: id,
  type: "entrust",
  matrix: GetMatrixFromText(
    readFileSync("resources/test-grids/Entrust.csv", "utf-8"),
    GetGridConfig({ type: "entrust" }),
  ),
});

describe("GetSiteFromUrl", () => {
  it("uses the host, including the port", () => {
    expect(GetSiteFromUrl("https://login.example.com/grid?x=1")).toBe(
      "login.example.com",
    );
    expect(GetSiteFromUrl("http://localhost:3000/entrust-single.html")).toBe(
      "localhost:3000",
    );
  });

  it("treats all local files as one site", () => {
    expect(GetSiteFromUrl("file:///C:/pages/grid.html")).toBe("file:");
  });

  it("ignores pages a grid can't be filled on", () => {
    expect(GetSiteFromUrl("chrome://extensions")).toBeUndefined();
    expect(GetSiteFromUrl(undefined)).toBeUndefined();
    expect(GetSiteFromUrl("not a url")).toBeUndefined();
  });
});

describe("ChooseGridForShortcut", () => {
  const first = entrustGrid("first");
  const second = entrustGrid("second");

  it("uses the only grid", () => {
    expect(ChooseGridForShortcut([first], undefined)).toEqual({
      status: "chosen",
      grid: first,
    });
  });

  it("ignores grids that aren't valid", () => {
    expect(
      ChooseGridForShortcut([first, { ...second, title: "" }], undefined),
    ).toEqual({ status: "chosen", grid: first });
  });

  it("uses the grid last filled on the site when there are several", () => {
    expect(ChooseGridForShortcut([first, second], "second")).toEqual({
      status: "chosen",
      grid: second,
    });
  });

  it("doesn't guess between several grids", () => {
    expect(ChooseGridForShortcut([first, second], undefined)).toEqual({
      status: "ambiguous",
    });
    expect(ChooseGridForShortcut([first, second], "deleted")).toEqual({
      status: "ambiguous",
    });
  });

  it("reports when there are no grids", () => {
    expect(ChooseGridForShortcut([], undefined)).toEqual({
      status: "no-grids",
    });
  });
});

describe("RememberGridForUrl", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("remembers the grid for the page's site", async () => {
    await RememberGridForUrl("https://bank.example.com/login", "first");

    expect(
      await GetRememberedGridIdForUrl("https://bank.example.com/grid"),
    ).toBe("first");
  });

  it("keeps each site separate", async () => {
    await RememberGridForUrl("https://bank.example.com/", "first");
    await RememberGridForUrl("https://work.example.com/", "second");

    expect(await GetRememberedGridIdForUrl("https://bank.example.com/")).toBe(
      "first",
    );
    expect(await GetRememberedGridIdForUrl("https://work.example.com/")).toBe(
      "second",
    );
  });

  it("replaces the grid when a different one is filled on the site", async () => {
    await RememberGridForUrl("https://bank.example.com/", "first");
    await RememberGridForUrl("https://bank.example.com/", "second");

    expect(await GetRememberedGridIdForUrl("https://bank.example.com/")).toBe(
      "second",
    );
  });

  it("remembers nothing for pages without a site", async () => {
    await RememberGridForUrl("chrome://newtab", "first");

    expect(await GetRememberedGridIdForUrl("chrome://newtab")).toBeUndefined();
  });
});
