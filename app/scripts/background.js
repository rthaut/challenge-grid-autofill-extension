import { debounce } from "debounce";

import { GRIDS_STORAGE_KEY, GetGrids, FillGridInActiveTab } from "utils/grid";

browser.runtime.onInstalled.addListener((details) => {
  console.log("Installation Details", details);
});

browser.runtime.onMessage.addListener((message, sender) => {
  // console.log("Background Runtime Message", sender, message);
  switch (message.action) {
    case "show-basic-notification":
      return ShowBasicNotification(message.notification);
  }
});

browser.storage.onChanged.addListener(
  debounce((changes, area) => {
    // console.log("Storage Changed", changes, area);
    if (area === "sync" && Object.keys(changes).includes(GRIDS_STORAGE_KEY)) {
      GenerateMenus();
    }
  }, 1000)
);

const ShowBasicNotification = ({ title, message }) =>
  browser.notifications.create({
    type: "basic",
    iconUrl: browser.runtime.getURL("images/icon-48.png"),
    title: browser.i18n.getMessage(
      "Notifications_Title_NameWithPlaceholder",
      title
    ),
    message:
      message + "\n\n" + browser.i18n.getMessage("Notifications_HelpMessage"),
  });

const GenerateMenus = async () => {
  await browser.contextMenus.removeAll();

  const grids = await GetGrids();

  grids.forEach((grid) => {
    const menu = {
      id: grid.id,
      title: browser.i18n.getMessage(
        "Menu_Title_AutofillGridWithPlaceholder",
        grid.title
      ),
      contexts: ["editable"],
      onclick: (evt) => FillGridInActiveTab(grid),
    };

    // console.log("Creating Menu", menu);
    browser.contextMenus.create(menu);
  });
};

GenerateMenus();