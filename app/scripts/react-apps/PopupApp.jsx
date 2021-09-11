import React from "react";

import { useTitle } from "react-use";

import useGridStore from "./hooks/useGridStore";
import useTheme from "./hooks/useTheme";

import { FillGridInActiveTab } from "utils/grids";

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

  const openEditPage = (id = null) => {
    let url = browser.runtime.getURL("pages/create-edit-grid.html");
    if (id) {
      url += `?id=${id}`;
    }

    return browser.windows.create({
      url,
      type: "popup",
      width: 600,
      height: 820,
    });
  };

  const createGridClickHandler = (evt) => openEditPage();
  const editGridClickHandler = (id) => (evt) => openEditPage(id);
  const fillGridClickHandler = (grid) => (evt) => FillGridInActiveTab(grid);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Paper elevation={0}>
        <List dense disablePadding>
          <ListItem disableGutters>
            <ListItemButton
              onClick={(evt) => browser.runtime.openOptionsPage()}
            >
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
