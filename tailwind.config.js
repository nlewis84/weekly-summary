import colors from "tailwindcss/colors";

export default {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        tremor: {
          brand: { faint: colors.blue[50], muted: colors.blue[200], subtle: colors.blue[400], DEFAULT: colors.blue[500], emphasis: colors.blue[700], inverted: colors.white },
          background: { muted: colors.gray[50], subtle: colors.gray[100], DEFAULT: colors.white, emphasis: colors.gray[700] },
          border: { DEFAULT: colors.gray[200] },
          ring: { DEFAULT: colors.gray[200] },
          content: { subtle: colors.gray[400], DEFAULT: colors.gray[500], emphasis: colors.gray[700], strong: colors.gray[900], inverted: colors.white },
        },
        "dark-tremor": {
          brand: { faint: "#0B1229", muted: colors.blue[950], subtle: colors.blue[800], DEFAULT: colors.blue[500], emphasis: colors.blue[400], inverted: colors.blue[950] },
          background: { muted: "#131A2B", subtle: colors.gray[800], DEFAULT: colors.gray[900], emphasis: colors.gray[300] },
          border: { DEFAULT: colors.gray[800] },
          ring: { DEFAULT: colors.gray[800] },
          content: { subtle: colors.gray[600], DEFAULT: colors.gray[500], emphasis: colors.gray[200], strong: colors.gray[50], inverted: colors.gray[950] },
        },
        primary: {
          50: "#e6f7f5",
          100: "#b3e7e0",
          200: "#80d7cb",
          300: "#4dc7b6",
          400: "#1ab7a1",
          500: "#17B582",
          600: "#0f836c",
          700: "#0a6f67",
          800: "#00676D",
        },
        error: {
          100: "#FEE4E2",
          500: "#F04438",
          600: "#D92D20",
          700: "#B42318",
        },
        success: {
          100: "#D1FADF",
          500: "#12B76A",
          600: "#039855",
          700: "#027A48",
        },
      },
    },
  },
};
