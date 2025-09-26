import { extendTheme } from '@chakra-ui/react';
import { COLORS } from './colors';

const nidTheme = extendTheme({
    config: {
        usesHeader: true,
        usesSidebar: false,
        initialColorMode: 'dark',
        useSystemColorMode: false,
    },
    semanticTokens: {
        colors: {
            _colorScheme: { _light: 'blue', _dark: 'blue' },
            _colorMode: 'dark',
        },
    },
    initialColorMode: 'dark',
    useSystemColorMode: false,
    colors: {
        background: '#0a0e27', // Deep navy for calm, focused environment
        text: '#e6e8eb', // Soft white with slight warmth for reduced eye strain
        primary: '#4a9eff', // Bright blue for clear hierarchy and attention
        secondary: '#6b7684', // Balanced gray for secondary elements
        accent: '#7c3aed', // Purple for strategic emphasis without overwhelming
        muted: '#1a1f3a', // Slightly lighter background for layering
        border: '#2d3748', // Subtle border that doesn't compete with content
        error: '#ef4444', // Clear red for errors - no ambiguity
        success: '#10b981', // Green that doesn't strain or startle
        warning: '#f59e0b', // Amber that draws attention without anxiety
    },
    fonts: {
        heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        mono: '"JetBrains Mono", "Fira Code", "SF Mono", monospace',
    },
    fontSizes: {
        xs: '12px',
        sm: '14px',
        md: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px',
        '5xl': '48px',
        '6xl': '64px',
    },
    fontWeights: {
        normal: 400,
        medium: 500,
        bold: 600, // Slightly less bold for better hierarchy without harshness
    },
    lineHeights: {
        normal: 'normal',
        none: 1,
        shorter: 1.25,
        short: 1.375,
        base: 1.6, // Slightly more generous for readability
        tall: 1.8,
        taller: '2',
    },
    borders: {
        tb1: '1px solid #2d3748',
        tb2: '2px solid #4a9eff',
        borderRadius: '8px', // Rounded enough for modern feel, not so much as to feel toy-like
    },
    radii: {
        none: '0',
        sm: '4px',
        base: '8px',
        md: '12px',
        lg: '16px',
        full: '9999px',
    },
    space: {
        px: '1px',
        0: '0',
        1: '0.25rem',
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        8: '2rem',
        10: '2.5rem',
        12: '3rem',
        16: '4rem',
        20: '5rem',
        24: '6rem',
        32: '8rem',
        40: '10rem',
        48: '12rem',
        56: '14rem',
        64: '16rem',
    },
    sizes: {
        max: 'max-content',
        min: 'min-content',
        full: '100%',
        '3xs': '14rem',
        '2xs': '16rem',
        xs: '20rem',
        sm: '24rem',
        md: '28rem',
        lg: '32rem',
        xl: '36rem',
        '2xl': '42rem',
        '3xl': '48rem',
        '4xl': '56rem',
        '5xl': '64rem',
        '6xl': '72rem',
        '7xl': '80rem',
        container: {
            sm: '640px',
            md: '768px',
            lg: '1024px',
            xl: '1280px',
        },
    },
    shadows: {
        xs: '0 0 2px 0 rgba(74, 158, 255, 0.2)',
        sm: '0 1px 2px 0 rgba(74, 158, 255, 0.15)',
        base: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(74, 158, 255, 0.1)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(74, 158, 255, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(74, 158, 255, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(74, 158, 255, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        outline: '0 0 0 3px rgba(74, 158, 255, 0.4)', // Clear focus indication
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.6)',
        none: 'none',
        'dark-lg': 'rgba(0, 0, 0, 0.4) 0px 10px 15px -3px, rgba(74, 158, 255, 0.1) 0px 4px 6px -2px',
    },
    components: {
        Button: {
            baseStyle: {
                fontWeight: 'medium',
                borderRadius: 'base',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth, natural feeling transitions
                _focus: {
                    boxShadow: 'outline',
                },
                _disabled: {
                    opacity: 0.6,
                    cursor: 'not-allowed',
                },
            },
            sizes: {
                sm: {
                    fontSize: 'sm',
                    px: 4,
                    py: 2,
                    minH: 8,
                },
                md: {
                    fontSize: 'md',
                    px: 6,
                    py: 3,
                    minH: 10,
                },
                lg: {
                    fontSize: 'lg',
                    px: 8,
                    py: 4,
                    minH: 12,
                },
            },
            variants: {
                solid: {
                    bg: 'primary',
                    color: 'white',
                    _hover: {
                        bg: '#3b82f6', // Slightly darker blue for clear feedback
                        transform: 'translateY(-1px)',
                        boxShadow: 'lg',
                    },
                    _active: {
                        transform: 'translateY(0px)',
                        boxShadow: 'md',
                    },
                },
                outline: {
                    borderColor: 'primary',
                    color: 'primary',
                    borderWidth: '1.5px', // Slightly thicker for better definition
                    _hover: {
                        bg: 'muted',
                        borderColor: '#3b82f6',
                        transform: 'translateY(-1px)',
                    },
                },
                ghost: {
                    color: 'primary',
                    _hover: {
                        bg: 'muted',
                        color: '#3b82f6',
                    },
                },
            },
        },
        Input: {
            baseStyle: {
                field: {
                    borderColor: 'border',
                    bg: 'muted',
                    color: 'text',
                    transition: 'all 0.2s',
                    _focus: {
                        borderColor: 'primary',
                        boxShadow: 'outline',
                        bg: 'background',
                    },
                    _hover: {
                        borderColor: '#4a5568',
                    },
                    _placeholder: {
                        color: 'secondary',
                    },
                },
            },
            sizes: {
                md: {
                    field: {
                        fontSize: 'md',
                        px: 4,
                        py: 3,
                        h: 10,
                    },
                },
            },
            variants: {
                outline: {
                    field: {
                        borderWidth: '1.5px',
                        _focus: {
                            borderWidth: '2px', // Stronger focus indication
                        },
                    },
                },
                filled: {
                    field: {
                        bg: '#1a1f3a',
                        _hover: {
                            bg: '#1f2937',
                        },
                        _focus: {
                            bg: 'background',
                            borderColor: 'primary',
                        },
                    },
                },
            },
        },
        Text: {
            baseStyle: {
                color: 'text',
                lineHeight: 'base',
            },
            variants: {
                heading: {
                    fontWeight: 'bold',
                    letterSpacing: '-0.025em', // Tighter letter spacing for headings
                },
                body: {
                    lineHeight: 'tall',
                },
                caption: {
                    fontSize: 'sm',
                    color: 'secondary',
                    lineHeight: 'short',
                },
            },
        },
        Card: {
            baseStyle: {
                bg: 'muted',
                borderColor: 'border',
                borderWidth: '1px',
                borderRadius: 'base',
                boxShadow: 'base',
                transition: 'all 0.2s',
                _hover: {
                    boxShadow: 'md',
                    transform: 'translateY(-2px)',
                },
            },
        },
        Link: {
            baseStyle: {
                color: 'primary',
                textDecoration: 'none',
                transition: 'all 0.2s',
                _hover: {
                    color: 'accent',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                },
                _focus: {
                    boxShadow: 'outline',
                    borderRadius: 'sm',
                },
            },
        },
        Badge: {
            baseStyle: {
                borderRadius: 'base',
                fontWeight: 'medium',
                fontSize: 'xs',
                px: 2,
                py: 1,
            },
            variants: {
                solid: {
                    bg: 'primary',
                    color: 'white',
                },
                outline: {
                    borderColor: 'primary',
                    color: 'primary',
                    borderWidth: '1px',
                },
                subtle: {
                    bg: 'muted',
                    color: 'primary',
                },
            },
        },
    },
});

export default nidTheme;