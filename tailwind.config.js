/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F5EDDA",
        ivory: "#FAF7F0",
        forest: {
          50: "#F0F5F1",
          100: "#DCE8DF",
          200: "#B9D1BF",
          300: "#8FB39A",
          400: "#6A9477",
          500: "#4A7558",
          600: "#3A5E45",
          700: "#2D4A37",
          800: "#1E3527",
          900: "#1B3024",
          950: "#0F1F15",
        },
        ink: {
          50: "#F5F5F4",
          100: "#E7E5E4",
          200: "#D6D3D1",
          300: "#A8A29E",
          400: "#78716C",
          500: "#57534E",
          600: "#44403C",
          700: "#292524",
          800: "#1C1917",
          900: "#0C0A09",
          950: "#060504",
        },
        clay: {
          50: "#FAF7F0",
          100: "#F5EDDA",
          200: "#E8DCC0",
          300: "#D4C4A0",
          400: "#BBA57D",
          500: "#A68B5B",
        },
        rust: {
          50: "#FDF5EF",
          100: "#FAE8D9",
          200: "#F4CDB2",
          400: "#E4854D",
          500: "#DD6B2C",
          600: "#CF5421",
          700: "#AC401D",
        },
      },
      fontFamily: {
        sans: [
          "system-ui", "-apple-system", "BlinkMacSystemFont",
          "Segoe UI", "Roboto", "sans-serif",
        ],
        serif: [
          "Georgia", "Cambria", "Times New Roman", "Times", "serif",
        ],
        mono: [
          "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "monospace",
        ],
      },
    },
  },
  plugins: [],
};
