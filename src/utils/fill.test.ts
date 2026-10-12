import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";

import {
  FillGridInTab,
  FillGridWithShortcut,
  GetTabFillResult,
} from "@/utils/fill";
import {
  type Grid,
  GRIDS_STORAGE_KEY,
  GetGridConfig,
  GetMatrixFromText,
} from "@/utils/grids";
import { type FrameFillResult } from "@/utils/messages";
import { SETTINGS_STORAGE_KEY } from "@/utils/settings";
import { RememberGridForUrl } from "@/utils/shortcut";

const TAB = { id: 1, url: "https://bank.example.com/login" };

const entrustGrid = (id: string): Grid => ({
  id,
  title: `${id} grid`,
  type: "entrust",
  matrix: GetMatrixFromText(
    readFileSync("resources/test-grids/Entrust.csv", "utf-8"),
    GetGridConfig({ type: "entrust" }),
  ),
});

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

describe("notifications", () => {
  let executeScript: ReturnType<typeof vi.fn>;
  let sendMessage: ReturnType<typeof vi.fn>;
  let createNotification: ReturnType<typeof vi.fn>;

  // the title and message of each notification shown, with message keys in place of the translations
  const notifications = () =>
    createNotification.mock.calls.map(([options]) => ({
      title: options.title,
      message: options.message,
    }));

  const fillResult = (result: FrameFillResult) =>
    sendMessage.mockResolvedValue(result);

  const saveGrids = (...grids: Grid[]) =>
    fakeBrowser.storage.sync.set({ [GRIDS_STORAGE_KEY]: grids });

  beforeEach(() => {
    fakeBrowser.reset();

    vi.spyOn(fakeBrowser.i18n, "getMessage").mockImplementation(
      (key, substitutions) =>
        substitutions === undefined
          ? key
          : `${key}(${[substitutions].flat().join()})`,
    );
    vi.spyOn(fakeBrowser.runtime, "getURL").mockImplementation(
      (path: string) => path,
    );
    createNotification = vi
      .spyOn(fakeBrowser.notifications, "create")
      .mockResolvedValue("notification" as never) as never;
    executeScript = vi
      .spyOn(fakeBrowser.scripting, "executeScript")
      .mockResolvedValue([{ frameId: 0, documentId: "0" }] as never) as never;
    sendMessage = vi.spyOn(fakeBrowser.tabs, "sendMessage") as never;
    vi.spyOn(fakeBrowser.tabs, "get").mockResolvedValue(TAB as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("FillGridInTab", () => {
    it("explains when the browser won't let the extension run on the page", async () => {
      executeScript.mockRejectedValue(new Error("Cannot access contents"));

      expect(await FillGridInTab(TAB.id, entrustGrid("first"))).toBeUndefined();
      expect(sendMessage).not.toHaveBeenCalled();
      expect(notifications()).toEqual([
        {
          title:
            "Notifications_Title_NameWithPlaceholder(Notifications_Title_CantAccessPage)",
          message: "Notifications_Message_CantAccessPage",
        },
      ]);
    });

    it("shows nothing when the grid is filled", async () => {
      fillResult({ status: "filled" });

      expect(await FillGridInTab(TAB.id, entrustGrid("first"))).toEqual({
        status: "filled",
      });
      expect(notifications()).toEqual([]);
    });

    it("shows the error, without naming the grid, when the grid isn't filled", async () => {
      fillResult({ status: "missing-challenge" });

      await FillGridInTab(TAB.id, entrustGrid("first"));

      expect(notifications()).toEqual([
        {
          title:
            "Notifications_Title_NameWithPlaceholder(Notifications_Title_MissingChallenge)",
          message:
            "Notifications_Message_MissingChallenge\n\nNotifications_HelpMessage",
        },
      ]);
    });
  });

  describe("FillGridWithShortcut", () => {
    it("explains that there's no grid to fill with", async () => {
      expect(await FillGridWithShortcut(TAB)).toBeUndefined();
      expect(executeScript).not.toHaveBeenCalled();
      expect(notifications().map(({ message }) => message)).toEqual([
        "Notifications_Message_NoGrids",
      ]);
    });

    it("opens the toolbar popup to choose a grid when it can't tell which to use", async () => {
      await saveGrids(entrustGrid("first"), entrustGrid("second"));
      const openPopup = vi
        .spyOn(fakeBrowser.action, "openPopup")
        .mockResolvedValue(undefined);

      expect(await FillGridWithShortcut(TAB)).toBeUndefined();
      expect(openPopup).toHaveBeenCalled();
      expect(executeScript).not.toHaveBeenCalled();
      expect(notifications()).toEqual([]);
    });

    it("explains how to choose a grid when it can't tell which to use and can't open the popup", async () => {
      await saveGrids(entrustGrid("first"), entrustGrid("second"));
      vi.spyOn(fakeBrowser.action, "openPopup").mockRejectedValue(
        new Error("openPopup requires a user gesture"),
      );
      vi.spyOn(console, "info").mockImplementation(() => {});

      expect(await FillGridWithShortcut(TAB)).toBeUndefined();
      expect(executeScript).not.toHaveBeenCalled();
      expect(notifications().map(({ message }) => message)).toEqual([
        "Notifications_Message_ChooseGrid",
      ]);
    });

    it("doesn't name the only grid", async () => {
      await saveGrids(entrustGrid("first"));
      fillResult({ status: "filled" });

      expect(await FillGridWithShortcut(TAB)).toEqual({ status: "filled" });
      expect(notifications()).toEqual([]);
    });

    it("names the grid it chose from several", async () => {
      await saveGrids(entrustGrid("first"), entrustGrid("second"));
      await RememberGridForUrl(TAB.url, "second");
      fillResult({ status: "filled" });

      expect(await FillGridWithShortcut(TAB)).toEqual({ status: "filled" });
      expect(notifications()).toEqual([
        {
          title:
            "Notifications_Title_NameWithPlaceholder(Notifications_Title_ShortcutGrid)",
          message:
            "Notifications_Message_ShortcutGridWithPlaceholder(second grid)",
        },
      ]);
    });

    it("doesn't name the grid when that's turned off", async () => {
      await saveGrids(entrustGrid("first"), entrustGrid("second"));
      await RememberGridForUrl(TAB.url, "second");
      await fakeBrowser.storage.sync.set({
        [SETTINGS_STORAGE_KEY]: { notifyShortcutGrid: false },
      });
      fillResult({ status: "filled" });

      await FillGridWithShortcut(TAB);

      expect(notifications()).toEqual([]);
    });

    it("names the grid it chose from several when the fill fails", async () => {
      await saveGrids(entrustGrid("first"), entrustGrid("second"));
      await RememberGridForUrl(TAB.url, "second");
      fillResult({ status: "response-error", challenge: ["A1", "K1"] });

      expect(await FillGridWithShortcut(TAB)).toEqual({
        status: "response-error",
        challenge: ["A1", "K1"],
      });
      expect(notifications().map(({ message }) => message)).toEqual([
        "Notifications_Message_ResponseError(A1 K1)\n\n" +
          "Notifications_Message_ShortcutGridFailedWithPlaceholder(second grid)\n\n" +
          "Notifications_HelpMessage",
      ]);
    });
  });
});
