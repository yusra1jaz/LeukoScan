/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true, // ensures Tailwind overrides other CSS
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Base background + text colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Primary & Secondary
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",

        // Status colors
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
        success: "hsl(var(--success))",
        "success-foreground": "hsl(var(--success-foreground))",
        warning: "hsl(var(--warning))",
        "warning-foreground": "hsl(var(--warning-foreground))",

        // Components
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
      },

      backgroundImage: {
        "hero-gradient": "linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary-hover)))",
      },

      boxShadow: {
        medical: "var(--medical-shadow)",
        card: "var(--card-shadow)",
      },

      borderRadius: {
        lg: "var(--radius)",
      },
    },
  },
  plugins: [],
};
