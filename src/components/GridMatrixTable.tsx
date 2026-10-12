import { type GridConfig } from "@/utils/grids";

import OutlinedInput from "@mui/material/OutlinedInput";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { styled } from "@mui/material/styles";

const StyledOutlinedInput = styled(OutlinedInput)({
  "& fieldset": {
    top: 0,
  },
  "& fieldset legend": {
    display: "none",
  },
});

export default function GridMatrixTable({
  config,
  matrix,
  setMatrixCell,
}: {
  config: GridConfig;
  matrix: string[][] | undefined;
  setMatrixCell: (row: number, col: number, value: string) => void;
}) {
  const { MATRIX_COLS, MATRIX_ROWS, MATRIX_CELL_LENGTH } = config;

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ th: { border: 0 } }}>
            <TableCell align="center" padding="none" />
            {MATRIX_COLS.map((col) => (
              <TableCell key={col} align="center" padding="none">
                {col}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {MATRIX_ROWS.map((row, rowIndex) => (
            <TableRow key={rowIndex} sx={{ "td, th": { border: 0 } }}>
              <TableCell
                component="th"
                align="right"
                scope="row"
                variant="head"
              >
                {row}
              </TableCell>
              {MATRIX_COLS.map((col, colIndex) => (
                <TableCell key={colIndex} align="center" padding="none">
                  <StyledOutlinedInput
                    color="primary"
                    inputProps={{ maxLength: MATRIX_CELL_LENGTH }}
                    margin="none"
                    onChange={(event) =>
                      setMatrixCell(rowIndex, colIndex, event.target.value)
                    }
                    required
                    size="small"
                    sx={{
                      input: {
                        textAlign: "center",
                        // sized to the cell, since an input is about 20 characters wide by default
                        width: `${MATRIX_CELL_LENGTH + 1}ch`,
                      },
                    }}
                    value={matrix?.[rowIndex]?.[colIndex] ?? ""}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
