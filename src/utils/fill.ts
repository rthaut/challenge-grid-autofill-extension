import { type Grid, GetGridsFromStorage } from "@/utils/grids";
import { type FrameFillResult } from "@/utils/messages";
import { ShowBasicNotification } from "@/utils/notifications";
import { GetSetting } from "@/utils/settings";
import {
  ChooseGridForShortcut,
  GetRememberedGridIdForUrl,
  OpenPopupToChooseGrid,
  RememberGridForUrl,
} from "@/utils/shortcut";

export interface FillOptions {
  // names the grid in error notifications, for when the keyboard shortcut chose it from several grids
  mentionGrid?: boolean;
}

// when no frame filled the grid, the most useful error to show: one from a frame that found a challenge wins over "missing challenge"
const ERROR_PRIORITY: FrameFillResult["status"][] = [
  "input-mismatch",
  "response-error",
  "invalid-grid",
  "missing-challenge",
];

/**
 * Returns the overall result of filling a grid in a tab, from the results of each frame
 * @param {FrameFillResult[]} results the result from each frame
 * @returns {FrameFillResult} "filled" if any frame filled the grid, otherwise the most useful error
 */
export const GetTabFillResult = (
  results: FrameFillResult[],
): FrameFillResult => {
  const filled = results.find((result) => result.status === "filled");
  if (filled) {
    return filled;
  }

  for (const status of ERROR_PRIORITY) {
    const result = results.find((result) => result.status === status);
    if (result) {
      return result;
    }
  }

  return { status: "missing-challenge" };
};

/**
 * Shows the notification for a fill that didn't work (nothing is shown for a fill that did)
 * @param {FrameFillResult} result the result of the fill
 * @param {Grid} grid the grid that was filled
 * @param {FillOptions} options the fill options
 */
const NotifyFillResult = (
  result: FrameFillResult,
  grid: Grid,
  { mentionGrid = false }: FillOptions,
) => {
  const notify = (title: string, message: string) =>
    ShowBasicNotification(
      title,
      mentionGrid
        ? message +
            "\n\n" +
            browser.i18n.getMessage(
              "Notifications_Message_ShortcutGridFailedWithPlaceholder",
              grid.title,
            )
        : message,
    );

  switch (result.status) {
    case "invalid-grid":
      return notify(
        browser.i18n.getMessage("Notifications_Title_InvalidGrid"),
        browser.i18n.getMessage("Notifications_Message_InvalidGrid", grid?.id),
      );

    case "missing-challenge":
      // TODO: come up with a way for the user to manually enter the challenge
      return notify(
        browser.i18n.getMessage("Notifications_Title_MissingChallenge"),
        browser.i18n.getMessage("Notifications_Message_MissingChallenge"),
      );

    case "response-error":
      return notify(
        browser.i18n.getMessage("Notifications_Title_ResponseError"),
        browser.i18n.getMessage(
          "Notifications_Message_ResponseError",
          result.challenge.join(" "),
        ),
      );

    case "input-mismatch":
      return notify(
        browser.i18n.getMessage("Notifications_Title_AutofillError"),
        browser.i18n.getMessage(
          "Notifications_Message_AutofillError",
          result.response,
        ),
      );
  }
};

/**
 * Injects the content script into every frame of the specified tab
 * @param {number} tabId the ID of the tab to target
 * @returns {Promise<number[]>} the IDs of the frames the script loaded in
 */
const InjectContentScript = async (tabId: number) => {
  const injectionResults = await browser.scripting.executeScript({
    target: { tabId, allFrames: true },
    files: ["/content-scripts/content.js"],
  });

  // NOTE: Chrome throws a runtime error on `executeScript` if the script fails to load/execute, but Firefox has an `error` property on the result for each frame instead, so only message the frames where the script loaded
  const frameIds = injectionResults
    .filter((result) => !("error" in result && result.error))
    .map((result) => result.frameId);
  if (!frameIds.length) {
    throw injectionResults.find((result) => "error" in result)?.error;
  }

  return frameIds;
};

