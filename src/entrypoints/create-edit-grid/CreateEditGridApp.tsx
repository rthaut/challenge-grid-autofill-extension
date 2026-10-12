import * as React from "react";

import { nanoid } from "nanoid";
import { useMap, useTitle } from "react-use";

import CustomGridSettings from "@/components/CustomGridSettings";
import GridMatrixTable from "@/components/GridMatrixTable";
import PageHeader from "@/components/PageHeader";

import useGridStore from "@/hooks/useGridStore";
import useQueryParam from "@/hooks/useQueryParam";
import useTheme from "@/hooks/useTheme";

import {
  type CustomGrid,
  type CustomGridConfig,
  type Grid,
  type GridType,
  DEFAULT_CUSTOM_GRID_CONFIG,
  GetCustomGridConfigProblems,
  GetGridConfig,
  GetMatrixFromText,
  GRID_TYPES,
  IsGridMatrixValid,
  IsGridTypeValid,
  IsGridValid,
  ResizeGridMatrix,
} from "@/utils/grids";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";

import Alert, { type AlertProps } from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import CssBaseline from "@mui/material/CssBaseline";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Snackbar, { type SnackbarCloseReason } from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
import StepContent from "@mui/material/StepContent";
import Stepper from "@mui/material/Stepper";
import { styled, ThemeProvider } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

const GRID_TYPE_TITLE_MESSAGES = {
  entrust: "GridType_Title_Entrust",
  deepnet: "GridType_Title_Deepnet",
  custom: "GridType_Title_Custom",
} as const satisfies Record<GridType, string>;

const FILE_TYPES = [".csv", ".tsv", ".txt"];
const SPACING = 2;

const SETTINGS_STEP = 0;
const VALUES_STEP = 1;

const HiddenFileInput = styled("input")({
  display: "none",
});

type EditableGrid = {
  id: string;
  title: string;
  type: GridType | undefined;
  matrix: string[][];
  config?: CustomGridConfig;
};

const initialGrid: EditableGrid = {
  id: "",
  type: undefined,
  title: "",
  matrix: [[]],
};

/**
 * Returns the grid configuration for the grid being edited, or `undefined` if it doesn't have a type or valid custom settings yet
 */
const GetEditableGridConfig = (grid: EditableGrid) => {
  if (!IsGridTypeValid(grid.type)) {
    return undefined;
  }

  if (grid.type === "custom") {
    return GetCustomGridConfigProblems(grid.config).length === 0
      ? GetGridConfig({ type: "custom", config: grid.config! })
      : undefined;
  }

  return GetGridConfig({ type: grid.type });
};

