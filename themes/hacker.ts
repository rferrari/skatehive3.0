import { extendTheme } from '@chakra-ui/react';


const hackerTheme = extendTheme({
    config: {
        usesHeader: true,
        usesSidebar: false,
        initialColorMode: 'dark',
        useSystemColorMode: false,
    },
    semanticTokens: {
        colors: {
            _colorScheme: { _light: 'green', _dark: 'green' },
            _colorMode: 'dark',
        },
    },
    initialColorMode: 'dark', // set 'light' or 'dark' as the default color mode
    useSystemColorMode: false,
    colors: {
        background: '#0f0f0f',
        text: '#00FF00',
        primary: '#00FF00',
        secondary: '#252926',
        accent: '#BD93F9',
        muted: '#1a1a1a',
        border: '#00FF00',
        error: '#FF4136',
        success: '#2ECC40',
        warning: '#FF851B',
        panel: '#151515',
        panelHover: '#1F1F1F',
        inputBg: '#0A0A0A',
        inputBorder: '#333333',
        inputText: '#00FF00',
        inputPlaceholder: '#008800',
        dim: '#00AA00',
        subtle: 'rgba(0,255,0,0.06)',
    },
    fonts: {
        heading: 'var(--font-vt323), monospace',
        body: 'var(--font-vt323), monospace',
        mono: 'var(--font-vt323), "Courier New", monospace',
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
        medium: 600,
        bold: 700,
    },
    lineHeights: {
        normal: 'normal',
        none: 1,
        shorter: 1.25,
        short: 1.375,
        base: 1.5,
        tall: 1.625,
        taller: '2',
    },
    borders: {
        tb1: '1px solid #00FF00', // Bright green border for a hacker aesthetic
        tb2: '2px solid #FFD700', // Bright green border for a hacker aesthetic
        borderRadius: '4px', // Slightly less rounded corners for a sharper look
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
        xs: '0 0 2px 0 rgba(0, 255, 0, 0.5)',
        sm: '0 1px 2px 0 rgba(0, 255, 0, 0.5)',
        base: '0 1px 3px 0 rgba(0, 255, 0, 0.5), 0 1px 2px 0 rgba(0, 255, 0, 0.3)',
        md: '0 4px 6px -1px rgba(0, 255, 0, 0.5), 0 2px 4px -1px rgba(0, 255, 0, 0.3)',
        lg: '0 10px 15px -3px rgba(0, 255, 0, 0.5), 0 4px 6px -2px rgba(0, 255, 0, 0.3)',
        xl: '0 20px 25px -5px rgba(0, 255, 0, 0.5), 0 10px 10px -5px rgba(0, 255, 0, 0.3)',
        '2xl': '0 25px 50px -12px rgba(0, 255, 0, 0.7)',
        outline: '0 0 0 3px rgba(0, 255, 0, 0.6)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.8)',
        none: 'none',
        'dark-lg': 'rgba(0, 255, 0, 0.5) 0px 10px 15px -3px, rgba(0, 255, 0, 0.3) 0px 4px 6px -2px',
    },
    components: {
        Button: {
            baseStyle: {
                fontWeight: 'bold',
                textTransform: 'uppercase',
                borderRadius: 'base',
            },
            sizes: {
                sm: {
                    fontSize: 'sm',
                    px: 4,
                    py: 3,
                },
                md: {
                    fontSize: 'md',
                    px: 6,
                    py: 4,
                },
            },
            variants: {
                solid: {
                    bg: 'primary',
                    color: 'background',
                    _hover: {
                        bg: 'accent',
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
            baseStyle: {
                field: {
                    borderColor: 'border',
                    _focus: {
                        borderColor: 'primary',
                        boxShadow: 'outline',
                    },
                },
            },
            sizes: {
                md: {
                    field: {
                        fontSize: 'md',
                        px: 4,
                        py: 2,
                    },
                },
            },
            variants: {
                outline: {
                    field: {
                        borderColor: 'border',
                        _hover: {
                            borderColor: 'primary',
                        },
                        _focus: {
                            borderColor: 'primary',
                            boxShadow: 'outline',
                        },
                    },
                },
                filled: {
                    field: {
                        bg: 'muted',
                        _hover: {
                            bg: 'muted',
                        },
                        _focus: {
                            bg: 'muted',
                            borderColor: 'primary',
                        },
                    },
                },
            },
        },
        Text: {
            baseStyle: {
                color: 'text',
            },
        },
    },
});
export default hackerTheme;
