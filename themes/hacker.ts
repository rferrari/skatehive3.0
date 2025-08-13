import { extendTheme } from '@chakra-ui/react';


const hackerTheme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  semanticTokens: {
    colors: {
      _colorScheme: { _light: 'green', _dark: 'green' },
      _colorMode: 'dark',
    },
  },
  colors: {
    background: '#0f0f0f',        // Hacker background
    text: '#00FF00',              // Hacker text
    primary: '#00FF00',           // Hacker primary
    'primary-alpha': '#00FF00',   // Match Hacker primary
    secondary: '#252926',         // Hacker secondary
    accent: '#BD93F9',            // Hacker accent
    muted: '#1a1a1a',             // Hacker muted
    border: '#00FF00',            // Hacker border
    error: '#FF4136',             // Hacker error
    success: '#2ECC40',           // Hacker success
    warning: '#FF851B',           // Hacker warning
  },
  fonts: {
    heading: '"Fira Code", monospace',
    body: '"Fira Code", monospace',
    mono: '"Fira Code", monospace',
  },
  fontSizes: {
    xs: '14px',
    sm: '16px',
    md: '18px',
    lg: '20px',
    xl: '22px',
    '2xl': '14px',
    '3xl': '16px',
    '4xl': '18px',
    '5xl': '20px',
    '6xl': '22px',
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
    tb1: '1px solid #00FF00',
    tb2: '2px solid #FFD700',
    borderRadius: '6px',
  },
  shadows: {
    xs: '0 0 2px 0 rgba(0, 255, 0, 0.3)',
    sm: '0 1px 2px 0 rgba(0, 255, 0, 0.3)',
    base: '0 1px 3px 0 rgba(0, 255, 0, 0.3), 0 1px 2px 0 rgba(0, 255, 0, 0.2)',
    md: '0 4px 6px -1px rgba(0, 255, 0, 0.3), 0 2px 4px -1px rgba(0, 255, 0, 0.2)',
    outline: '0 0 0 2px rgba(0, 255, 0, 0.6)',
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

export default hackerTheme;
