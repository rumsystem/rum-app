import React from 'react';
import { createMuiTheme, StylesProvider, ThemeProvider } from '@material-ui/core';

const theme = createMuiTheme({
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
  },
});

export const ThemeRoot = (props: { children: React.ReactNode }) => (
  <StylesProvider injectFirst>
    <ThemeProvider theme={theme}>
      {props.children}
    </ThemeProvider>
  </StylesProvider>
);
