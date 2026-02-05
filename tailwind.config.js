export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
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
