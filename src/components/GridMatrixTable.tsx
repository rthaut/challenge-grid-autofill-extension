import { type GridConfig } from "@/utils/grids";
import OutlinedInput from "@mui/material/OutlinedInput";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import styled from "@mui/system/styled";

const StyledOutlinedInput = styled(OutlinedInput)({
  "& fieldset": {
    top: 0,
  },
  "& fieldset legend": {
    display: "none",
  },
});

export default function GridMatrixTable({
  cols,
  rows,
  cellLength,
  matrix,
  setMatrixCell,
}: {
  cols: GridConfig["matrixCols"];
  rows: GridConfig["matrixRows"];
  cellLength: GridConfig["matrixCellLength"];
  matrix: string[][] | undefined;
  setMatrixCell: (row: number, col: number, value: string) => void;
}) {
  console.log("config", { cols, rows, cellLength });
  console.log("matrix", matrix);

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ th: { border: 0 } }}>
            <TableCell align="center" padding="none" />
            {cols.map((col) => (
              <TableCell key={col} align="center" padding="none">
                {col}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex} sx={{ "td, th": { border: 0 } }}>
              <TableCell
                component="th"
                align="right"
                scope="row"
                variant="head"
              >
                {row}
              </TableCell>
              {cols.map((col, colIndex) => (
                <TableCell key={colIndex} align="center" padding="none">
                  <StyledOutlinedInput
                    color="primary"
                    inputProps={{ maxLength: cellLength }}
                    margin="none"
                    onChange={(event) =>
                      setMatrixCell(rowIndex, colIndex, event.target.value)
                    }
                    required
                    size="small"
                    sx={{ input: { textAlign: "center" } }}
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
