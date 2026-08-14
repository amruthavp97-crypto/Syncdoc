/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#07080f",
          900: "#0b0e1a",
          850: "#0f1224",
          800: "#141833",
          700: "#1b2044",
        },
        ink: {
          100: "#f3f4fb",
          300: "#c7c9de",
          500: "#8b90ae",
          700: "#565b7d",
        },
        brand: {
          violet: "#7c5cff",
          indigo: "#5b6ee8",
          blue: "#3e7bfa",
          cyan: "#4fd0e8",
        },
        accent: {
          success: "#3ddc97",
          warning: "#f7b955",
          danger: "#ff6b6b",
        },
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #7c5cff 0%, #5b6ee8 45%, #3e7bfa 100%)",
        "aurora": "radial-gradient(60% 60% at 20% 20%, rgba(124,92,255,0.25) 0%, transparent 60%), radial-gradient(50% 50% at 80% 30%, rgba(62,123,250,0.22) 0%, transparent 60%), radial-gradient(60% 60% at 50% 90%, rgba(79,208,232,0.15) 0%, transparent 60%)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.35)",
        "glow-violet": "0 0 40px rgba(124,92,255,0.35)",
      },
      backdropBlur: { xs: "2px" },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "gradient-x": "gradient-x 6s ease infinite",
      },
    },
  },
  plugins: [],
};
