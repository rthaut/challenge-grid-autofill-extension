import * as React from "react";
import { useTitle } from "react-use";

import useGridStore from "@/hooks/useGridStore";
import useTheme from "@/hooks/useTheme";

import { FillGridInActiveTab } from "@/utils/fill";
import { type Grid, IsGridValid, OpenEditPage } from "@/utils/grids";
import { TakeChooseGridRequest } from "@/utils/shortcut";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";

import Alert from "@mui/material/Alert";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import { ThemeProvider } from "@mui/material/styles";

export default function PopupApp() {
  useTitle(browser.i18n.getMessage("BrowserActionTitle"));

  const theme = useTheme();

  const [grids] = useGridStore();

  // whether the keyboard shortcut opened the popup because it couldn't tell which grid to use
  const [choosingForShortcut, setChoosingForShortcut] = React.useState(false);
  React.useEffect(() => {
    TakeChooseGridRequest().then(setChoosingForShortcut);
  }, []);

  const optionsClickHandler = () =>
    browser.runtime.openOptionsPage().then(() => window.close());

  const createGridClickHandler = () => OpenEditPage();

  const editGridClickHandler = (id: string) => () => OpenEditPage(id);

  const fillGridClickHandler = (grid: Grid) => () =>
    FillGridInActiveTab(grid).then(() => window.close());

  // the up and down arrow keys move between the grids, from a grid or its edit button
  const gridListKeyDownHandler = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }

    const rows = [...event.currentTarget.children];
    const current = rows.findIndex((row) =>
      row.contains(document.activeElement),
    );
    const next =
      current === -1
        ? 0
        : (current + (event.key === "ArrowDown" ? 1 : -1) + rows.length) %
          rows.length;

    rows[next]?.querySelector<HTMLElement>(".MuiListItemButton-root")?.focus();
    event.preventDefault();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Paper
        elevation={0}
        sx={{
          // inset from the edges (like the hint), so rounded popup corners don't clip the focus outline
          "& .MuiList-root": { px: 1, py: 0.5 },
          "& .MuiList-root:last-of-type": { pb: 1 },
          "& .MuiListItemButton-root": { borderRadius: 1 },
          // outline the whole row (including any edit button) for keyboard focus, instead of a faint gray fill
          "& .MuiListItem-root:has(.MuiListItemButton-root.Mui-focusVisible)": {
            outline: 2,
            outlineColor: "primary.main",
            outlineOffset: -2,
            borderRadius: 1,
          },
          "& .MuiListItemButton-root.Mui-focusVisible": {
            bgcolor: "transparent",
          },
        }}
      >
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
            {choosingForShortcut && (
              // a fixed width so the hint reads well, and inset so it isn't clipped by rounded popup corners
              <Alert severity="info" sx={{ m: 1, width: "18rem" }}>
                {browser.i18n.getMessage("Popup_ChooseGridForShortcut_Text")}
              </Alert>
            )}
            <List dense disablePadding onKeyDown={gridListKeyDownHandler}>
              {grids.filter(IsGridValid).map((grid, index) => (
                <ListItem
                  key={grid.id}
                  disableGutters
                  secondaryAction={
                    <IconButton onClick={editGridClickHandler(grid.id)}>
                      <EditIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton
                    // so the grid can be chosen from the keyboard
                    autoFocus={choosingForShortcut && index === 0}
                    onClick={fillGridClickHandler(grid)}
                  >
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
