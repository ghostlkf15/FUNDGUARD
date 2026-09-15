/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gold: {
          50:  "#FDF9EC",
          100: "#FBF1D1",
          200: "#F7E19B",
          300: "#F1CA63",
          400: "#E9AE30",
          500: "#D4920F",
          600: "#B57108",
          700: "#8E5208",
          800: "#6B3D0B",
          900: "#58320C",
          950: "#331903"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Playfair Display'", "serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(212, 146, 15, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(212, 146, 15, 0.6)" },
        },
        "glow-pulse-ring": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(233, 174, 48, 0.35), 0 0 24px -4px rgba(233,174,48,0.3)" },
          "50%": { boxShadow: "0 0 0 14px rgba(233, 174, 48, 0), 0 0 48px -6px rgba(233,174,48,0.6)" },
        },
        "glow-pulse-emerald": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(74,222,128,0.3), 0 0 20px -4px rgba(74,222,128,0.3)" },
          "50%": { boxShadow: "0 0 0 16px rgba(74,222,128,0), 0 0 40px -6px rgba(74,222,128,0.55)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "float-soft": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "grid-move": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "40px 40px" },
        },
        "flow-x": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        "sweep": {
          "0%": { transform: "translateX(-120%) skewX(-20deg)" },
          "100%": { transform: "translateX(220%) skewX(-20deg)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        "tilt-breath": {
          "0%, 100%": { transform: "perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0)" },
          "50%": { transform: "perspective(1200px) rotateX(1.5deg) rotateY(-2deg) translateZ(0)" },
        },
        "badge-bounce": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-3px) scale(1.03)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shimmer": "shimmer 2.5s infinite linear",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "glow-pulse-ring": "glow-pulse-ring 3s ease-in-out infinite",
        "glow-pulse-emerald": "glow-pulse-emerald 3.2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "float-soft": "float-soft 5s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out both",
        "grid-move": "grid-move 20s linear infinite",
        "flow-x": "flow-x 2.8s linear infinite",
        "sweep": "sweep 4.2s ease-in-out infinite",
        "spin-slow": "spin-slow 26s linear infinite",
        "tilt-breath": "tilt-breath 7s ease-in-out infinite",
        "badge-bounce": "badge-bounce 3.4s ease-in-out infinite",
      },
      boxShadow: {
        "gold": "0 0 30px rgba(212, 146, 15, 0.35)",
        "gold-lg": "0 0 60px rgba(212, 146, 15, 0.5)",
        "inner-gold": "inset 0 0 20px rgba(212, 146, 15, 0.1)",
      },
      backgroundImage: {
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
        "radial-gold": "radial-gradient(ellipse at top, rgba(212,146,15,0.15), transparent 60%)",
        "grid-gold": "linear-gradient(rgba(212,146,15,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(212,146,15,0.05) 1px, transparent 1px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
