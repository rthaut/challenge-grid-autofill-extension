import { useEffect, useState } from "react";

import useSettingsStore from "./useSettingsStore";

import useMediaQuery from "@mui/material/useMediaQuery";

export const useDarkMode = () => {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [settings] = useSettingsStore();

  const [value, setValue] = useState(false);

  useEffect(() => {
    setValue(settings?.forceDarkMode || prefersDarkMode);
  }, [settings, prefersDarkMode]);

  return value;
};

export default useDarkMode;