/**
 * Injects the content script into every frame of the specified tab, attempts to autofill the supplied `grid`,
 * and shows a notification if no frame could fill it
 * @param {number} tabId the ID of the tab to target
 * @param {Grid} grid the grid object
 * @param {FillOptions} [options] the fill options
 * @returns {Promise<FrameFillResult|undefined>} the overall result, or `undefined` if the script couldn't be injected
 */
export const FillGridInTab = async (
  tabId: number,
  grid: Grid,
  options: FillOptions = {},
) => {
  let frameIds: number[];
  try {
    frameIds = await InjectContentScript(tabId);
  } catch (error) {
    // browsers block extensions from some pages, like their own pages and extension stores
    console.error("Failed to inject the content script:", error);
    await ShowBasicNotification(
      browser.i18n.getMessage("Notifications_Title_CantAccessPage"),
      browser.i18n.getMessage("Notifications_Message_CantAccessPage"),
      false,
    );
    return undefined;
  }

  try {
    const responses = await Promise.allSettled(
      frameIds.map(
        (frameId) =>
          browser.tabs.sendMessage(
            tabId,
            { action: "fill-grid", grid },
            { frameId },
          ) as Promise<FrameFillResult | undefined>,
      ),
    );

    const result = GetTabFillResult(
      responses.flatMap((response) =>
        response.status === "fulfilled" && response.value
          ? [response.value]
          : [],
      ),
    );

    if (result.status === "filled") {
      // so the keyboard shortcut can fill the same grid on this site
      const tab = await browser.tabs.get(tabId);
      await RememberGridForUrl(tab.url, grid.id);
    } else {
      await NotifyFillResult(result, grid, options);
    }

    return result;
  } catch (error) {
    console.error("Failed to fill grid in tab:", error);
  }
};

/**
 * Injects the content script into the active tab and attempts to autofill the supplied `grid`
 * @param {Grid} grid the grid object
 * @returns {Promise<FrameFillResult|undefined>} the overall result, or `undefined` if there was no tab to fill
 */
export const FillGridInActiveTab = async (grid: Grid) => {
  try {
    const activeTab = await browser.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => tabs[0]);

    if (activeTab && activeTab.id) {
      return await FillGridInTab(activeTab.id, grid);
    }
  } catch (error) {
    console.error("Failed to fill grid in active tab:", error);
  }
};

/**
 * Autofills the tab for the keyboard shortcut, with the only grid or the grid last filled on the tab's site,
 * opens the toolbar popup (or shows a notification) to choose a grid when it can't tell which to use,
 * and shows a notification when there's no grid, or (if enabled) which grid was used
 * @param {{id: number, url?: string}} tab the tab to fill
 * @returns {Promise<FrameFillResult|undefined>} the overall result, or `undefined` if no grid was filled
 */
export const FillGridWithShortcut = async (tab: {
  id: number;
  url?: string;
}) => {
  const choice = ChooseGridForShortcut(
    await GetGridsFromStorage(),
    await GetRememberedGridIdForUrl(tab.url),
  );

  switch (choice.status) {
    case "no-grids":
      await ShowBasicNotification(
        browser.i18n.getMessage("Notifications_Title_NoGrids"),
        browser.i18n.getMessage("Notifications_Message_NoGrids"),
        false,
      );
      return undefined;

    case "ambiguous":
      if (await OpenPopupToChooseGrid()) {
        return undefined;
      }
      await ShowBasicNotification(
        browser.i18n.getMessage("Notifications_Title_ChooseGrid"),
        browser.i18n.getMessage("Notifications_Message_ChooseGrid"),
        false,
      );
      return undefined;
  }

  const { grid, fromSeveral } = choice;
  const result = await FillGridInTab(tab.id, grid, {
    mentionGrid: fromSeveral,
  });

  if (
    result?.status === "filled" &&
    fromSeveral &&
    (await GetSetting("notifyShortcutGrid"))
  ) {
    await ShowBasicNotification(
      browser.i18n.getMessage("Notifications_Title_ShortcutGrid"),
      browser.i18n.getMessage(
        "Notifications_Message_ShortcutGridWithPlaceholder",
        grid.title,
      ),
      false,
    );
  }

  return result;
};
