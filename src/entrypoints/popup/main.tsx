import "@/utils/fonts";

import { createRoot } from "react-dom/client";

import PopupApp from "./PopupApp";

const container = document.querySelector("#app")!;
const root = createRoot(container);
root.render(<PopupApp />);
