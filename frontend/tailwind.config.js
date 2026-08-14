/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f4f6f7",
          100: "#e4e9eb",
          200: "#c7d1d5",
          300: "#9fb0b6",
          400: "#6f868f",
          500: "#526670",
          600: "#41525b",
          700: "#37444b",
          800: "#2d383f",
          900: "#1c2327",
          950: "#111517",
        },
        accent: {
          50: "#eefcf6",
          100: "#d5f6e6",
          200: "#aeecd1",
          300: "#79dab8",
          400: "#43bf98",
          500: "#22a37e",
          600: "#158265",
          700: "#136853",
          800: "#135343",
          900: "#124439",
          950: "#062720",
        },
        amber: {
          50: "#fdf8ed",
          100: "#f9edcd",
          200: "#f3d996",
          300: "#eabf59",
          400: "#e2a72f",
          500: "#d38d1e",
          600: "#b56e17",
          700: "#905117",
          800: "#774119",
          900: "#663719",
          950: "#3a1c0c",
        },
        danger: {
          50: "#fdf3f3",
          500: "#d64545",
          600: "#b93636",
          700: "#992c2c",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
