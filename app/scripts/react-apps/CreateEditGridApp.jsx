import React from "react";

import { nanoid } from "nanoid";
import { useMap, useTitle } from "react-use";

import useGridStore from "./hooks/useGridStore";
import useQueryParam from "./hooks/useQueryParam";
import useTheme from "./hooks/useTheme";

import { EMPTY_MATRIX, IsGridMatrixValid } from "../utils/grid";

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
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";

import GridTable from "./components/GridTable";
import PageHeader from "./components/PageHeader";

const SPACING = 2;

const HiddenFileInput = styled("input")({
  display: "none",
});

export default function CreateEditGridApp() {
  const theme = useTheme();

  const id = useQueryParam("id");

  // #region Snackbar
  const [snackbarMessage, setSnackbarMessage] = React.useState("");
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = React.useState("success");

  const resetSnackbar = () => {
    setSnackbarOpen(false);
    // setSnackbarMessage("");
    // setSnackbarSeverity("success");
  };

  const showSnackbarError = (message) => {
    setSnackbarSeverity("error");
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const showSnackbarSuccess = (message) => {
    setSnackbarSeverity("success");
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

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
        <Button
          onClick={closeConfirmDeleteDialog}
          variant="outlined"
          startIcon={<CancelIcon />}
          autoFocus
        >
          {browser.i18n.getMessage("ManageGrid_Prompt_ButtonText_Deny")}
        </Button>
        <Button
          onClick={deleteGrid}
          color="error"
          variant="outlined"
          startIcon={<DeleteIcon />}
        >
          {browser.i18n.getMessage("ManageGrid_Prompt_ButtonText_Confirm")}
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
      ? browser.i18n.getMessage("ManageGrid_Title_EditGridWithPlaceholder", id)
      : browser.i18n.getMessage("ManageGrid_Title_CreateGrid")
  );
  useTitle(pageTitle);

  const [isNewGrid, setIsNewGrid] = React.useState(true);

  const [grids, setGrids] = useGridStore();

  const [grid, { set: setGridProp, setAll: setAllGridProps }] = useMap({
    id: "",
    title: "",
    matrix: EMPTY_MATRIX,
  });

  React.useEffect(() => {
    if (id !== undefined && id !== null && id !== "") {
      const gridFromStorage = grids.find((g) => g.id === id);
      if (gridFromStorage !== undefined) {
        setIsNewGrid(false);
        setPageTitle(`Edit Grid "${gridFromStorage.title}"`);
        setAllGridProps(gridFromStorage);
      } else {
        // setPageTitle(browser.i18n.getMessage("ManageGrid_Title_CreateGrid"));
        // showSnackbarError(
        //   browser.i18n.getMessage("ManageGrid_Error_InvalidGridID")
        // );
      }
    }
  }, [id, grids]);

  const isGridValid = () =>
    IsGridMatrixValid(grid.matrix) && grid.title.length > 0;

  const setMatrixCell = (col, row, value) => {
    const { matrix } = grid;
    matrix[col][row] = value;
    setGridProp("matrix", matrix);
  };

  // #region CSV File Import
  const processGridFile = (file) =>
    new Promise((resolve, reject) => {
      if (file.type !== "text/csv") {
        reject(browser.i18n.getMessage("ManageGrid_Error_InvalidFileType"));
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        const data = event.target.result.toString();
        const matrix = data
          .split(/\r?\n/)
          .filter(Boolean)
          .map((row) =>
            row
              .split(",")
              .map((cell) => cell.trim())
              .filter(Boolean)
          );

        // console.table(matrix);
        setGridProp("matrix", matrix);

        if (!IsGridMatrixValid(matrix)) {
          reject(browser.i18n.getMessage("ManageGrid_Error_InvalidGridMatrix"));
        }

        resolve(true);
      };

      reader.onerror = reject;

      reader.readAsText(file);
    });

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    console.log(file);

    let isValid = false;
    try {
      isValid = await processGridFile(file);
    } catch (error) {
      isValid = false;
      showSnackbarError(
        browser.i18n.getMessage(
          "ManageGrid_Error_GenericWithPlaceholder",
          error
        )
      );
    }

    if (isValid) {
      if ((grid?.title ?? "") === "") {
        setGridProp("title", file.name.replace(".csv", ""));
      }
    }
  };
  // #endregion CSV File Import

  const handleGridSave = () => {
    // console.table(grid.matrix);
    if (isNewGrid) {
      const newId = nanoid();
      grid.id = newId;
      setGrids((grids) => [...grids, grid]);

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Paper elevation={0}>
        <PageHeader title={pageTitle} />
        <Container maxWidth="sm">
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
              <label htmlFor="csv-file-input">
                <HiddenFileInput
                  accept=".csv"
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
                  {browser.i18n.getMessage("ManageGrid_ButtonText_ImportCSV")}
                </Button>
              </label>
              <TextField
                label={browser.i18n.getMessage(
                  "ManageGrid_LabelText_GridTitle"
                )}
                size="small"
                required
                value={grid?.title ?? ""}
                onChange={(event) => setGridProp("title", event.target.value)}
              />
              <Divider />
              <GridTable grid={grid?.matrix} setMatrixCell={setMatrixCell} />
              <Divider />
              <Stack
                direction="row"
                justifyContent="center"
                alignItems="center"
                spacing={SPACING}
              >
                {!isNewGrid && (
                  <Button
                    variant="contained"
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
