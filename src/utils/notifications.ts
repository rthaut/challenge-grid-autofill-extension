/**
 * Shows a basic notification with the extension's name
 * @param {string} title the notification title (after the extension's name)
 * @param {string} message the notification message
 * @param {boolean} [isProblem] whether to add the message about contacting the author (default: `true`)
 */
export const ShowBasicNotification = (
  title: string,
  message: string,
  isProblem = true,
) =>
  browser.notifications.create({
    type: "basic",
    iconUrl: browser.runtime.getURL("/icons/48.png"),
    title: browser.i18n.getMessage(
      "Notifications_Title_NameWithPlaceholder",
      title,
    ),
    message: isProblem
      ? message + "\n\n" + browser.i18n.getMessage("Notifications_HelpMessage")
      : message,
  });
