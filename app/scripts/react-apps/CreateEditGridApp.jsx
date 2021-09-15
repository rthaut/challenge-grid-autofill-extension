import React from "react";

import { nanoid } from "nanoid";
import { useMap, useTitle } from "react-use";

import useGridStore from "./hooks/useGridStore";
import useQueryParam from "./hooks/useQueryParam";
import useTheme from "./hooks/useTheme";

import {
  GRID_CONFIGS,
  GetEmptyGridMatrix,
  IsGridMatrixValid,
  IsGridTypeValid,
} from "utils/grids";

import { styled, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";

import GridMatrixTable from "./components/GridMatrixTable";
import PageHeader from "./components/PageHeader";

const FILE_TYPES = [".csv", ".tsv", ".txt"];
const SPACING = 2;

const HiddenFileInput = styled("input")({
  display: "none",
});

const initialGrid = {
  id: "",
  type:
    Object.keys(GRID_CONFIGS).length === 1 ? Object.keys(GRID_CONFIGS)[0] : "",
  title: "",
  matrix:
    Object.keys(GRID_CONFIGS).length === 1
      ? GetEmptyGridMatrix(Object.keys(GRID_CONFIGS)[0])
      : [[]],
};

export default function CreateEditGridApp() {
  const theme = useTheme();

  const id = useQueryParam("id");

  // #region Snackbar
  const [snackbarMessage, setSnackbarMessage] = React.useState("");
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = React.useState("success");

  const resetSnackbar = () => {
    setSnackbarOpen(false);
    // TODO: these could be used too, but only AFTER the snackbar finishes transitioning out
    // setSnackbarMessage("");
    // setSnackbarSeverity("success");
  };

  const showSnackbar = (message, severity) => {
    setSnackbarSeverity(severity);
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const showSnackbarError = (message) => showSnackbar(message, "error");
  const showSnackbarWarning = (message) => showSnackbar(message, "warning");
  const showSnackbarSuccess = (message) => showSnackbar(message, "success");

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    resetSnackbar();
  };
  // #endregion Snackbar

  // #region ConfirmGridDeleteDialog
  const [confirmGridDeleteDialogOpen, setConfirmGridDeleteDialogOpen] =
    React.useState(false);

  const closeConfirmDeleteDialog = () => setConfirmGridDeleteDialogOpen(false);
  const openConfirmDeleteDialog = () => setConfirmGridDeleteDialogOpen(true);

  const ConfirmGridDeleteDialog = () => (
    <Dialog
      open={confirmGridDeleteDialogOpen}
      onClose={closeConfirmDeleteDialog}
    >
      <DialogContent>
        <DialogContentText>
          {browser.i18n.getMessage(
            "ManageGrid_Prompt_ConfirmDeleteWithPlaceholder",
            grid.title
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={deleteGrid} color="error" variant="contained">
          {browser.i18n.getMessage("ManageGrid_Prompt_ButtonText_Confirm")}
        </Button>
        <Button
          onClick={closeConfirmDeleteDialog}
          color="inherit"
          variant="outlined"
          autoFocus
        >
          {browser.i18n.getMessage("ManageGrid_Prompt_ButtonText_Deny")}
        </Button>
      </DialogActions>
    </Dialog>
  );
  // #endregion ConfirmGridDeleteDialog

  // #region GridDeletedAlert
  const [alertGridDeletedDialogOpen, setAlertGridDeletedDialogOpen] =
    React.useState(false);

  const GridDeletedAlertDialog = () => (
    <Dialog open={alertGridDeletedDialogOpen}>
      <DialogContent>
        <DialogContentText>
          {browser.i18n.getMessage("ManageGrid_Alert_GridDeleted")}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={(evt) => window.close()} variant="contained" autoFocus>
          {browser.i18n.getMessage("ManageGrid_Alert_ButtonText_Close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
  // #endregion GridDeletedAlert

  const [pageTitle, setPageTitle] = React.useState(
    id
      ? browser.i18n.getMessage("ManageGrid_Title_EditGrid")
      : browser.i18n.getMessage("ManageGrid_Title_CreateGrid")
  );
  useTitle(pageTitle);

  const [isNewGrid, setIsNewGrid] = React.useState(true);

  const [grids, setGrids] = useGridStore();

  const [grid, { set: setGridProp, setAll: setAllGridProps }] =
    useMap(initialGrid);

  React.useEffect(() => {
    if (id !== undefined && id !== null && id !== "") {
      const gridFromStorage = grids.find((g) => g.id === id);
      if (gridFromStorage !== undefined) {
        setIsNewGrid(false);
        setPageTitle(
          browser.i18n.getMessage("ManageGrid_Title_EditGridWithPlaceholders", [
            gridFromStorage.title,
            browser.i18n.getMessage(`GridType_Title_${gridFromStorage.type}`),
          ])
        );
        setAllGridProps(gridFromStorage);
      } else {
        // setPageTitle(browser.i18n.getMessage("ManageGrid_Title_CreateGrid"));
        // showSnackbarError(
        //   browser.i18n.getMessage("ManageGrid_Error_InvalidGridID")
        // );
      }
    }
  }, [id, grids]);

  React.useEffect(() => {
    if (isNewGrid) {
      setGridProp(
        "matrix",
        IsGridTypeValid(grid?.type) ? GetEmptyGridMatrix(grid.type) : [[]]
      );
    }
  }, [grid?.type, isNewGrid]);

  const isGridValid = () =>
    IsGridTypeValid(grid.type) &&
    IsGridMatrixValid(grid.type, grid.matrix) &&
    grid.title.length > 0;

  const setMatrixCell = (row, col, value) => {
    const { matrix } = grid;
    matrix[row][col] = value;
    setGridProp("matrix", matrix);
  };

  // #region CSV File Import
  const getMatrixFromFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const data = event.target.result.toString();
          const matrix = data
            .replace(/\r?\n$/, "")
            .split(/\r?\n/)
            .slice(GRID_CONFIGS[grid.type]?.MATRIX_ROWS.length * -1) // take last # rows (dirty way to skip optional column headers)
            .map(
              (row) =>
                row
                  .split(/,|\t/)
                  .map((cell) => cell.replace(/\"|\'/g, "").trim())
                  .slice(0, GRID_CONFIGS[grid.type]?.MATRIX_COLS.length) // take first # columns
            );
          resolve(matrix);
        } catch (error) {
          console.error(error);
          reject(browser.i18n.getMessage("ManageGrid_Error_ParseFailure"));
        }
      };

      reader.onerror = reject;

      reader.readAsText(file);
    });

  const handleFileChange = async (event) => {
    resetSnackbar();

    const file = event.target.files[0];
    // console.log(file);

    if (!FILE_TYPES.some((ext) => file.name.endsWith(ext))) {
      showSnackbarError(
        browser.i18n.getMessage(
          "ManageGrid_Error_InvalidFileTypeWithPlaceholder",
          FILE_TYPES.join(", ")
        )
      );
      return;
    }

    if ((grid.title ?? "") === "") {
      let title = file.name;
      FILE_TYPES.forEach((ext) => {
        title = title.replace(ext, "");
      });
      setGridProp("title", title);
    }

    try {
      let csvMatrix = await getMatrixFromFile(file);
      const matrix = GetEmptyGridMatrix(grid.type).map((row, rowIndex) =>
        row.map((col, colIndex) => csvMatrix?.[rowIndex]?.[colIndex] ?? "")
      );

      // console.table(matrix);
      setGridProp("matrix", matrix);

      if (!IsGridMatrixValid(grid.type, matrix)) {
        showSnackbarWarning(
          browser.i18n.getMessage("ManageGrid_Error_InvalidGridMatrix")
        );
      }
    } catch (error) {
      showSnackbarError(
        browser.i18n.getMessage(
          "ManageGrid_Error_GenericWithPlaceholder",
          error
        )
      );
    }
  };
  // #endregion CSV File Import

  const handleGridSave = () => {
    // console.table(grid.matrix);
    if (isNewGrid) {
      const newId = nanoid();
      grid.id = newId;
      setGrids((grids) => [...grids, grid]);
      setIsNewGrid(false);

      showSnackbarSuccess(
        browser.i18n.getMessage("ManageGrid_Message_GridCreated")
      );

      history.replaceState({}, "", location.pathname + `?id=${newId}`);
    } else {
      setGrids((grids) => {
        grids.splice(
          grids.findIndex((g) => g.id === grid.id),
          1,
          grid
        );
        return grids;
      });

      showSnackbarSuccess(
        browser.i18n.getMessage("ManageGrid_Message_GridUpdated")
      );
    }
  };

  const deleteGrid = () => {
    setConfirmGridDeleteDialogOpen(false);
    setGrids((grids) => grids.filter((g) => g.id !== grid.id));
    setAlertGridDeletedDialogOpen(true);
  };

  const getContainerMaxWidth = () => {
    let maxWidth = "sm";
    if (IsGridTypeValid(grid.type)) {
      const cols = GRID_CONFIGS[grid.type]?.MATRIX_COLS.length;
      if (cols > 30) {
        maxWidth = "xl";
      } else if (cols > 20) {
        maxWidth = "lg";
      } else if (cols > 15) {
        maxWidth = "md";
      }
    }

    return maxWidth;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Paper elevation={0}>
        <PageHeader title={pageTitle} />
        <Container maxWidth={getContainerMaxWidth()}>
          <Box
            component="form"
            noValidate
            autoComplete="off"
            sx={{ m: SPACING }}
          >
            <Stack
              direction="column"
              justifyContent="flex-start"
              alignItems="stretch"
              spacing={SPACING}
              sx={{ pb: SPACING }}
            >
              {isNewGrid && (
                <FormControl fullWidth size="small">
                  <InputLabel>
                    {browser.i18n.getMessage("ManageGrid_LabelText_GridType")}
                  </InputLabel>
                  <Select
                    label={browser.i18n.getMessage(
                      "ManageGrid_LabelText_GridType"
                    )}
                    required
                    value={grid.type ?? ""}
                    onChange={(event) =>
                      setGridProp("type", event.target.value)
                    }
                  >
                    {Object.keys(GRID_CONFIGS).map((type) => (
                      <MenuItem key={type} value={type}>
                        {browser.i18n.getMessage(`GridType_Title_${type}`)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              {IsGridTypeValid(grid.type) && (
                <>
                  <label htmlFor="csv-file-input">
                    <HiddenFileInput
                      accept={FILE_TYPES.join()}
                      id="csv-file-input"
                      type="file"
                      onChange={handleFileChange}
                    />
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      startIcon={<UploadFileIcon />}
                    >
                      {browser.i18n.getMessage(
                        "ManageGrid_ButtonText_ImportCSV"
                      )}
                    </Button>
                  </label>
                  <TextField
                    label={browser.i18n.getMessage(
                      "ManageGrid_LabelText_GridTitle"
                    )}
                    size="small"
                    required
                    value={grid.title ?? ""}
                    onChange={(event) =>
                      setGridProp("title", event.target.value)
                    }
                  />
                  <Divider />
                  <GridMatrixTable
                    type={grid.type}
                    matrix={grid.matrix}
                    setMatrixCell={setMatrixCell}
                  />
                  <Divider />
                </>
              )}
              <Stack
                direction="row"
                justifyContent="center"
                alignItems="center"
                spacing={SPACING}
              >
                {!isNewGrid && (
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<DeleteIcon />}
                    onClick={openConfirmDeleteDialog}
                  >
                    {browser.i18n.getMessage(
                      "ManageGrid_ButtonText_DeleteGrid"
                    )}
                  </Button>
                )}
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<CheckCircleOutlineIcon />}
                  disabled={!isGridValid()}
                  onClick={handleGridSave}
                >
                  {browser.i18n.getMessage(
                    isNewGrid
                      ? "ManageGrid_ButtonText_CreateGrid"
                      : "ManageGrid_ButtonText_UpdateGrid"
                  )}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Container>
      </Paper>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleCloseSnackbar}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <ConfirmGridDeleteDialog />
      <GridDeletedAlertDialog />
    </ThemeProvider>
  );
}
