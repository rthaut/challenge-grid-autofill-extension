import type { Browser } from "wxt/browser";

import { FillGridInTab, FillGridWithShortcut } from "@/utils/fill";
import {
  GRIDS_STORAGE_KEY,
  GetGridFromStorageByID,
  GetGridsFromStorage,
} from "@/utils/grids";
import { ShowBasicNotification } from "@/utils/notifications";
import { AUTOFILL_COMMAND } from "@/utils/shortcut";

const OnMenuClicked = async (
  info: Browser.contextMenus.OnClickData,
  tab: Browser.tabs.Tab | undefined,
) => {
  if (!tab?.id) {
    return;
  }

  const gridId = info.menuItemId.toString();
  const grid = await GetGridFromStorageByID(gridId);
  if (!grid) {
    return ShowBasicNotification(
      browser.i18n.getMessage("Notifications_Title_InvalidGrid"),
      browser.i18n.getMessage("Notifications_Message_InvalidGrid", gridId),
    );
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

  await FillGridWithShortcut({ id: target.id, url: target.url });
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
