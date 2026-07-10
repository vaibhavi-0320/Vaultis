export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  // The app already ships its own hand-written reset/base styles in style.css.
  // Disable Tailwind's preflight so enabling utility classes doesn't also
  // silently change unrelated element defaults (headings, forms, etc.).
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      // Mapped directly to the CSS custom properties defined in src/style.css,
      // which are the actual source of truth for the app's palette.
      colors: {
        "bg-primary": "var(--bg-primary)",
        "bg-secondary": "var(--bg-secondary)",
        "bg-card": "var(--bg-card)",
        "border-default": "var(--border)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "accent-blue": "var(--accent-blue)",
        "accent-green": "var(--accent-green)",
        "accent-amber": "var(--accent-amber)",
        "accent-red": "var(--accent-red)",
        "accent-purple": "var(--accent-purple)",
      },
    },
  },
  plugins: [],
};
