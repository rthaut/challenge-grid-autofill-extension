import type { Browser } from "wxt/browser";

import { FillGridInTab } from "@/utils/fill";
import {
  GRIDS_STORAGE_KEY,
  GetGridFromStorageByID,
  GetGridsFromStorage,
} from "@/utils/grids";

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

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    CreateMenus();
  });

  browser.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && Object.keys(changes).includes(GRIDS_STORAGE_KEY)) {
      CreateMenus();
    }
  });
});
