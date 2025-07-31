import { extendTheme } from '@chakra-ui/react';
import { swiperStyles } from './swiperStyles';
import { COLORS } from './colors';

const macTheme = extendTheme({
    initialColorMode: 'light',
    useSystemColorMode: false,
    colors: {
        background: COLORS.MAC_VIOLET, // BV-T3, muted violet
        text: COLORS.GRAY_700, // GRAY 7.5, approximated mid-tone gray
        primary: COLORS.GRAY_800, // BG-P1-1, dark gray
        secondary: COLORS.GRAY_400, // GRAY 7, closest to muted gray
        accent: COLORS.MAC_LAVENDER, // BV-T2, closest to muted lavender blue
        muted: COLORS.GRAY_500, // GRAY 9, closest to light gray
        error: COLORS.RED_600, // R-T1, closest to tomato red
        success: COLORS.GREEN_500, // YG-T1, closest to yellow-green
        warning: COLORS.YELLOW_600, // O-HUE, closest to orange
    },
    fonts: {
        heading: '"Chicago", "OCR-A", "Courier New", sans-serif', // Authentic Chicago font for Mac theme
        body: '"Chicago", "OCR-A", "Courier New", sans-serif', // Authentic Chicago font for Mac theme
        mono: '"Courier New", monospace', // Monospace for code-like elements
    },
    fontSizes: {
        xs: '10px',
        sm: '12px',
        md: '14px',
        lg: '16px',
        xl: '18px',
        '2xl': '20px',
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
        normal: 'normal',
        none: 1,
        shorter: 1.25,
        short: 1.375,
        base: 1.5,
        tall: 1.625,
        taller: '2',
    },
    borders: {
        tb1: `1px solid ${COLORS.GRAY_500}`,
        borderRadius: '4px',
    },
    radii: {
        none: '0',
        sm: '2px',
        base: '4px',
        md: '8px',
        lg: '12px',
        full: '9999px', // For fully rounded corners
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
        xs: '0 0 2px 0 rgba(0, 0, 0, 0.1)',
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
        base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.06)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.06)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        outline: '0 0 0 3px rgba(138, 127, 158, 0.6)', // Muted lavender blue outline
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        none: 'none',
        'dark-lg': 'rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.06) 0px 4px 6px -2px',
    },
    components: {
        Button: {
            baseStyle: {
                fontWeight: 'bold',
                textTransform: 'uppercase',
                borderRadius: 'base', // Rounded corners for Mac style
            },
            sizes: {
                sm: {
                    fontSize: 'sm',
                    px: 4,
                    py: 2,
                },
                md: {
                    fontSize: 'md',
                    px: 6,
                    py: 3,
                },
            },
            variants: {
                solid: {
                    bg: 'primary',
                    color: 'text',
                    _hover: {
                        bg: 'accent', // Muted lavender blue on hover
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
                    borderColor: 'secondary',
                    _focus: {
                        borderColor: 'accent', // Muted lavender blue on focus
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
                        borderColor: 'secondary',
                        _hover: {
                            borderColor: 'accent',
                        },
                        _focus: {
                            borderColor: 'accent',
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
                            borderColor: 'accent',
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

export default macTheme;