import { AutofillGridInDocument } from "@/utils/autofill";
import { type Grid } from "@/utils/grids";
import { isRuntimeMessage } from "@/utils/messages";
import { GetSetting } from "@/utils/settings";

const ShowBasicNotification = (title: string, message: string) =>
  browser.runtime.sendMessage({
    action: "show-basic-notification",
    notification: {
      title,
      message,
    },
  });

const AutoFillGrid = async (grid: Grid) => {
  const result = AutofillGridInDocument(document, grid);

  switch (result.status) {
    case "invalid-grid":
      ShowBasicNotification(
        browser.i18n.getMessage("Notifications_Title_InvalidGrid"),
        browser.i18n.getMessage("Notifications_Message_InvalidGrid", grid?.id),
      );
      return;

    case "missing-challenge":
      // TODO: come up with a way for the user to manually enter the challenge
      ShowBasicNotification(
        browser.i18n.getMessage("Notifications_Title_MissingChallenge"),
        browser.i18n.getMessage("Notifications_Message_MissingChallenge"),
      );
      return;

    case "response-error":
      ShowBasicNotification(
        browser.i18n.getMessage("Notifications_Title_ResponseError"),
        browser.i18n.getMessage(
          "Notifications_Message_ResponseError",
          result.challenge.join(" "),
        ),
      );
      return;

    case "input-mismatch":
      ShowBasicNotification(
        browser.i18n.getMessage("Notifications_Title_AutofillError"),
        browser.i18n.getMessage(
          "Notifications_Message_AutofillError",
          result.response,
        ),
      );
      return;
  }

  if (await GetSetting("autoSubmitForm")) {
    const form = result.inputs[0]!.form;
    form?.submit();
  }
};

export default defineContentScript({
  registration: "runtime",
  async main() {
    browser.runtime.onMessage.addListener((message, _sender) => {
      if (isRuntimeMessage(message)) {
        switch (message.action) {
          case "fill-grid":
            return AutoFillGrid(message.grid);
        }
      }
    });
  },
});
