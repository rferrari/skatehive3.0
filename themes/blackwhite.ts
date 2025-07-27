import { extendTheme } from '@chakra-ui/react';

const blackWhiteTheme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  semanticTokens: {
    colors: {
      _colorScheme: { _light: 'gray', _dark: 'gray' },
      _colorMode: 'dark',
    },
  },
  colors: {
    background: '#000000',       // Pure black background
    text: '#FFFFFF',             // Pure white text
    primary: '#FFFFFF',          // White for primary elements
    'primary-alpha': '#FFFFFF80', // Semi-transparent white
    secondary: '#808080',        // Medium gray for secondary elements
    accent: '#C0C0C0',          // Light gray for highlights
    muted: '#1A1A1A',           // Very dark gray for muted backgrounds
    border: '#FFFFFF',          // White borders
    error: '#FFFFFF',           // White for errors (monochrome)
    success: '#FFFFFF',         // White for success
    warning: '#C0C0C0',         // Light gray for warnings
  },
  fonts: {
    heading: '"Helvetica Neue", Arial, sans-serif',
    body: '"Helvetica Neue", Arial, sans-serif',
    mono: '"Courier New", monospace',
  },
  fontSizes: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '18px',
    '3xl': '18px',
    '4xl': '18px',
    '5xl': '18px',
    '6xl': '18px',
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    bold: 700,
  },
  lineHeights: {
    base: 1.6,
    short: 1.4,
    tall: 1.8,
  },
  borders: {
    tb1: '1px solid #FFFFFF',
    tb2: '2px solid #FFFFFF',
    borderRadius: '4px',
  },
  shadows: {
    xs: '0 0 2px 0 rgba(255, 255, 255, 0.2)',
    sm: '0 1px 2px 0 rgba(255, 255, 255, 0.2)',
    base: '0 1px 3px 0 rgba(255, 255, 255, 0.2), 0 1px 2px 0 rgba(255, 255, 255, 0.1)',
    md: '0 4px 6px -1px rgba(255, 255, 255, 0.2), 0 2px 4px -1px rgba(255, 255, 255, 0.1)',
    outline: '0 0 0 2px rgba(255, 255, 255, 0.5)',
    inner: 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.1)',
    none: 'none',
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'bold',
        borderRadius: 'md',
        border: '1px solid',
      },
      variants: {
        solid: {
          bg: 'white',
          color: 'black',
          borderColor: 'white',
          _hover: {
            bg: 'gray.200',
            color: 'black',
          },
          _active: {
            bg: 'gray.300',
          },
        },
        outline: {
          bg: 'transparent',
          color: 'white',
          borderColor: 'white',
          _hover: {
            bg: 'white',
            color: 'black',
          },
          _active: {
            bg: 'gray.200',
            color: 'black',
          },
        },
        ghost: {
          bg: 'transparent',
          color: 'white',
          borderColor: 'transparent',
          _hover: {
            bg: 'muted',
          },
          _active: {
            bg: 'gray.700',
          },
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderColor: 'white',
            color: 'white',
            bg: 'transparent',
            _hover: { 
              borderColor: 'gray.300',
            },
            _focus: {
              borderColor: 'white',
              boxShadow: 'outline',
            },
            _placeholder: {
              color: 'gray.400',
            },
          },
        },
      },
    },
    Textarea: {
      variants: {
        outline: {
          borderColor: 'white',
          color: 'white',
          bg: 'transparent',
          _hover: { 
            borderColor: 'gray.300',
          },
          _focus: {
            borderColor: 'white',
            boxShadow: 'outline',
          },
          _placeholder: {
            color: 'gray.400',
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
    Heading: {
      baseStyle: {
        color: 'white',
        fontWeight: 'bold',
      },
    },
    Link: {
      baseStyle: {
        color: 'white',
        textDecoration: 'underline',
        _hover: {
          color: 'gray.300',
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'muted',
          border: '1px solid',
          borderColor: 'white',
          color: 'white',
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: 'background',
          border: '1px solid',
          borderColor: 'white',
        },
        header: {
          color: 'white',
          borderBottom: '1px solid',
          borderColor: 'white',
        },
        body: {
          color: 'white',
        },
        footer: {
          borderTop: '1px solid',
          borderColor: 'white',
        },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: {
          bg: 'background',
          border: '1px solid',
          borderColor: 'white',
        },
        header: {
          color: 'white',
          borderBottom: '1px solid',
          borderColor: 'white',
        },
        body: {
          color: 'white',
        },
        footer: {
          borderTop: '1px solid',
          borderColor: 'white',
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: 'background',
          border: '1px solid',
          borderColor: 'white',
        },
        item: {
          color: 'white',
          _hover: {
            bg: 'muted',
          },
          _focus: {
            bg: 'muted',
          },
        },
      },
    },
    Alert: {
      variants: {
        solid: {
          container: {
            bg: 'white',
            color: 'black',
          },
        },
        outline: {
          container: {
            bg: 'transparent',
            borderColor: 'white',
            color: 'white',
          },
        },
      },
    },
    Badge: {
      baseStyle: {
        color: 'black',
        bg: 'white',
        border: '1px solid',
        borderColor: 'white',
      },
    },
    Tag: {
      baseStyle: {
        container: {
          bg: 'white',
          color: 'black',
          border: '1px solid',
          borderColor: 'white',
        },
      },
    },
    Divider: {
      baseStyle: {
        borderColor: 'white',
      },
    },
  },
});

export default blackWhiteTheme;
