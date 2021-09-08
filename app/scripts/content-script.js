import { COLS } from "./utils/grid";
import { GetSetting } from "./utils/settings";

const REGEX =
  /\[([a-zA-Z]\d{1,2})\].*\[([a-zA-Z]\d{1,2})\].*\[([a-zA-Z]\d{1,2})\]/;

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

const GetChallengeFromPage = () => {
  let challenges = [];

  const text = document.documentElement.innerText;

  const matches = REGEX.exec(text);
  if (matches !== null) {
    challenges = matches.slice(1);
  } else {
    console.warn("Failed to find challenge(s) in document text", text);
  }

  // console.log({ challenges });
  return challenges;
};

/**
 * Returns the response to a challenge using the supplied grid matrix
 * @param {string[]} challenge the array of challenge grid cells (in A# format)
 * @param {string[][]} matrix the grid matrix
 * @returns {string} the response for the challenge
 */
const GetResponseForChallengeFromGridMatrix = (challenge, matrix) => {
  let response = "";

  challenge.forEach((c) => {
    const col = c[0];
    const row = c.split("").slice(1).join("");
    response += matrix[parseInt(row, 10) - 1][COLS.indexOf(col)];
  });

  // console.log({ response });
  return response;
};

const AutoFillGrid = async (grid) => {
  const { matrix } = grid;
  // console.table(matrix);

  if (!matrix) {
    ShowBasicNotification(
      browser.i18n.getMessage("Notifications_Title_InvalidGrid"),
      browser.i18n.getMessage("Notifications_Message_InvalidGrid", id)
    );
    return;
  }

  const challenge = GetChallengeFromPage();
  if (!Array.isArray(challenge) || challenge.length < 1) {
    // TODO: come up with a way for the user to manually enter the challenge
    ShowBasicNotification(
      browser.i18n.getMessage("Notifications_Title_MissingChallenge"),
      browser.i18n.getMessage("Notifications_Message_MissingChallenge")
    );
    return;
  }

  const response = GetResponseForChallengeFromGridMatrix(challenge, matrix);
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

  const input = document.querySelector(`input[type="password"]`);
  input.setAttribute("value", response);
  input.value = response;

  if (await GetSetting("autoSubmitForm")) {
    const form = input.form;
    form.submit();
  }
};
