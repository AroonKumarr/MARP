/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#E6E2D8",
        workspace: "#F7F5EC",
        sidebar: "#111111",
        cardDark: "#111111",
        textPrimary: "#171717",
        textSecondary: "#77746F",
        textMuted: "#9E9B95",
        borderSubtle: "#E5E1D8",
        accentLime: {
          DEFAULT: "#D9F66A",
          dark: "#3E520A",
          light: "#E2F87A",
        },
        accentPeriwinkle: {
          DEFAULT: "#91ACF8",
          dark: "#1E3A8A",
          light: "#B8C9FA",
        },
        accentLavender: {
          DEFAULT: "#B6A0F3",
          dark: "#3B2A6B",
          light: "#D2C5F8",
        },
        accentMint: {
          DEFAULT: "#9DD9C7",
          dark: "#164E43",
          light: "#C0E8DD",
        },
        accentOrange: {
          DEFAULT: "#F2B77C",
          dark: "#7C2D12",
          light: "#F7D1AB",
        },
      },
      borderRadius: {
        workspace: "32px",
        sidebar: "28px",
        cardLarge: "24px",
        card: "20px",
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(23, 23, 23, 0.04), 0 2px 6px -1px rgba(23, 23, 23, 0.02)",
        softHover: "0 10px 25px -4px rgba(23, 23, 23, 0.08), 0 4px 10px -2px rgba(23, 23, 23, 0.04)",
        darkCard: "0 10px 30px -5px rgba(0, 0, 0, 0.35)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        urdu: ["'Noto Nastaliq Urdu'", "'Jameel Noori Nastaleeq'", "serif"],
      },
    },
  },
  plugins: [],
};
