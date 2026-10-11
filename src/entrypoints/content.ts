import { AutofillGridInDocument } from "@/utils/autofill";
import { type Grid } from "@/utils/grids";
import { type FrameFillResult, isRuntimeMessage } from "@/utils/messages";
import { GetSetting } from "@/utils/settings";

declare global {
  interface Window {
    challengeGridAutofillListening?: boolean;
  }
}

const AutoFillGrid = async (grid: Grid): Promise<FrameFillResult> => {
  const result = AutofillGridInDocument(document, grid);

  if (result.status !== "filled") {
    return result;
  }

  if (await GetSetting("autoSubmitForm")) {
    // submit after this result is sent back, since submitting unloads the page;
    // requestSubmit() runs the page's submit handlers and validation, like clicking the submit button
    const form = result.inputs[0]!.form;
    setTimeout(() => form?.requestSubmit());
  }

  return { status: "filled" };
};

export default defineContentScript({
  registration: "runtime",
  async main() {
    // the script is injected again for every fill, but the frame only needs one listener
    if (window.challengeGridAutofillListening) {
      return;
    }
    window.challengeGridAutofillListening = true;

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
