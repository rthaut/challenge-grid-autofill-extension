// Keeps a copy of each field's value the way React does, so a test page can
// check that the extension's fill reaches a page like this.
//
// React only updates its copy on `input` events. It also replaces the `value`
// setter on each field to remember values set by code, and ignores an `input`
// event when the field still holds the value it remembers, so setting
// `input.value` and then firing an event isn't enough either.

/**
 * Tracks the values of the `inputs`
 * @param {HTMLInputElement[]} inputs the fields to track
 * @param {(values: string[]) => void} [onChange] called with the tracked values when they change
 * @returns {() => string[]} returns the tracked values
 */
export const trackInputs = (inputs, onChange) => {
  const { get, set } = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  );
  const values = inputs.map((input) => get.call(input));

  inputs.forEach((input, i) => {
    let known = values[i];

    Object.defineProperty(input, "value", {
      configurable: true,
      get() {
        return get.call(this);
      },
      set(value) {
        known = String(value);
        set.call(this, value);
      },
    });

    input.addEventListener("input", () => {
      const current = get.call(input);
      if (current === known) {
        return;
      }
      known = current;
      values[i] = current;
      onChange?.([...values]);
    });
  });

  return () => [...values];
};
