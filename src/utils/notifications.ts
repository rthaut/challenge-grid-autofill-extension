/**
 * Shows a basic notification with the extension's name and help message
 * @param {string} title the notification title (after the extension's name)
 * @param {string} message the notification message
 */
export const ShowBasicNotification = (title: string, message: string) =>
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
