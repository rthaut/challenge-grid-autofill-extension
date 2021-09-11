import { useMemo } from "react";

import useDarkMode from "./useDarkMode";

import { createTheme } from "@mui/material/styles";
import { indigo, purple } from "@mui/material/colors";

export const useTheme = () => {
  const darkMode = useDarkMode();
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          primary: {
            main: purple[darkMode ? "A200" : 700],
          },
          secondary: {
            main: indigo[darkMode ? "A200" : 700],
          },
        },
      }),
    [darkMode]
  );

  return theme;
};

export default useTheme;
