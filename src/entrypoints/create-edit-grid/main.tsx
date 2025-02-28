import "@/utils/fonts";

import { createRoot } from "react-dom/client";

import CreateEditGridApp from "./CreateEditGridApp";

const container = document.querySelector("#app")!;
const root = createRoot(container);
root.render(<CreateEditGridApp />);
