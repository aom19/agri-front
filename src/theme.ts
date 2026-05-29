import { createTheme } from '@mui/material/styles'

const theme = createTheme({
    palette: {
        primary: {
            main: '#1a5c38',
            light: '#2d8653',
            dark: '#134a2c',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#10b981',
            light: '#34d399',
            dark: '#059669',
        },
        background: {
            default: '#f0f2f0',
            paper: '#ffffff',
        },
        text: {
            primary: '#0d1f17',
            secondary: '#4a5e54',
        },
        divider: '#e0e6e2',
        error: {
            main: '#dc2626',
        },
        success: {
            main: '#10b981',
        },
    },
    typography: {
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        h1: { fontWeight: 700 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 700 },
        h4: { fontWeight: 700 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        button: { fontWeight: 600, textTransform: 'none' },
    },
    shape: {
        borderRadius: 8,
    },
    shadows: [
        'none',
        '0 1px 3px rgba(10,30,20,0.08), 0 4px 16px rgba(10,30,20,0.06)',
        '0 2px 6px rgba(10,30,20,0.10), 0 8px 24px rgba(10,30,20,0.08)',
        '0 4px 12px rgba(10,30,20,0.12), 0 12px 32px rgba(10,30,20,0.10)',
        '0 8px 40px rgba(10,30,20,0.10)',
        ...Array(21).fill('0 8px 40px rgba(10,30,20,0.10)'),
    ] as unknown as typeof createTheme extends (o: infer T) => unknown ? T extends { shadows: infer S } ? S : never : never,
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: '10px 20px',
                },
                sizeLarge: {
                    height: 48,
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
                size: 'medium',
            },
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                        backgroundColor: '#ffffff',
                        transition: 'border-color 0.2s ease',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#2d8653',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#1a5c38',
                        },
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 1px 3px rgba(10,30,20,0.08), 0 4px 16px rgba(10,30,20,0.06)',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                },
            },
        },
    },
})

export default theme
