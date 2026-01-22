import { extendTheme } from '@chakra-ui/react';

const cyberpunkTheme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  semanticTokens: {
    colors: {
      _colorScheme: { _light: 'C-T1', _dark: 'C-T1' },
      _colorMode: 'dark',
    },
  },
  colors: {
    background: '#151618', // GRAY 1.5 for a dark, sleek cyberpunk vibe
    text: '#56A7E1',       // C-T1, vibrant cyan for text
    primary: '#56A7E1',    // C-T1, cyan for primary elements
    secondary: '#492B84',  // V-S1, deep purple for contrast
    accent: '#FF3D8A',     // M-P1-1, neon magenta for highlights
    muted: '#252527',      // GRAY 2, muted dark gray for backgrounds
    border: '#56A7E1',     // C-T1, cyan border to match primary
    error: '#E83032',      // Rw-T1, bright red for errors
    success: '#61CD62',    // YG-T1, green for success states
    warning: '#FDAB2B',    // YO-T1, yellow-orange for warnings
      panel: '#1E1E22',      // Slightly lighter than background for panels
      panelHover: '#2A2A2E', // Hover state for panels
      inputBg: '#252527',    // Dark background for inputs
      inputBorder: '#3A3A40', // Medium contrast border for inputs
      inputText: '#56A7E1',   // Readable text for inputs
      inputPlaceholder: '#6B6B70', // Gray text for placeholders
      dim: '#8A8A90',        // Medium gray for secondary text
      subtle: 'rgba(86, 167, 225, 0.08)', // Very transparent for subtle hovers
    },
  fonts: {
    heading: '"Fira Code", monospace',
    body: '"Fira Code", monospace',
    mono: '"Fira Code", monospace',
  },
  fontSizes: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '18px',
    '2xl': '18px',
    '3xl': '18px',
    '4xl': '18px',
    '5xl': '18px',
    '6xl': '18px',
  },
  fontWeights: {
    normal: 400,
    medium: 600,
    bold: 700,
  },
  lineHeights: {
    base: 1.6,
    short: 1.4,
    tall: 1.75,
  },
  borders: {
    tb1: '1px solid #56A7E1', // C-T1, cyan border
    tb2: '2px solid #FF3D8A', // M-P1-1, magenta border
    borderRadius: '6px',
  },
  shadows: {
    xs: '0 0 2px 0 rgba(86, 167, 225, 0.3)',   // C-T1
    sm: '0 1px 2px 0 rgba(86, 167, 225, 0.3)',  // C-T1
    base: '0 1px 3px 0 rgba(86, 167, 225, 0.3), 0 1px 2px 0 rgba(86, 167, 225, 0.2)', // C-T1
    md: '0 4px 6px -1px rgba(86, 167, 225, 0.3), 0 2px 4px -1px rgba(86, 167, 225, 0.2)', // C-T1
    outline: '0 0 0 2px rgba(86, 167, 225, 0.6)', // C-T1
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.6)',
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
            bg: 'muted',
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

export default cyberpunkTheme; 