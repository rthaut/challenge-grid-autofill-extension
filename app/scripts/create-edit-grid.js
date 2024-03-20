import "./react-apps/fonts";

import * as React from "react";
import { createRoot } from "react-dom/client";

import CreateEditGridApp from "./react-apps/CreateEditGridApp";

const container = document.querySelector("#app");
const root = createRoot(container);
root.render(<CreateEditGridApp />);
