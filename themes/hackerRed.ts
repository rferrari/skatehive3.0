import { extendTheme } from '@chakra-ui/react';
import { COLORS } from './colors';

const hackerRedTheme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  semanticTokens: {
    colors: {
      _colorScheme: { _light: 'orange.400', _dark: 'orange.400' },
      _colorMode: 'dark',
    },
  },
  colors: {
    background: COLORS.GRAY_900,       // Dark gray for a sleek court-like feel
    text: COLORS.YELLOW_600,             // Vibrant basketball orange
    primary: COLORS.YELLOW_600,          // Bold orange for primary elements
    secondary: COLORS.BLUE_800,        // Deep navy blue for contrast
    accent: COLORS.GREEN_300,           // Light green for highlights
    muted: COLORS.GRAY_800,            // Muted dark gray for subtle backgrounds
    border: COLORS.YELLOW_600,           // Orange border to match primary
    error: COLORS.RED_500,
    success: COLORS.GREEN_500,
    warning: COLORS.YELLOW_500,
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
    tb1: '1px solid #FF6200',
    tb2: '2px solid #DC2626',
    borderRadius: '6px',
  },
  shadows: {
    xs: '0 0 2px 0 rgba(255, 98, 0, 0.3)',
    sm: '0 1px 2px 0 rgba(255, 98, 0, 0.3)',
    base: '0 1px 3px 0 rgba(255, 98, 0, 0.3), 0 1px 2px 0 rgba(255, 98, 0, 0.2)',
    md: '0 4px 6px -1px rgba(255, 98, 0, 0.3), 0 2px 4px -1px rgba(255, 98, 0, 0.2)',
    outline: '0 0 0 2px rgba(255, 98, 0, 0.6)',
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

export default hackerRedTheme;