import * as React from "react";

import { nanoid } from "nanoid";
import { useMap, useTitle } from "react-use";

import GridMatrixTable from "@/components/GridMatrixTable";
import PageHeader from "@/components/PageHeader";

import useGridStore from "@/hooks/useGridStore";
import useQueryParam from "@/hooks/useQueryParam";
import useTheme from "@/hooks/useTheme";

import {
  type CustomGrid,
  type Grid,
  type GridConfig,
  type GridDimensionConfig,
  type GridType,
  type StandardGrid,
  GRID_DIMENSION_CONFIGS,
  GRID_TYPES,
  GetConfigValuesWithDefaultsForGrid,
  GetEmptyGridMatrix,
  IsCustomGridConfigValidForMatrix,
  IsGridMatrixValid,
  IsGridTypeValid,
  IsGridValid,
  IsStandardGridType,
} from "@/utils/grids";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
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
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Snackbar, { type SnackbarCloseReason } from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import { type Breakpoint, styled, ThemeProvider } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

const FILE_TYPES = [".csv", ".tsv", ".txt"];
const SPACING = 2;

const HiddenFileInput = styled("input")({
  display: "none",
});

const initialGrid: Omit<Grid, "type"> & {
  type: GridType | undefined;
} = {
  id: "",
  type: undefined,
  title: "",
  matrix: [[]],
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

  const [grids, setGrids] = useGridStore();

  const [grid, { set: setGridProp, setAll: setGrid }] =
    useMap<Partial<Grid>>(initialGrid);

  const [config, { set: setConfigProp, setAll: setConfig }] =
    useMap<GridConfig>(GetConfigValuesWithDefaultsForGrid(grid));

  const [columnCount, setColumnCount] = useState(0);
  const [rowCount, setRowCount] = useState(0);

  const [columnKeys, setColumnKeys] = useState<GridDimensionConfig>("A-Z");
  const [rowKeys, setRowKeys] = useState<GridDimensionConfig>("1-9");

  // TODO: when grid dimensions change, we need to update `grid.matrix` to match the new dimensions (e.g. if we change the number of columns, we need to add/remove columns in the matrix)
  const onGridDimensionPropChange =
    (dimension: "column" | "row") =>
    ({ length, keys }: { length?: number; keys?: GridDimensionConfig }) => {
      switch (dimension) {
        case "column":
          if (length !== undefined) {
            setColumnCount(length);
          }
          if (keys !== undefined) {
            setColumnKeys(keys);
          }
          setConfigProp(
            "matrixCols",
            GRID_DIMENSION_CONFIGS[keys ?? columnKeys]?.apply(
              length ?? columnCount,
            ),
          );
          setConfigProp("challengePatterns", [
            new RegExp(
              `(${GRID_DIMENSION_CONFIGS[keys ?? columnKeys]?.pattern.source}${GRID_DIMENSION_CONFIGS[rowKeys]?.pattern.source})`,
              "g",
            ),
          ]);
          break;
        case "row":
          if (length !== undefined) {
            setRowCount(length);
          }
          if (keys !== undefined) {
            setRowKeys(keys);
          }
          setConfigProp(
            "matrixRows",
            GRID_DIMENSION_CONFIGS[keys ?? rowKeys]?.apply(length ?? rowCount),
          );
          setConfigProp("challengePatterns", [
            new RegExp(
              `(${GRID_DIMENSION_CONFIGS[columnKeys]?.pattern.source}${GRID_DIMENSION_CONFIGS[keys ?? rowKeys]?.pattern.source})`,
              "g",
            ),
          ]);
          break;
      }
    };

  React.useEffect(() => {
    if (id !== undefined && id !== null && id !== "") {
      const gridFromStorage = grids.find((g) => g.id === id);
      if (gridFromStorage !== undefined) {
        setIsNewGrid(false);
        setConfig(GetConfigValuesWithDefaultsForGrid(gridFromStorage));
        if (IsGridValid(gridFromStorage)) {
          setPageTitle(
            browser.i18n.getMessage(
              "ManageGrid_Title_EditGridWithPlaceholders",
              [
                gridFromStorage.title,
                browser.i18n.getMessage(
                  // @ts-expect-error - casing of `type` property is lowercase
                  `GridType_Title_${gridFromStorage.type}`,
                ),
              ],
            ),
          );
        }
        setGrid(gridFromStorage);
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

  const setMatrixCell = (row: number, col: number, value: string) => {
    console.log("Setting matrix cell", grid, row, col, value);
    let { matrix } = grid;
    if (matrix === undefined) {
      matrix = GetEmptyGridMatrix(config.matrixCols, config.matrixRows);
    }
    matrix[row][col] = value;
    setGridProp("matrix", matrix);
  };

  // #region CSV File Import
  const getMatrixFromFile = (file: Blob): Promise<string[][] | undefined> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const data = event?.target?.result?.toString();
          const matrix = data
            ?.replace(/(?:\r?\n)+$/, "") // remove empty line(s) at end of file
            .split(/\r?\n/)
            .slice(config.matrixRows.length * -1) // take last # rows (dirty way to skip optional column headers)
            .map(
              (row) =>
                row
                  .split(/,|\t/)
                  .map((cell) => cell.replace(/\"|\'/g, "").trim())
                  .slice(0, config.matrixCols.length), // take first # columns
            );
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
    if (!file) {
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
      let csvMatrix = await getMatrixFromFile(file);
      const matrix = GetEmptyGridMatrix(
        config.matrixCols,
        config.matrixRows,
      ).map((row, rowIndex) =>
        row.map((col, colIndex) => csvMatrix?.[rowIndex]?.[colIndex] ?? ""),
      );

      setGridProp("matrix", matrix);

      if (
        !IsGridMatrixValid(
          matrix,
          config.matrixCols.length,
          config.matrixRows.length,
          config.matrixCellLength,
        )
      ) {
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

  const handleGridSave = () => {
    const gridToSave = IsStandardGridType(grid.type)
      ? (grid as StandardGrid)
      : ({ ...grid, type: "custom", ...config } as CustomGrid);

    if (isNewGrid) {
      setGrids((grids) => [...grids, gridToSave]);
      setIsNewGrid(false);

      showSnackbarSuccess(
        browser.i18n.getMessage("ManageGrid_Message_GridCreated"),
      );

      history.replaceState({}, "", location.pathname + `?id=${gridToSave.id}`);
    } else {
      setGrids((grids) => {
        grids.splice(
          grids.findIndex((g) => g.id === gridToSave.id),
          1,
          gridToSave,
        );
        return grids;
      });

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

  const getContainerMaxWidth = () => {
    let maxWidth: Breakpoint = "sm";
    if (IsGridTypeValid(grid.type)) {
      const { matrixCols: cols } = config;
      if (cols.length > 30) {
        maxWidth = "xl";
      } else if (cols.length > 20) {
        maxWidth = "lg";
      } else if (cols.length > 15) {
        maxWidth = "md";
      }
    }

    return maxWidth;
  };

  const IsGridConfigStepFailed =
    grid.type !== undefined &&
    !IsStandardGridType(grid.type) &&
    !IsCustomGridConfigValidForMatrix(config);

  const CanModifyGrid =
    IsStandardGridType(grid.type) || IsCustomGridConfigValidForMatrix(config);

  const [activeStep, setActiveStep] = React.useState(0);
  const StepButtons = ({}) => (
    <>
      <Box sx={{ display: "flex", flexDirection: "row", pt: SPACING, pb: 0 }}>
        <Button
          disabled={activeStep === 0}
          onClick={() => setActiveStep((step) => step - 1)}
          sx={{ ml: 1 }}
        >
          {theme.direction === "rtl" ? (
            <KeyboardArrowRight />
          ) : (
            <KeyboardArrowLeft />
          )}
          Back
        </Button>
        <Box sx={{ flex: "1 1 auto" }} />
        <Button
          disabled={activeStep === 1}
          onClick={() => setActiveStep((step) => step + 1)}
          sx={{ mr: 1 }}
        >
          Next
          {theme.direction === "rtl" ? (
            <KeyboardArrowLeft />
          ) : (
            <KeyboardArrowRight />
          )}
        </Button>
      </Box>
    </>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Paper elevation={0}>
        <PageHeader title={pageTitle} />
        <Container maxWidth={getContainerMaxWidth()}>
          <StepButtons />
          <Box
            component="form"
            noValidate
            autoComplete="off"
            sx={{ m: SPACING }}
          >
            <Stepper activeStep={activeStep} orientation="vertical">
              <Step>
                <StepLabel
                  error={IsGridConfigStepFailed}
                  optional={
                    <Typography
                      variant="caption"
                      color={IsGridConfigStepFailed ? "error" : "textSecondary"}
                    >
                      {browser.i18n.getMessage(
                        // @ts-expect-error - casing of `type` property is lowercase
                        grid.type == undefined
                          ? "ManageGrid_StepLabel_Caption_GridTypeNotSelected"
                          : IsGridConfigStepFailed
                            ? "ManageGrid_StepLabel_Error_CustomGridConfig"
                            : `GridType_Title_${grid.type}`,
                      )}
                    </Typography>
                  }
                >
                  {browser.i18n.getMessage(
                    "ManageGrid_StepLabel_GridConfiguration",
                  )}
                </StepLabel>
                <StepContent>
                  <Stack
                    direction="column"
                    justifyContent="flex-start"
                    alignItems="stretch"
                    spacing={SPACING}
                    sx={{ py: SPACING }}
                  >
                    {isNewGrid && (
                      <TextField
                        select
                        label={browser.i18n.getMessage(
                          "ManageGrid_LabelText_GridType",
                        )}
                        size="small"
                        fullWidth
                        required
                        value={grid.type ?? ""}
                        onChange={(event) => {
                          const type = event.target.value as GridType;
                          setGridProp("type", type);
                          const config = GetConfigValuesWithDefaultsForGrid({
                            ...grid,
                            type,
                          });
                          setConfig(config);
                          if (IsStandardGridType(type)) {
                            setColumnCount(config.matrixCols.length);
                            setRowCount(config.matrixRows.length);
                            // TODO: currently there is no way to "determine" the keys used for a standard grid type (since the columns and rows are hardcoded in the config file); ideally we pivot to "storing" / "configuring" the GRID_DIMENSION_CONFIGS for columns and rows for both standard and custom grids, but until then, we just set them to the default values
                            setColumnKeys("A-Z");
                            setRowKeys("1-9");
                          } else {
                            setColumnCount(0);
                            setRowCount(0);
                            setColumnKeys("A-Z");
                            setRowKeys("1-9");
                          }
                        }}
                      >
                        {GRID_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>
                            {browser.i18n.getMessage(
                              // @ts-expect-error - casing of `type` property is lowercase
                              `GridType_Title_${type}`,
                            )}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                    {grid.type !== undefined && (
                      <>
                        <Stack
                          direction="row"
                          justifyContent="space-evenly"
                          alignItems="center"
                          spacing={SPACING}
                        >
                          <TextField
                            type="number"
                            label="Columns" // TODO: i18n
                            size="small"
                            fullWidth
                            required={!IsStandardGridType(grid.type)}
                            disabled={IsStandardGridType(grid.type)}
                            slotProps={{
                              htmlInput: {
                                min: 0,
                                max: GRID_DIMENSION_CONFIGS[columnKeys].max,
                              },
                            }}
                            value={columnCount}
                            onChange={(event) => {
                              const length = parseInt(event.target.value, 10);
                              onGridDimensionPropChange("column")({
                                length,
                              });
                            }}
                          />
                          <Typography
                            variant="body1"
                            color={
                              IsStandardGridType(grid.type)
                                ? "textDisabled"
                                : "textPrimary"
                            }
                          >
                            &#x2716;
                          </Typography>
                          <TextField
                            type="number"
                            label="Rows" // TODO: i18n
                            size="small"
                            fullWidth
                            required={!IsStandardGridType(grid.type)}
                            disabled={IsStandardGridType(grid.type)}
                            slotProps={{
                              htmlInput: {
                                min: 0,
                                max: GRID_DIMENSION_CONFIGS[rowKeys].max,
                              },
                            }}
                            value={rowCount}
                            onChange={(event) => {
                              const length = parseInt(event.target.value, 10);
                              onGridDimensionPropChange("row")({
                                length,
                              });
                            }}
                          />
                          <Typography
                            variant="body1"
                            color={
                              IsStandardGridType(grid.type)
                                ? "textDisabled"
                                : "textPrimary"
                            }
                          >
                            &#x2716;
                          </Typography>
                          <TextField
                            type="number"
                            label={browser.i18n.getMessage(
                              "ManageGrid_LabelText_CustomGrid_CellLength",
                            )}
                            size="small"
                            fullWidth
                            required={!IsStandardGridType(grid.type)}
                            disabled={IsStandardGridType(grid.type)}
                            slotProps={{
                              htmlInput: {
                                min: 0,
                                max: 5,
                              },
                            }}
                            value={config.matrixCellLength}
                            onChange={(event) =>
                              setConfigProp(
                                "matrixCellLength",
                                parseInt(event.target.value, 10),
                              )
                            }
                          />
                        </Stack>
                        <Stack
                          direction="row"
                          justifyContent="space-evenly"
                          alignItems="center"
                          spacing={SPACING}
                        >
                          <TextField
                            select
                            label="Column Keys" // TODO: i18n
                            helperText="Set the keys/labels for each column" // TODO: i18n
                            size="small"
                            fullWidth
                            required={!IsStandardGridType(grid.type)}
                            disabled={IsStandardGridType(grid.type)}
                            value={columnKeys}
                            onChange={(event) => {
                              const fillOption = event.target
                                .value as GridDimensionConfig;
                              onGridDimensionPropChange("column")({
                                keys: fillOption,
                              });
                            }}
                          >
                            {Object.entries(GRID_DIMENSION_CONFIGS).map(
                              ([key]) => (
                                <MenuItem key={key} value={key}>
                                  {key}
                                </MenuItem>
                              ),
                            )}
                          </TextField>
                          <TextField
                            select
                            label="Row Keys" // TODO: i18n
                            helperText="Set the keys/labels for each row" // TODO: i18n
                            size="small"
                            fullWidth
                            required={!IsStandardGridType(grid.type)}
                            disabled={IsStandardGridType(grid.type)}
                            value={rowKeys}
                            onChange={(event) => {
                              const fillOption = event.target
                                .value as GridDimensionConfig;
                              onGridDimensionPropChange("row")({
                                keys: fillOption,
                              });
                            }}
                          >
                            {Object.entries(GRID_DIMENSION_CONFIGS).map(
                              ([key]) => (
                                <MenuItem key={key} value={key}>
                                  {key}
                                </MenuItem>
                              ),
                            )}
                          </TextField>
                        </Stack>
                        <TextField
                          label="Query Selector" // TODO: i18n
                          size="small"
                          required={!IsStandardGridType(grid.type)}
                          disabled={IsStandardGridType(grid.type)}
                          value={config.responseInputFieldQuerySelector}
                          onChange={(event) =>
                            setConfigProp(
                              "responseInputFieldQuerySelector",
                              event.target.value,
                            )
                          }
                        />
                      </>
                    )}
                  </Stack>
                </StepContent>
              </Step>
              <Step>
                <StepLabel>
                  {browser.i18n.getMessage("ManageGrid_StepLabel_GridValues")}
                </StepLabel>
                <StepContent>
                  <Stack
                    direction="column"
                    justifyContent="flex-start"
                    alignItems="stretch"
                    spacing={SPACING}
                    sx={{ py: SPACING }}
                  >
                    {CanModifyGrid && (
                      <>
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
                        <Divider />
                        <GridMatrixTable
                          cols={config.matrixCols}
                          rows={config.matrixRows}
                          cellLength={config.matrixCellLength}
                          matrix={grid.matrix}
                          setMatrixCell={setMatrixCell}
                        />
                      </>
                    )}
                  </Stack>
                  <Divider sx={{ mb: SPACING }} />
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
                          "ManageGrid_ButtonText_DeleteGrid",
                        )}
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<CheckCircleOutlineIcon />}
                      disabled={!IsGridValid(grid, config)}
                      onClick={handleGridSave}
                    >
                      {browser.i18n.getMessage(
                        isNewGrid
                          ? "ManageGrid_ButtonText_CreateGrid"
                          : "ManageGrid_ButtonText_UpdateGrid",
                      )}
                    </Button>
                  </Stack>
                </StepContent>
              </Step>
            </Stepper>
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
