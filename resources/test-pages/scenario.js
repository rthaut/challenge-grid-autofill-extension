// Checks the response fields of a test page against the expected response in
// its `#scenario` JSON. A `response` of null means the extension should leave
// the fields empty (and show an error notification instead).
//
// The extension's auto-submit calls `form.submit()`, which skips the submit
// event and reloads the page with the field values in the query string, so the
// values are checked from there on load as well.

const scenario = JSON.parse(document.getElementById("scenario").textContent);
const form = document.querySelector("form");
const inputs = [...form.querySelectorAll("input")];
const result = document.getElementById("result");

// spaced out so the text can't be mistaken for a challenge (like "A1")
const spaced = (value) => value.split("").join(" ");

const check = (values, how) => {
  const actual = values.join("");
  const passed =
    scenario.response === null ? actual === "" : actual === scenario.response;

  result.className = passed ? "pass" : "fail";
  result.textContent = `${passed ? "Pass" : "Fail"} (${how}): ${
    actual === "" ? "the fields are empty" : `got ${spaced(actual)}`
  }`;
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  check(
    inputs.map((input) => input.value),
    "submitted",
  );
});

form.addEventListener("reset", () => {
  result.className = "";
  result.textContent = "";
  history.replaceState(null, "", location.pathname);
});

const params = new URLSearchParams(location.search);
if (inputs.some((input) => params.has(input.name))) {
  check(
    inputs.map((input) => params.get(input.name) ?? ""),
    "auto-submitted",
  );
}
