import {
  type CustomGridConfig,
  type CustomGridConfigProblem,
  type GridKeySet,
  DEFAULT_RESPONSE_INPUT_FIELD_QUERY_SELECTOR,
  GRID_KEY_SET_NAMES,
  GRID_KEY_SETS,
  MAX_CUSTOM_GRID_CELL_LENGTH,
} from "@/utils/grids";

import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const KEY_SET_MESSAGES = {
  letters: "GridKeySet_Title_Letters",
  "numbers-from-0": "GridKeySet_Title_NumbersFrom0",
  "numbers-from-1": "GridKeySet_Title_NumbersFrom1",
} as const satisfies Record<GridKeySet, string>;

const SPACING = 2;

export default function CustomGridSettings({
  config,
  problems,
  onChange,
}: {
  config: CustomGridConfig;
  problems: CustomGridConfigProblem[];
  onChange: (config: CustomGridConfig) => void;
}) {
  const keysError = problems.includes("keySets")
    ? browser.i18n.getMessage("ManageGrid_Error_CustomGrid_KeySets")
    : undefined;

  const dimensionFields = (dimension: "columns" | "rows") => {
    const { keySet, count } = config[dimension];
    const isColumns = dimension === "columns";

    return (
      <Stack direction="row" spacing={SPACING}>
        <TextField
          select
          label={browser.i18n.getMessage(
            isColumns
              ? "ManageGrid_LabelText_ColumnKeys"
              : "ManageGrid_LabelText_RowKeys",
          )}
          size="small"
          fullWidth
          required
          value={keySet}
          error={keysError !== undefined}
          onChange={(event) =>
            onChange({
              ...config,
              [dimension]: {
                count,
                keySet: event.target.value as GridKeySet,
              },
            })
          }
        >
          {GRID_KEY_SET_NAMES.map((name) => (
            <MenuItem key={name} value={name}>
              {browser.i18n.getMessage(KEY_SET_MESSAGES[name])}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          type="number"
          label={browser.i18n.getMessage(
            isColumns
              ? "ManageGrid_LabelText_Columns"
              : "ManageGrid_LabelText_Rows",
          )}
          size="small"
          required
          sx={{ minWidth: "8rem" }}
          slotProps={{
            htmlInput: { min: 1, max: GRID_KEY_SETS[keySet].max },
          }}
          value={Number.isNaN(count) ? "" : count}
          error={problems.includes(dimension)}
          helperText={
            problems.includes(dimension)
              ? browser.i18n.getMessage(
                  "ManageGrid_Error_CustomGrid_CountWithPlaceholder",
                  String(GRID_KEY_SETS[keySet].max),
                )
              : undefined
          }
          onChange={(event) =>
            onChange({
              ...config,
              [dimension]: {
                keySet,
                count: parseInt(event.target.value, 10),
              },
            })
          }
        />
      </Stack>
    );
  };

  const firstCell =
    GRID_KEY_SETS[config.columns.keySet].keys(1)[0]! +
    GRID_KEY_SETS[config.rows.keySet].keys(1)[0]!;

  return (
    <Stack direction="column" spacing={SPACING}>
      {dimensionFields("columns")}
      {dimensionFields("rows")}
      {keysError && (
        <Typography variant="caption" color="error">
          {keysError}
        </Typography>
      )}
      <TextField
        type="number"
        label={browser.i18n.getMessage("ManageGrid_LabelText_CellLength")}
        size="small"
        required
        slotProps={{
          htmlInput: { min: 1, max: MAX_CUSTOM_GRID_CELL_LENGTH },
        }}
        value={Number.isNaN(config.cellLength) ? "" : config.cellLength}
        error={problems.includes("cellLength")}
        helperText={
          problems.includes("cellLength")
            ? browser.i18n.getMessage(
                "ManageGrid_Error_CustomGrid_CountWithPlaceholder",
                String(MAX_CUSTOM_GRID_CELL_LENGTH),
              )
            : undefined
        }
        onChange={(event) =>
          onChange({ ...config, cellLength: parseInt(event.target.value, 10) })
        }
      />
      <Accordion
        disableGutters
        variant="outlined"
        defaultExpanded={
          config.challengePattern !== "" || config.inputSelector !== ""
        }
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          {browser.i18n.getMessage("ManageGrid_LabelText_Advanced")}
        </AccordionSummary>
        <AccordionDetails>
          <Stack direction="column" spacing={SPACING}>
            <TextField
              label={browser.i18n.getMessage(
                "ManageGrid_LabelText_ChallengePattern",
              )}
              size="small"
              value={config.challengePattern}
              error={problems.includes("challengePattern")}
              helperText={browser.i18n.getMessage(
                problems.includes("challengePattern")
                  ? "ManageGrid_Error_CustomGrid_ChallengePattern"
                  : "ManageGrid_HelperText_ChallengePatternWithPlaceholder",
                firstCell,
              )}
              onChange={(event) =>
                onChange({ ...config, challengePattern: event.target.value })
              }
            />
            <TextField
              label={browser.i18n.getMessage(
                "ManageGrid_LabelText_InputSelector",
              )}
              size="small"
              value={config.inputSelector}
              error={problems.includes("inputSelector")}
              helperText={browser.i18n.getMessage(
                problems.includes("inputSelector")
                  ? "ManageGrid_Error_CustomGrid_InputSelector"
                  : "ManageGrid_HelperText_InputSelectorWithPlaceholder",
                DEFAULT_RESPONSE_INPUT_FIELD_QUERY_SELECTOR,
              )}
              onChange={(event) =>
                onChange({ ...config, inputSelector: event.target.value })
              }
            />
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
}
