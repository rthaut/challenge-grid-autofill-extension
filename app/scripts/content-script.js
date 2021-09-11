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

  let matches = null;
  for (const pattern of patterns) {
    matches = pattern.exec(text);
    if (matches !== null) {
      challenges = matches.slice(1);
      break;
    }
  }

  if (matches === null || !challenges.length) {
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
      browser.i18n.getMessage("Notifications_Message_InvalidGrid", id)
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

  const input = document.querySelector(querySelector);
  input.setAttribute("value", response);
  input.value = response;

  if (await GetSetting("autoSubmitForm")) {
    const form = input.form;
    form.submit();
  }
};
