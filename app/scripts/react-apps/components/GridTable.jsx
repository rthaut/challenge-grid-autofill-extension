import React from "react";

import styled from "@mui/system/styled";
import OutlinedInput from "@mui/material/OutlinedInput";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import { COLS } from "../../utils/grid";

const StyledOutlinedInput = styled(OutlinedInput)({
  "& fieldset": {
    top: 0,
  },
  "& fieldset legend": {
    display: "none",
  },
});

export default function GridTable({ grid, setMatrixCell }) {
  const handleChange = (row, col) => (event) =>
    setMatrixCell(row, col, event.target.value);

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ th: { border: 0 } }}>
            <TableCell align="center" padding="none" />
            {COLS.map((letter) => (
              <TableCell key={letter} align="center" padding="none">
                {letter}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {grid.map((row, rowIndex) => (
            <TableRow key={rowIndex} sx={{ "td, th": { border: 0 } }}>
              <TableCell
                component="th"
                align="right"
                scope="row"
                variant="head"
              >
                {rowIndex + 1}
              </TableCell>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex} align="center" padding="none">
                  <StyledOutlinedInput
                    color="primary"
                    inputProps={{ maxLength: 1 }}
                    margin="none"
                    onChange={handleChange(rowIndex, cellIndex)}
                    required
                    size="small"
                    sx={{ input: { textAlign: "center" } }}
                    value={cell}
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
