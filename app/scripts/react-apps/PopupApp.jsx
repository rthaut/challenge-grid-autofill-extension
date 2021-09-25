import React from "react";

import { useTitle } from "react-use";

import useGridStore from "./hooks/useGridStore";
import useTheme from "./hooks/useTheme";

import { FillGridInActiveTab, OpenEditPage } from "utils/grids";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";

export default function PopupApp() {
  useTitle(browser.i18n.getMessage("BrowserActionTitle"));

  const theme = useTheme();

  const [grids] = useGridStore();

  const optionsClickHandler = (_event) =>
    browser.runtime.openOptionsPage().then(() => window.close());

  const createGridClickHandler = (_event) => OpenEditPage();

  const editGridClickHandler = (id) => (_event) => OpenEditPage(id);

  const fillGridClickHandler = (grid) => (_event) =>
    FillGridInActiveTab(grid).then(() => window.close());

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Paper elevation={0}>
        <List dense disablePadding>
          <ListItem disableGutters>
            <ListItemButton onClick={optionsClickHandler}>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText
                primary={browser.i18n.getMessage("Popup_Options_Text")}
                sx={{ whiteSpace: "nowrap" }}
              />
            </ListItemButton>
          </ListItem>
          <ListItem disableGutters>
            <ListItemButton onClick={createGridClickHandler}>
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText
                primary={browser.i18n.getMessage("Popup_CreateGrid_Text")}
                sx={{ whiteSpace: "nowrap" }}
              />
            </ListItemButton>
          </ListItem>
        </List>
        {grids.length > 0 && (
          <>
            <Divider />
            <List dense disablePadding>
              {grids.map((grid) => (
                <ListItem
                  key={grid.id}
                  disableGutters
                  secondaryAction={
                    <IconButton onClick={editGridClickHandler(grid.id)}>
                      <EditIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton onClick={fillGridClickHandler(grid)}>
                    <ListItemText
                      primary={grid.title}
                      sx={{ whiteSpace: "nowrap" }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Paper>
    </ThemeProvider>
  );
}
