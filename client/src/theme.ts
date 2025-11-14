import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#000000", // Changed from blue to black
      contrastText: "#ffff00", // Yellow text on black background
    },
    secondary: {
      main: "#333333", // Dark grey for secondary elements
      contrastText: "#ffff00", // Yellow text
    },
    background: {
      default: "#e0e0e0", // Light grey background (instead of white)
      paper: "#f5f5f5", // Slightly lighter grey for paper/cards
    },
    text: {
      primary: "#000000", // Black text on light backgrounds
      secondary: "#424242", // Dark grey for secondary text
    },
    info: {
      main: "#000000",
      contrastText: "#ffff00",
    },
    success: {
      main: "#2e7d32", // Keep success colors reasonable
      contrastText: "#ffffff",
    },
    warning: {
      main: "#ed6c02",
      contrastText: "#000000",
    },
    error: {
      main: "#d32f2f",
      contrastText: "#ffffff",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: "#000000",
          color: "#ffff00",
          "&:hover": {
            backgroundColor: "#333333",
          },
        },
        outlined: {
          borderColor: "#000000",
          color: "#000000",
          "&:hover": {
            backgroundColor: "#f5f5f5",
            borderColor: "#333333",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#000000",
          color: "#ffff00",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: "#000000",
          color: "#ffff00",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#f5f5f5",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#f5f5f5",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          border: "1px solid #e0e0e0",
        },
      },
    },
  },
});

export default theme;
