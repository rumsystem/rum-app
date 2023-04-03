import React from 'react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { createTheme } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

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
  components: {
    MuiTypography: {
      styleOverrides: {
        body1: {
          fontFamily: 'inherit',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        outlined: {
          fontSize: '14px',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '14px',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          fontSize: '14px',
        },
      },
    },
  },
});

const cache = createCache({
  key: 'mui-css',
  insertionPoint: typeof document !== 'undefined'
    ? Array.from(document.head.childNodes)
      .filter((v) => v.nodeType === 8)
      .find((v) => v.textContent?.includes('mui-insertion-point')) as any
    : null,
});

export const ThemeRoot = (props: { children: React.ReactNode }) => (
  <CacheProvider value={cache}>
    <ThemeProvider theme={theme}>
      {props.children}
    </ThemeProvider>
  </CacheProvider>
);
