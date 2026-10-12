// Checks the response fields of a test page against the expected response in
// its `#scenario` JSON when the form is submitted (by hand, or by the
// extension's auto-submit). A `response` of null means the extension should
// leave the fields empty (and show an error notification instead).
//
// A page that keeps its own copy of the field values, like a React app, sets
// `window.getScenarioValues` so the check uses the values the page saw.

const scenario = JSON.parse(document.getElementById("scenario").textContent);
const form = document.querySelector("form");
// the response fields are named "response" or "response1", "response2", ...
const inputs = [...form.querySelectorAll('input[name^="response"]')];
const result = document.getElementById("result");

// spaced out so the text can't be mistaken for a challenge (like "A1")
const spaced = (value) => value.split("").join(" ");

const check = (values) => {
  const actual = values.join("");
  const passed =
    scenario.response === null ? actual === "" : actual === scenario.response;

  result.className = passed ? "pass" : "fail";
  result.textContent = `${passed ? "Pass" : "Fail"}: ${
    actual === "" ? "the fields are empty" : `got ${spaced(actual)}`
  }`;
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  check(window.getScenarioValues?.() ?? inputs.map((input) => input.value));
});

form.addEventListener("reset", () => {
  result.className = "";
  result.textContent = "";
});
