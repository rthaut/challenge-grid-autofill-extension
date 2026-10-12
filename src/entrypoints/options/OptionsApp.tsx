import * as React from "react";

import { useTitle } from "react-use";

import useSettingsStore from "@/hooks/useSettingsStore";
import useTheme from "@/hooks/useTheme";

import { AUTOFILL_COMMAND } from "@/utils/shortcut";

import HelpIcon from "@mui/icons-material/HelpCenter";
import KeyboardIcon from "@mui/icons-material/Keyboard";

import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormHelperText from "@mui/material/FormHelperText";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import { ThemeProvider } from "@mui/material/styles";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

const manifest = browser.runtime.getManifest();

// Firefox 137+ can open its shortcut settings; older versions and other browsers can't
const commands = browser.commands as typeof browser.commands & {
  openShortcutSettings?: () => Promise<void>;
};

const openShortcutSettings = () => {
  if (commands.openShortcutSettings) {
    return commands.openShortcutSettings();
  }

  return browser.tabs.create({
    url: import.meta.env.EDGE
      ? "edge://extensions/shortcuts"
      : "chrome://extensions/shortcuts",
  });
};

const canOpenShortcutSettings =
  !import.meta.env.FIREFOX || commands.openShortcutSettings !== undefined;

function ShortcutSetting() {
  // `null` until the shortcut is loaded, and "" when it isn't set
  const [shortcut, setShortcut] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = () =>
      browser.commands
        .getAll()
        .then((all) =>
          setShortcut(
            all.find((command) => command.name === AUTOFILL_COMMAND)
              ?.shortcut ?? "",
          ),
        );

    load();
    // the shortcut may be changed in another tab
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, []);

  return (
    <ListItem divider>
      <ListItemIcon>
        <KeyboardIcon sx={{ color: "primary.main", fontSize: 32 }} />
      </ListItemIcon>
      <ListItemText disableTypography>
        <Typography>
          {browser.i18n.getMessage("Options_ShortcutLabel")}:{" "}
          <strong>
            {shortcut === null
              ? ""
              : shortcut || browser.i18n.getMessage("Options_ShortcutNotSet")}
          </strong>
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {browser.i18n.getMessage("Options_ShortcutDescription")}
        </Typography>
        {canOpenShortcutSettings ? (
          <Button
            size="small"
            variant="outlined"
            sx={{ mt: 1 }}
            onClick={openShortcutSettings}
          >
            {browser.i18n.getMessage("Options_ShortcutButtonText")}
          </Button>
        ) : (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            {browser.i18n.getMessage("Options_ShortcutFirefoxHelp")}
          </Typography>
        )}
      </ListItemText>
    </ListItem>
  );
}

export default function PopupApp() {
  useTitle(browser.i18n.getMessage("ExtensionName"));

  const theme = useTheme();

  const [settings, setSettings] = useSettingsStore();

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) =>
    setSettings((settings) => ({
      ...settings,
      [event.target.name]: event.target.checked,
    }));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Paper elevation={0} sx={{ minHeight: "100vh" }}>
        <List>
          {(["autoSubmitForm", "forceDarkMode"] as const).map((setting) => (
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
                      `Options_SettingLabel_${setting}`,
                    )}
                  />
                </FormGroup>
                <FormHelperText>
                  {browser.i18n.getMessage(
                    `Options_SettingDescription_${setting}`,
                  )}
                </FormHelperText>
              </FormControl>
            </ListItem>
          ))}
          <ShortcutSetting />
          <ListItem>
            <ListItemIcon>
              <HelpIcon sx={{ color: "primary.main", fontSize: 48 }} />
            </ListItemIcon>
            <ListItemText disableTypography>
              <Typography>
                {browser.i18n.getMessage("Options_BugEnhancement_QuestionText")}
              </Typography>
              {manifest.homepage_url !== undefined && (
                <Link
                  href={manifest.homepage_url.replace(/\/$/, "") + "/issues"}
                  target="_blank"
                >
                  {browser.i18n.getMessage("Options_BugEnhancement_LinkText")}
                </Link>
              )}
            </ListItemText>
          </ListItem>
        </List>
      </Paper>
    </ThemeProvider>
  );
}
