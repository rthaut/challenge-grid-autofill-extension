import {
  type Grid,
  GetGridConfig,
  GetResponseForChallenge,
} from "@/utils/grids";

export type AutofillResult =
  | { status: "filled"; inputs: HTMLInputElement[] }
  | { status: "invalid-grid" }
  | { status: "missing-challenge" }
  | { status: "response-error"; challenge: string[] }
  | { status: "input-mismatch"; response: string };

/**
 * Returns the challenge grid cells found in the supplied `text`
 * @param {string} text the text to search
 * @param {RegExp[]} patterns the challenge patterns (with the global flag)
 * @returns {string[]} the challenge grid cells, in the order they were found
 */
export const GetChallengeFromText = (text: string, patterns: RegExp[]) => {
  let challenges: string[] = [];

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

  return challenges;
};

/**
 * Fills the `response` (one value per challenge cell) into the `inputs`: all of it into a single input,
 * one cell per input, or one character per input
 * @param {HTMLInputElement[]} inputs the response input fields
 * @param {string[]} response the value of each challenge cell
 * @returns {boolean} `false` if the number of inputs doesn't fit the response
 */
export const FillResponseInputs = (
  inputs: HTMLInputElement[],
  response: string[],
) => {
  const joined = response.join("");

  let values: string[];
  if (inputs.length === 1) {
    values = [joined];
  } else if (inputs.length === response.length) {
    values = response;
  } else if (inputs.length === joined.length) {
    values = joined.split("");
  } else {
    // either no input fields, or a mis-matched amount of input fields
    return false;
  }

  inputs.forEach((input, i) => {
    input.setAttribute("value", values[i]!);
    input.value = values[i]!;
  });

  return true;
};

/**
 * Finds the challenge in the supplied `document` and fills in the response from the `grid`
 * @param {Document} document the document to fill
 * @param {Grid} grid the grid object
 * @returns {AutofillResult} what happened, so the caller can notify the user or submit the form
 */
export const AutofillGridInDocument = (
  document: Document,
  grid: Grid,
): AutofillResult => {
  if (!grid.matrix) {
    return { status: "invalid-grid" };
  }

  const config = GetGridConfig(grid);

  const text = document.documentElement.innerText;
  const challenge = GetChallengeFromText(text, config.CHALLENGE_PATTERNS);
  if (!challenge.length) {
    console.warn("Failed to find challenge(s) in document text:", text);
    return { status: "missing-challenge" };
  }

  const response = GetResponseForChallenge(challenge, grid.matrix, config);
  if (response === null) {
    return { status: "response-error", challenge };
  }

  const inputs = [
    ...document.querySelectorAll<HTMLInputElement>(
      config.RESPONSE_INPUT_FIELD_QUERY_SELECTOR,
    ),
  ];
  if (!FillResponseInputs(inputs, response)) {
    return { status: "input-mismatch", response: response.join("") };
  }

  return { status: "filled", inputs };
};
