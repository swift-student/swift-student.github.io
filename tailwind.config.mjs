import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Open Sans", ...defaultTheme.fontFamily.sans],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "full",
          },
        },
      },
      rotate: {
        45: "45deg",
        135: "135deg",
        225: "225deg",
        315: "315deg",
      },
      colors: {
        "shadow-moon": "#1a1b26",
        "void-night": "#1f2335",
        seafoam: "#50d6be",
        bleh: "#f7f9ff",
        "some-blue": "#394b70",

        // tags
        tangerine: "#ff9e64",
        lavender: "#bb9af7",
        "torch-lake": "#2ac3de",
        margarita: "#9ece6a",
        salmon: "#f7768e",
        periwinkle: "#7aa2f7",
        mint: "#b4f9f8",
        "hot-pink": "#ff007c",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
