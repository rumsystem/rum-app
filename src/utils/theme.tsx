import React from 'react';
import { createTheme, StylesProvider, ThemeProvider } from '@material-ui/core';

const theme = createTheme({
  palette: {
    primary: {
      main: '#333',
      contrastText: '#fff',
    },
    secondary: {
      main: '#1880b8',
    },
  },
  overrides: {
    MuiTypography: {
      body1: {
        fontFamily: 'inherit',
      },
    },
    MuiInputLabel: {
      outlined: {
        fontSize: '14px',
      },
    },
    MuiInputBase: {
      input: {
        fontSize: '14px',
      },
    },
  },
});

export const ThemeRoot = (props: { children: React.ReactNode }) => (
  <StylesProvider injectFirst>
    <ThemeProvider theme={theme}>
      {props.children}
    </ThemeProvider>
  </StylesProvider>
);