export default function CreateEditGridApp() {
  const theme = useTheme();

  const id = useQueryParam("id");

  // #region Snackbar
  const [snackbarMessage, setSnackbarMessage] = React.useState("");
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarSeverity, setSnackbarSeverity] =
    React.useState<AlertProps["severity"]>("success");

  const resetSnackbar = () => {
    setSnackbarOpen(false);
    // TODO: these could be used too, but only AFTER the snackbar finishes transitioning out
    // setSnackbarMessage("");
    // setSnackbarSeverity("success");
  };

  const showSnackbar = (message: string, severity: AlertProps["severity"]) => {
    setSnackbarSeverity(severity);
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const showSnackbarError = (message: string) => showSnackbar(message, "error");
  const showSnackbarWarning = (message: string) =>
    showSnackbar(message, "warning");
  const showSnackbarSuccess = (message: string) =>
    showSnackbar(message, "success");

  const handleCloseSnackbar = (
    _event?: unknown,
    reason?: SnackbarCloseReason,
  ) => {
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
            grid.title,
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
        <Button
          onClick={(_event) => window.close()}
          variant="contained"
          autoFocus
        >
          {browser.i18n.getMessage("ManageGrid_Alert_ButtonText_Close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
  // #endregion GridDeletedAlert

  const [pageTitle, setPageTitle] = React.useState(
    id
      ? browser.i18n.getMessage("ManageGrid_Title_EditGrid")
      : browser.i18n.getMessage("ManageGrid_Title_CreateGrid"),
  );
  useTitle(pageTitle);

  const [isNewGrid, setIsNewGrid] = React.useState(true);
  const [activeStep, setActiveStep] = React.useState(SETTINGS_STEP);

  const [grids, setGrids, , storageError] = useGridStore();

  const [grid, { set: setGridProp, setAll: setAllGridProps }] =
    useMap<EditableGrid>(initialGrid);

  const config = GetEditableGridConfig(grid);
  const customGridProblems =
    grid.type === "custom" ? GetCustomGridConfigProblems(grid.config) : [];

  React.useEffect(() => {
    if (id !== undefined && id !== null && id !== "") {
      const gridFromStorage = grids.find((g) => g.id === id);
      if (gridFromStorage !== undefined) {
        setIsNewGrid(false);
        setActiveStep(VALUES_STEP);
        if (IsGridValid(gridFromStorage)) {
          setPageTitle(
            browser.i18n.getMessage(
              "ManageGrid_Title_EditGridWithPlaceholders",
              [
                gridFromStorage.title,
                browser.i18n.getMessage(
                  GRID_TYPE_TITLE_MESSAGES[gridFromStorage.type],
                ),
              ],
            ),
          );
        }
        setAllGridProps({ ...initialGrid, ...gridFromStorage } as EditableGrid);
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
      setGridProp("id", nanoid());
    }
  }, [isNewGrid]);

  React.useEffect(() => {
    if (storageError) {
      showSnackbarError(
        /quota/i.test(storageError)
          ? browser.i18n.getMessage("ManageGrid_Error_StorageQuota")
          : browser.i18n.getMessage(
              "ManageGrid_Error_GenericWithPlaceholder",
              storageError,
            ),
      );
    }
  }, [storageError]);

  const setGridType = (type: GridType) => {
    const gridConfig =
      type === "custom" ? DEFAULT_CUSTOM_GRID_CONFIG : undefined;
    setAllGridProps({
      ...grid,
      type,
      config: gridConfig,
      matrix: ResizeGridMatrix(
        [],
        GetGridConfig(
          type === "custom"
            ? { type, config: gridConfig! }
            : { type: type as Exclude<GridType, "custom"> },
        ),
      ),
    });
  };

  const setCustomGridConfig = (customConfig: CustomGridConfig) => {
    const problems = GetCustomGridConfigProblems(customConfig);
    setAllGridProps({
      ...grid,
      config: customConfig,
      // keep the values that still fit; leave the grid alone until the new size is valid
      matrix:
        problems.includes("columns") || problems.includes("rows")
          ? grid.matrix
          : ResizeGridMatrix(
              grid.matrix,
              GetGridConfig({ type: "custom", config: customConfig }),
            ),
    });
  };

  const setMatrixCell = (row: number, col: number, value: string) => {
    const matrix = grid.matrix.map((cells) => [...cells]);
    if (matrix[row] === undefined) {
      return;
    }
    matrix[row]![col] = value;
    setGridProp("matrix", matrix);
  };

  // #region CSV File Import
  const getMatrixFromFile = (file: Blob): Promise<string[][] | undefined> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const data = event?.target?.result?.toString();
          const matrix =
            data === undefined || config === undefined
              ? undefined
              : GetMatrixFromText(data, config);
          resolve(matrix);
        } catch (error) {
          console.error("Failed to parse file contents:", error);
          reject(browser.i18n.getMessage("ManageGrid_Error_ParseFailure"));
        }
      };

      reader.onerror = reject;

      reader.readAsText(file);
    });

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    resetSnackbar();

    const file = event?.target?.files?.[0];
    if (!file || config === undefined) {
      return;
    }

    if (!FILE_TYPES.some((ext) => file.name.endsWith(ext))) {
      showSnackbarError(
        browser.i18n.getMessage(
          "ManageGrid_Error_InvalidFileTypeWithPlaceholder",
          FILE_TYPES.join(", "),
        ),
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
      const matrix = ResizeGridMatrix(await getMatrixFromFile(file), config);

      setGridProp("matrix", matrix);

      if (!IsGridMatrixValid(config, matrix)) {
        showSnackbarWarning(
          browser.i18n.getMessage("ManageGrid_Error_InvalidGridMatrix"),
        );
      }
    } catch (error) {
      showSnackbarError(
        browser.i18n.getMessage(
          "ManageGrid_Error_GenericWithPlaceholder",
          String(error),
        ),
      );
    }
  };
  // #endregion CSV File Import

  const getGridToSave = (): Grid => {
    const { id, title, type, matrix } = grid;
    return type === "custom"
      ? ({ id, title, type, matrix, config: grid.config! } as CustomGrid)
      : ({ id, title, type, matrix } as Grid);
  };

  const handleGridSave = () => {
    const gridToSave = getGridToSave();

    if (isNewGrid) {
      setGrids((grids) => [...grids, gridToSave]);
      setIsNewGrid(false);

      showSnackbarSuccess(
        browser.i18n.getMessage("ManageGrid_Message_GridCreated"),
      );

      history.replaceState({}, "", location.pathname + `?id=${gridToSave.id}`);
    } else {
      setGrids((grids) =>
        grids.map((g) => (g.id === gridToSave.id ? gridToSave : g)),
      );

      showSnackbarSuccess(
        browser.i18n.getMessage("ManageGrid_Message_GridUpdated"),
      );
    }
  };

  const deleteGrid = () => {
    setConfirmGridDeleteDialogOpen(false);
    setGrids((grids) => grids.filter((g) => g.id !== grid.id));
    setAlertGridDeletedDialogOpen(true);
  };

  const settingsCaption =
    grid.type === undefined
      ? browser.i18n.getMessage(
          "ManageGrid_StepLabel_Caption_GridTypeNotSelected",
        )
      : customGridProblems.length > 0
        ? browser.i18n.getMessage(
            "ManageGrid_StepLabel_Error_CustomGridSettings",
          )
        : browser.i18n.getMessage(GRID_TYPE_TITLE_MESSAGES[grid.type]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Paper elevation={0}>
        <PageHeader title={pageTitle} />
        {/* as wide as the grid needs (but no narrower than a small screen), up to the width of the window */}
        <Container
          maxWidth={false}
          sx={(theme) => ({
            width: "fit-content",
            minWidth: `min(100%, ${theme.breakpoints.values.sm}px)`,
            maxWidth: "100%",
          })}
        >
          <Box
            component="form"
            noValidate
            autoComplete="off"
            sx={{ m: SPACING }}
          >
            <Stepper nonLinear activeStep={activeStep} orientation="vertical">
              <Step>
                <StepButton
                  onClick={() => setActiveStep(SETTINGS_STEP)}
                  optional={
                    <Typography
                      variant="caption"
                      color={
                        customGridProblems.length > 0
                          ? "error"
                          : "textSecondary"
                      }
                    >
                      {settingsCaption}
                    </Typography>
                  }
                >
                  {browser.i18n.getMessage("ManageGrid_StepLabel_GridSettings")}
                </StepButton>
                <StepContent>
                  {/* only the grid sets the page width, so long help text wraps instead */}
                  <Stack
                    direction="column"
                    spacing={SPACING}
                    sx={{ py: 1, contain: "inline-size" }}
                  >
                    {isNewGrid && (
                      <FormControl fullWidth size="small">
                        <InputLabel>
                          {browser.i18n.getMessage(
                            "ManageGrid_LabelText_GridType",
                          )}
                        </InputLabel>
                        <Select
                          label={browser.i18n.getMessage(
                            "ManageGrid_LabelText_GridType",
                          )}
                          required
                          value={grid.type ?? ""}
                          onChange={(event) =>
                            setGridType(event.target.value as GridType)
                          }
                        >
                          {GRID_TYPES.map((type) => (
                            <MenuItem key={type} value={type}>
                              {browser.i18n.getMessage(
                                GRID_TYPE_TITLE_MESSAGES[type],
                              )}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    {grid.type === "custom" && grid.config && (
                      <CustomGridSettings
                        config={grid.config}
                        problems={customGridProblems}
                        onChange={setCustomGridConfig}
                      />
                    )}
                    <Box>
                      <Button
                        variant="contained"
                        disabled={config === undefined}
                        onClick={() => setActiveStep(VALUES_STEP)}
                      >
                        {browser.i18n.getMessage("ManageGrid_ButtonText_Next")}
                      </Button>
                    </Box>
                  </Stack>
                </StepContent>
              </Step>
              <Step disabled={config === undefined}>
                <StepButton onClick={() => setActiveStep(VALUES_STEP)}>
                  {browser.i18n.getMessage("ManageGrid_StepLabel_GridValues")}
                </StepButton>
                <StepContent>
                  {config !== undefined && (
                    <Stack direction="column" spacing={SPACING} sx={{ py: 1 }}>
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
                            "ManageGrid_ButtonText_ImportCSV",
                          )}
                        </Button>
                      </label>
                      <TextField
                        label={browser.i18n.getMessage(
                          "ManageGrid_LabelText_GridTitle",
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
                        config={config}
                        matrix={grid.matrix}
                        setMatrixCell={setMatrixCell}
                      />
                      <Divider />
                      <Box>
                        <Button onClick={() => setActiveStep(SETTINGS_STEP)}>
                          {browser.i18n.getMessage(
                            "ManageGrid_ButtonText_Back",
                          )}
                        </Button>
                      </Box>
                    </Stack>
                  )}
                </StepContent>
              </Step>
            </Stepper>
            <Stack
              direction="row"
              spacing={SPACING}
              sx={{ justifyContent: "center", alignItems: "center", mt: 2 }}
            >
              {!isNewGrid && (
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  startIcon={<DeleteIcon />}
                  onClick={openConfirmDeleteDialog}
                >
                  {browser.i18n.getMessage("ManageGrid_ButtonText_DeleteGrid")}
                </Button>
              )}
              <Button
                variant="contained"
                fullWidth
                startIcon={<CheckCircleOutlineIcon />}
                disabled={!IsGridValid(getGridToSave())}
                onClick={handleGridSave}
              >
                {browser.i18n.getMessage(
                  isNewGrid
                    ? "ManageGrid_ButtonText_CreateGrid"
                    : "ManageGrid_ButtonText_UpdateGrid",
                )}
              </Button>
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
