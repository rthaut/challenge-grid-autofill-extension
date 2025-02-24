import * as React from "react";

import useSettingsStore from "@/hooks/useSettingsStore";

import useMediaQuery from "@mui/material/useMediaQuery";

export const useDarkMode = () => {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [settings] = useSettingsStore();

  const [value, setValue] = React.useState(false);

  React.useEffect(() => {
    setValue(settings?.forceDarkMode || prefersDarkMode);
  }, [settings, prefersDarkMode]);

  return value;
};

export default useDarkMode;
