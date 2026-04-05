/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#FAF7F2",
        parchment: "#F3EDE4",
        clay: {
          50: "#FAF7F2",
          100: "#F3EDE4",
          200: "#E8DFD0",
          300: "#D4C4AA",
          400: "#BBA57D",
          500: "#A68B5B",
          600: "#8B7049",
          700: "#6E583A",
          800: "#574630",
          900: "#3D3121",
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
        moss: {
          50: "#F2F5F0",
          100: "#E0E8DB",
          200: "#C2D1B8",
          300: "#9DB48E",
          400: "#7A9768",
          500: "#5E7A4E",
          600: "#4A613D",
          700: "#3B4D31",
          800: "#303E29",
          900: "#283323",
        },
        rust: {
          50: "#FDF5EF",
          100: "#FAE8D9",
          200: "#F4CDB2",
          300: "#EDAC80",
          400: "#E4854D",
          500: "#DD6B2C",
          600: "#CF5421",
          700: "#AC401D",
          800: "#89351F",
          900: "#6F2D1C",
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
