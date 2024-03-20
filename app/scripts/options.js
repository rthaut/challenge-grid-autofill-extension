import "./react-apps/fonts";

import * as React from "react";
import { createRoot } from "react-dom/client";

import OptionsApp from "./react-apps/OptionsApp";

const container = document.querySelector("#app");
const root = createRoot(container);
root.render(<OptionsApp />);
