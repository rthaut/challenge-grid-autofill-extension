import { useMemo } from "react";

import useDarkMode from "./useDarkMode";

import { createTheme } from "@mui/material/styles";

export const useTheme = () => {
  const darkMode = useDarkMode();
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          primary: {
            main: darkMode ? "#C6168D" : "#762B8A",
          },
          secondary: {
            main: "#2877D2",
          },
        },
      }),
    [darkMode]
  );

  return theme;
};

export default useTheme;
