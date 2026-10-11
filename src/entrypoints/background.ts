import type { Browser } from "wxt/browser";

import { FillGridInTab } from "@/utils/fill";
import {
  GRIDS_STORAGE_KEY,
  GetGridFromStorageByID,
  GetGridsFromStorage,
} from "@/utils/grids";
import { ShowBasicNotification } from "@/utils/notifications";
import {
  AUTOFILL_COMMAND,
  ChooseGridForShortcut,
  GetRememberedGridIdForUrl,
} from "@/utils/shortcut";

const OnMenuClicked = async (
  info: Browser.contextMenus.OnClickData,
  tab: Browser.tabs.Tab | undefined,
) => {
  if (!tab?.id) {
    return;
  }

  const grid = await GetGridFromStorageByID(info.menuItemId.toString());
  if (!grid) {
    return;
  }

  await FillGridInTab(tab.id, grid);
};

const CreateMenus = async () => {
  await browser.contextMenus.removeAll();

  if (!browser.contextMenus.onClicked.hasListener(OnMenuClicked)) {
    browser.contextMenus.onClicked.addListener(OnMenuClicked);
  }

  const grids = await GetGridsFromStorage();
  if (!grids.length) {
    return;
  }

  grids.forEach((grid) => {
    const menu = {
      id: grid.id,
      title: browser.i18n.getMessage(
        "Menu_Title_AutofillGridWithPlaceholder",
        grid.title,
      ),
      contexts: ["editable"],
    } satisfies Browser.contextMenus.CreateProperties;

    browser.contextMenus.create(menu);
  });
};

const OnAutofillCommand = async (tab: Browser.tabs.Tab | undefined) => {
  const target =
    tab?.id !== undefined
      ? tab
      : (await browser.tabs.query({ active: true, currentWindow: true }))[0];
  if (target?.id === undefined) {
    return;
  }

  const choice = ChooseGridForShortcut(
    await GetGridsFromStorage(),
    await GetRememberedGridIdForUrl(target.url),
  );

  switch (choice.status) {
    case "chosen":
      return FillGridInTab(target.id, choice.grid);

    case "no-grids":
      return ShowBasicNotification(
        browser.i18n.getMessage("Notifications_Title_NoGrids"),
        browser.i18n.getMessage("Notifications_Message_NoGrids"),
        false,
      );

    case "ambiguous":
      return ShowBasicNotification(
        browser.i18n.getMessage("Notifications_Title_ChooseGrid"),
        browser.i18n.getMessage("Notifications_Message_ChooseGrid"),
        false,
      );
  }
};

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    CreateMenus();
  });

  browser.commands.onCommand.addListener((command, tab) => {
    if (command === AUTOFILL_COMMAND) {
      OnAutofillCommand(tab);
    }
  });

  browser.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && Object.keys(changes).includes(GRIDS_STORAGE_KEY)) {
      CreateMenus();
    }
  });
});
