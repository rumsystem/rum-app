const {
  colors
} = require('tailwindcss/defaultTheme');

module.exports = {
  purge: [
    './src/**/*.ts',
    './src/**/*.tsx',
  ],
  theme: {
    extend: {
      margin: {
        ...Object.fromEntries(
          Array(10).fill(0).map(
            (_v, i) => [`${(i + 1)}-px`, `${(i + 1)}px`],
          )
        ),
        ...Object.fromEntries(
          Array(10).fill(0).map(
            (_v, i) => [`-${(i + 1)}-px`, `-${(i + 1)}px`],
          )
        ),
      },
      padding: {
        ...Object.fromEntries(
          Array(10).fill(0).map(
            (_v, i) => [`${(i + 1)}-px`, `${(i + 1)}px`],
          )
        ),
      },
      colors: {
        'gray': {
          'f7': '#f7f7f7',
          'f2': '#f2f2f2',
          'ec': '#ececec',
          'd8': '#d8d8d8',
          'bf': '#bfbfbf',
          'bd': '#bdbdbd',
          'af': '#afafaf',
          '9b': '#9b9b9b',
          '99': '#999999',
          '88': '#888888',
          '70': '#707070',
          '6d': '#6d6d6d',
          '4a': '#4a4a4a',
          '1e': '#1e1e1e',
          '1b': '#1b1b1b',
          ...colors.gray,
        },
      },
      borderRadius: {
        ...Object.fromEntries(
          Array(12).fill(0).map(
            (_v, i) => [`${i + 1}`, `${(i + 1)}px`],
          ),
        ),
      },
      fontSize: {
        0: '0',
        ...Object.fromEntries(
          Array(56).fill(0).map(
            (_v, i) => [i + 1, `${i + 1}px`],
          ),
        ),
      },
      width: {
        ...Object.fromEntries(
          Array(72).fill(0).map(
            (_v, i) => [`${i + 1}`, `${(i + 1) * 0.25}rem`],
          ),
        ),
        ...Object.fromEntries(
          Array(12).fill(0).map(
            (_v, i) => [`${(i + 1) * 100}-px`, `${(i + 1) * 100}px`],
          )
        ),
        ...Object.fromEntries(
          [50, 60, 70, 80, 90].map(
            v => [`${v}-vw`, `${v}vw`]
          )
        ),
        916: '916px'
      },
      height: {
        ...Object.fromEntries(
          Array(72).fill(0).map(
            (_v, i) => [`${i + 1}`, `${(i + 1) * 0.25}rem`],
          ),
        ),
        ...Object.fromEntries(
          Array(12).fill(0).map(
            (_v, i) => [`${(i + 1) * 100}-px`, `${(i + 1) * 100}px`],
          )
        ),
        ...Object.fromEntries(
          [50, 60, 70, 80, 90].map(
            v => [`${v}-vh`, `${v}vh`]
          )
        )
      },
      minHeight: {
        ...Object.fromEntries(
          [50, 60, 70, 80, 90].map(
            v => [`${v}-vh`, `${v}vh`]
          )
        ),
      },
      maxWidth: {
        ...Object.fromEntries(
          Array(72).fill(0).map(
            (_v, i) => [`${i + 1}`, `${(i + 1) * 0.25}rem`],
          ),
        ),
      },
    },
  },
};
