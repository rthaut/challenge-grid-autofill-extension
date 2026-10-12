import { type Grid } from "@/utils/grids";
import { type FrameFillResult } from "@/utils/messages";
import { ShowBasicNotification } from "@/utils/notifications";
import { RememberGridForUrl } from "@/utils/shortcut";

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
 */
const NotifyFillResult = (result: FrameFillResult, grid: Grid) => {
  switch (result.status) {
    case "invalid-grid":
      return ShowBasicNotification(
        browser.i18n.getMessage("Notifications_Title_InvalidGrid"),
        browser.i18n.getMessage("Notifications_Message_InvalidGrid", grid?.id),
      );

    case "missing-challenge":
      // TODO: come up with a way for the user to manually enter the challenge
      return ShowBasicNotification(
        browser.i18n.getMessage("Notifications_Title_MissingChallenge"),
        browser.i18n.getMessage("Notifications_Message_MissingChallenge"),
      );

    case "response-error":
      return ShowBasicNotification(
        browser.i18n.getMessage("Notifications_Title_ResponseError"),
        browser.i18n.getMessage(
          "Notifications_Message_ResponseError",
          result.challenge.join(" "),
        ),
      );

    case "input-mismatch":
      return ShowBasicNotification(
        browser.i18n.getMessage("Notifications_Title_AutofillError"),
        browser.i18n.getMessage(
          "Notifications_Message_AutofillError",
          result.response,
        ),
      );
  }
};

/**
 * Injects the content script into every frame of the specified tab, attempts to autofill the supplied `grid`,
 * and shows a notification if no frame could fill it
 * @param {number} tabId the ID of the tab to target
 * @param {Grid} grid the grid object
 * @returns {Promise<FrameFillResult|undefined>} the overall result, or `undefined` if the script couldn't be injected
 */
export const FillGridInTab = async (tabId: number, grid: Grid) => {
  try {
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
      await NotifyFillResult(result, grid);
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
