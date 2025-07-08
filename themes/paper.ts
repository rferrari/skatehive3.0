import { extendTheme } from '@chakra-ui/react';

const retroPaperTheme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  semanticTokens: {
    colors: {
      _colorScheme: { _light: 'Y-LP', _dark: 'Y-LP' },
      _colorMode: 'light',
    },
  },
  colors: {
    background: '#F9F3C1', // Y-LP, warm paper-like off-white for retro feel
    text: '#252527',       // GRAY 2, dark gray for readable text
    primary: '#A13A1C',    // RO-S1, muted rusty orange for primary elements
    secondary: '#315B58',  // G-S3, deep teal for contrast
    accent: '#A12637',     // R-S1, retro red for highlights
    muted: '#D6D3A1',      // Y-P4-3, muted yellowish for subtle backgrounds
    border: '#252527',     // GRAY 2, dark gray border for definition
    error: '#BC0D14',      // R-EX, bold red for errors
    success: '#378B47',    // Gw-T1, retro green for success
    warning: '#F89A04',    // YO-EX, warm yellow-orange for warnings
  },
  fonts: {
    heading: 'Mechanical, "Courier New", monospace',
    body: 'Mechanical, "Courier New", monospace',
    mono: 'Mechanical, "Courier New", monospace',
  },
  fontSizes: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '22px',
    '3xl': '24px',
    '4xl': '28px',
    '5xl': '32px',
    '6xl': '36px',
  },
  fontWeights: {
    normal: 400,
    medium: 600,
    bold: 700,
  },
  lineHeights: {
    base: 1.5,
    short: 1.3,
    tall: 1.7,
  },
  borders: {
    tb1: '1px solid #252527', // GRAY 2, dark gray border
    tb2: '2px solid #A12637', // R-S1, retro red border
    borderRadius: '4px',      // Slightly sharper for retro aesthetic
  },
  shadows: {
    xs: '0 0 2px 0 rgba(37, 37, 39, 0.2)',   // GRAY 2
    sm: '0 1px 2px 0 rgba(37, 37, 39, 0.2)',  // GRAY 2
    base: '0 1px 3px 0 rgba(37, 37, 39, 0.2), 0 1px 2px 0 rgba(37, 37, 39, 0.15)', // GRAY 2
    md: '0 4px 6px -1px rgba(37, 37, 39, 0.2), 0 2px 4px -1px rgba(37, 37, 39, 0.15)', // GRAY 2
    outline: '0 0 0 2px rgba(37, 37, 39, 0.5)', // GRAY 2
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.5)',
    none: 'none',
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'bold',
        textTransform: 'uppercase',
        borderRadius: 'md',
      },
      variants: {
        solid: {
          bg: 'primary',
          color: 'background',
          _hover: {
            bg: 'accent',
            color: 'background',
          },
        },
        outline: {
          borderColor: 'primary',
          color: 'primary',
          _hover: {
            bg: 'muted',
          },
        },
        ghost: {
          color: 'primary',
          _hover: {
            bg: 'muted',
          },
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderColor: 'border',
            _hover: { borderColor: 'primary' },
            _focus: {
              borderColor: 'primary',
              boxShadow: 'outline',
            },
            bg: 'background',
            color: 'text',
          },
        },
      },
    },
    Text: {
      baseStyle: {
        color: 'text',
        fontSize: 'md',
        lineHeight: 'base',
      },
    },
  },
});

export default retroPaperTheme; 