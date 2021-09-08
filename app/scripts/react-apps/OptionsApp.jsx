import React from "react";

import { useTitle } from "react-use";

import useSettingsStore from "./hooks/useSettingsStore";
import useTheme from "./hooks/useTheme";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormHelperText from "@mui/material/FormHelperText";
import Switch from "@mui/material/Switch";
import Paper from "@mui/material/Paper";

export default function PopupApp() {
  useTitle(browser.i18n.getMessage("AppName"));

  const theme = useTheme();

  const [settings, setSettings] = useSettingsStore();

  const handleChange = (event) =>
    setSettings((settings) => ({
      ...settings,
      [event.target.name]: event.target.checked,
    }));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Paper elevation={0} sx={{ minHeight: "100vh" }}>
        <List>
          {["autoSubmitForm", "forceDarkMode"].map((setting) => (
            <ListItem key={setting} divider>
              <FormControl component="fieldset" variant="standard">
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings[setting]}
                        name={setting}
                        onChange={handleChange}
                      />
                    }
                    label={browser.i18n.getMessage(
                      `Options_SettingLabel_${setting}`
                    )}
                  />
                </FormGroup>
                <FormHelperText>
                  {browser.i18n.getMessage(
                    `Options_SettingDescription_${setting}`
                  )}
                </FormHelperText>
              </FormControl>
            </ListItem>
          ))}
        </List>
      </Paper>
    </ThemeProvider>
  );
}
