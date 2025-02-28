import AppBar from "@mui/material/AppBar";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

export default function PageHeader({ title }: { title: string }) {
  return (
    <AppBar elevation={0} color="inherit" position="static">
      <Toolbar disableGutters variant="dense">
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={2}
          width="100%"
        >
          <Typography variant="h6" align="center" sx={{ width: "100%" }}>
            {title}
          </Typography>
        </Stack>
      </Toolbar>
      <Divider />
    </AppBar>
  );
}
