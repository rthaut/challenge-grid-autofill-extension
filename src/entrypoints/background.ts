import type { Menus, Tabs } from "wxt/browser";

import {
  GRIDS_STORAGE_KEY,
  GetGridFromStorageByID,
  GetGridsFromStorage,
  FillGridInTab,
} from "@/utils/grids";
import { isRuntimeMessage } from "@/utils/messages";

const OnMenuClicked = async (
  info: Menus.OnClickData,
  tab: Tabs.Tab | undefined,
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
    } satisfies Menus.CreateCreatePropertiesType;

    browser.contextMenus.create(menu);
  });
};

const ShowBasicNotification = ({
  title,
  message,
}: {
  title: string;
  message: string;
}) =>
  browser.notifications.create({
    type: "basic",
    iconUrl: browser.runtime.getURL("/icons/48.png"),
    title: browser.i18n.getMessage(
      "Notifications_Title_NameWithPlaceholder",
      title,
    ),
    message:
      message + "\n\n" + browser.i18n.getMessage("Notifications_HelpMessage"),
  });

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    CreateMenus();
  });

  browser.runtime.onMessage.addListener((message) => {
    if (isRuntimeMessage(message)) {
      switch (message.action) {
        case "show-basic-notification":
          return ShowBasicNotification(message.notification);
      }
    }
  });

  browser.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && Object.keys(changes).includes(GRIDS_STORAGE_KEY)) {
      CreateMenus();
    }
  });
});
