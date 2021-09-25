import React from "react";
import PropTypes from "prop-types";

import { GRID_CONFIGS, IsGridTypeValid } from "utils/grids";

import styled from "@mui/system/styled";
import OutlinedInput from "@mui/material/OutlinedInput";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

const StyledOutlinedInput = styled(OutlinedInput)({
  "& fieldset": {
    top: 0,
  },
  "& fieldset legend": {
    display: "none",
  },
});

export default function GridMatrixTable({ type, matrix, setMatrixCell }) {
  if (!IsGridTypeValid(type)) {
    return null;
  }

  const { MATRIX_COLS, MATRIX_ROWS } = GRID_CONFIGS[type];

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
                    inputProps={{ maxLength: 1 }}
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

GridMatrixTable.propTypes = {
  type: PropTypes.string.isRequired,
  matrix: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
  setMatrixCell: PropTypes.func.isRequired,
};
