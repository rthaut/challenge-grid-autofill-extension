import "@/utils/fonts";

import { createRoot } from "react-dom/client";

import OptionsApp from "./OptionsApp";

const container = document.querySelector("#app")!;
const root = createRoot(container);
root.render(<OptionsApp />);
