import "./react-apps/fonts";

import * as React from "react";
import { createRoot } from "react-dom/client";

import PopupApp from "./react-apps/PopupApp";

const container = document.querySelector("#app");
const root = createRoot(container);
root.render(<PopupApp />);
