const { colors } = require('tailwindcss/defaultTheme');

module.exports = {
  mode: 'jit',
  purge: ['./src/**/*.ts', './src/**/*.tsx'],
  theme: {
    extend: {
      margin: {
        ...Object.fromEntries(
          Array(10)
            .fill(0)
            .map((_v, i) => [`${i + 1}-px`, `${i + 1}px`]),
        ),
        ...Object.fromEntries(
          Array(10)
            .fill(0)
            .map((_v, i) => [`-${i + 1}-px`, `-${i + 1}px`]),
        ),
      },
      padding: {
        ...Object.fromEntries(
          Array(10)
            .fill(0)
            .map((_v, i) => [`${i + 1}-px`, `${i + 1}px`]),
        ),
      },
      colors: {
        'link-blue': '#0080ff',
        gray: {
          64: '#646464',
          f7: '#f7f7f7',
          f2: '#f2f2f2',
          ec: '#ececec',
          d8: '#d8d8d8',
          bf: '#bfbfbf',
          bd: '#bdbdbd',
          af: '#afafaf',
          '9b': '#9b9b9b',
          '99': '#999999',
          '88': '#888888',
          '70': '#707070',
          '6d': '#6d6d6d',
          '4a': '#4a4a4a',
          '33': '#333333',
          '1e': '#1e1e1e',
          '1b': '#1b1b1b',
          '9c': '#9c9c9c',
          ...colors.gray,
        },
      },
      borderRadius: {
        ...Object.fromEntries(
          Array(12)
            .fill(0)
            .map((_v, i) => [`${i + 1}`, `${i + 1}px`]),
        ),
      },
      fontSize: {
        0: '0',
        ...Object.fromEntries(
          Array(56)
            .fill(0)
            .map((_v, i) => [i + 1, `${i + 1}px`]),
        ),
      },
      width: {
        ...Object.fromEntries(
          Array(120)
            .fill(0)
            .map((_v, i) => [`${i + 1}`, `${(i + 1) * 0.25}rem`]),
        ),
        ...Object.fromEntries(
          Array(12)
            .fill(0)
            .map((_v, i) => [`${(i + 1) * 100}-px`, `${(i + 1) * 100}px`]),
        ),
        ...Object.fromEntries(
          [50, 60, 70, 80, 90].map((v) => [`${v}-vw`, `${v}vw`]),
        ),
        916: '916px',
      },
      height: {
        ...Object.fromEntries(
          Array(120)
            .fill(0)
            .map((_v, i) => [`${i + 1}`, `${(i + 1) * 0.25}rem`]),
        ),
        ...Object.fromEntries(
          Array(12)
            .fill(0)
            .map((_v, i) => [`${(i + 1) * 100}-px`, `${(i + 1) * 100}px`]),
        ),
        ...Object.fromEntries(
          [50, 60, 70, 80, 90].map((v) => [`${v}-vh`, `${v}vh`]),
        ),
      },
      minHeight: {
        ...Object.fromEntries(
          [50, 60, 70, 80, 90].map((v) => [`${v}-vh`, `${v}vh`]),
        ),
      },
      maxWidth: {
        ...Object.fromEntries(
          Array(72)
            .fill(0)
            .map((_v, i) => [`${i + 1}`, `${(i + 1) * 0.25}rem`]),
        ),
      },

      boxShadow: {
        '0': '0px 0px 0px 0px rgba(0,0,0,.2),0px 0px 0px 0px rgba(0,0,0,.14),0px 0px 0px 0px rgba(0,0,0,.12)',
        '1': '0px 2px 1px -1px rgba(0,0,0,.2),0px 1px 1px 0px rgba(0,0,0,.14),0px 1px 3px 0px rgba(0,0,0,.12)',
        '2': '0px 3px 1px -2px rgba(0,0,0,.2),0px 2px 2px 0px rgba(0,0,0,.14),0px 1px 5px 0px rgba(0,0,0,.12)',
        '3': '0px 3px 3px -2px rgba(0,0,0,.2),0px 3px 4px 0px rgba(0,0,0,.14),0px 1px 8px 0px rgba(0,0,0,.12)',
        '4': '0px 2px 4px -1px rgba(0,0,0,.2),0px 4px 5px 0px rgba(0,0,0,.14),0px 1px 10px 0px rgba(0,0,0,.12)',
        '5': '0px 3px 5px -1px rgba(0,0,0,.2),0px 5px 8px 0px rgba(0,0,0,.14),0px 1px 14px 0px rgba(0,0,0,.12)',
        '6': '0px 3px 5px -1px rgba(0,0,0,.2),0px 6px 10px 0px rgba(0,0,0,.14),0px 1px 18px 0px rgba(0,0,0,.12)',
        '7': '0px 4px 5px -2px rgba(0,0,0,.2),0px 7px 10px 1px rgba(0,0,0,.14),0px 2px 16px 1px rgba(0,0,0,.12)',
        '8': '0px 5px 5px -3px rgba(0,0,0,.2),0px 8px 10px 1px rgba(0,0,0,.14),0px 3px 14px 2px rgba(0,0,0,.12)',
        '9': '0px 5px 6px -3px rgba(0,0,0,.2),0px 9px 12px 1px rgba(0,0,0,.14),0px 3px 16px 2px rgba(0,0,0,.12)',
        '10': '0px 6px 6px -3px rgba(0,0,0,.2),0px 10px 14px 1px rgba(0,0,0,.14),0px 4px 18px 3px rgba(0,0,0,.12)',
      },
      transitionDuration: {
        '0': '0ms',
      },
    },
  },
};
