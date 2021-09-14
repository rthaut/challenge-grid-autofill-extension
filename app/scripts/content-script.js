import {
  GRID_CONFIGS,
  GetResponseForChallengeFromGridMatrix,
} from "utils/grids";
import { GetSetting } from "utils/settings";

browser.runtime.onMessage.addListener((message, sender) => {
  // console.log("Content Script Runtime Message", sender, message);
  switch (message.action) {
    case "fill-grid":
      return AutoFillGrid(message.grid);
  }
});

const ShowBasicNotification = (title, message) =>
  browser.runtime.sendMessage({
    action: "show-basic-notification",
    notification: {
      title,
      message,
    },
  });

const GetChallengeFromPage = (patterns) => {
  let challenges = [];

  const text = document.documentElement.innerText;

  let matches;
  for (const pattern of patterns) {
    matches = null;
    while ((matches = pattern.exec(text)) !== null) {
      if (matches.index === pattern.lastIndex) {
        pattern.lastIndex++;
      }

      if (matches.length === 1) {
        // no capture group(s); use just the full match
        challenges.push(matches[0]);
      } else if (matches.length > 1) {
        // one or more capture group(s); use just the capture group(s), not the full match
        challenges = [...challenges, ...matches.slice(1)];
      }
    }
  }

  if (!challenges.length) {
    console.warn("Failed to find challenge(s) in document text", text);
  }

  // console.log({ challenges });
  return challenges;
};

const AutoFillGrid = async (grid) => {
  const { matrix, type } = grid;

  const {
    CHALLENGE_PATTERNS: patterns,
    RESPONSE_INPUT_FIELD_QUERY_SELECTOR: querySelector,
  } = GRID_CONFIGS[type];

  // console.table(matrix);
  if (!matrix) {
    ShowBasicNotification(
      browser.i18n.getMessage("Notifications_Title_InvalidGrid"),
      browser.i18n.getMessage("Notifications_Message_InvalidGrid", grid?.id)
    );
    return;
  }

  const challenge = GetChallengeFromPage(patterns);
  if (!Array.isArray(challenge) || challenge.length < 1) {
    // TODO: come up with a way for the user to manually enter the challenge
    ShowBasicNotification(
      browser.i18n.getMessage("Notifications_Title_MissingChallenge"),
      browser.i18n.getMessage("Notifications_Message_MissingChallenge")
    );
    return;
  }

  const response = GetResponseForChallengeFromGridMatrix(
    type,
    challenge,
    matrix
  );
  if (response.length !== challenge.length) {
    ShowBasicNotification(
      browser.i18n.getMessage("Notifications_Title_ResponseError"),
      browser.i18n.getMessage(
        "Notifications_Message_ResponseError",
        challenge.join(" ")
      )
    );
    return;
  }

  const inputs = document.querySelectorAll(querySelector);
  if (inputs.length === 1) {
    // single input field
    inputs[0].setAttribute("value", response);
    inputs[0].value = response;
  } else if (inputs.length === response.length) {
    // multiple input fields, one for each response character
    inputs.forEach((input, i) => {
      input.setAttribute("value", response[i]);
      input.value = response[i];
    });
  } else {
    // either no input fields, or a mis-matched amount of input fields
    ShowBasicNotification(
      browser.i18n.getMessage("Notifications_Title_AutofillError"),
      browser.i18n.getMessage("Notifications_Message_AutofillError", response)
    );
    return;
  }

  if (await GetSetting("autoSubmitForm")) {
    const form = inputs[0].form;
    form.submit();
  }
};
