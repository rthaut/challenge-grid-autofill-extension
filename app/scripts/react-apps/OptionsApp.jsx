import React from "react";

import { useTitle } from "react-use";

import useSettingsStore from "./hooks/useSettingsStore";
import useTheme from "./hooks/useTheme";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormHelperText from "@mui/material/FormHelperText";
import Paper from "@mui/material/Paper";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

import HelpIcon from "@mui/icons-material/HelpCenter";

const manifest = browser.runtime.getManifest();

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
          <ListItem>
            <ListItemIcon>
              <HelpIcon sx={{ color: "primary.main", fontSize: 48 }} />
            </ListItemIcon>
            <ListItemText disableTypography>
              <Typography>
                {browser.i18n.getMessage("Options_BugEnhancement_QuestionText")}
              </Typography>
              <Link href={manifest.homepage_url.replace(/\/$/, "") + "/issues"} target="_blank">
                {browser.i18n.getMessage("Options_BugEnhancement_LinkText")}
              </Link>
            </ListItemText>
          </ListItem>
        </List>
      </Paper>
    </ThemeProvider>
  );
}
