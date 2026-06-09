/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/client/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1418",
        panel: "#10212b",
        panel2: "#16303c",
        parchment: "#f1e7cf",
        amber: "#e8a33d",
        amberbright: "#f7c65f",
        teal: "#4bb3a7",
        muted: "#86a0a6",
        danger: "#e3705e",
      },
      fontFamily: {
        display: ['"Fraunces"', "serif"],
        body: ['"Hanken Grotesk"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(232,163,61,0.0)" },
          "50%": { boxShadow: "0 0 28px 2px rgba(232,163,61,0.25)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.2,0.7,0.2,1) both",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
