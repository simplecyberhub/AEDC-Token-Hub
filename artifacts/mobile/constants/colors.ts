/**
 * Semantic design tokens for the mobile app.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: "#0D1B2A",
    tint: "#003366",

    // Core surfaces
    background: "#F5F7FA",
    foreground: "#0D1B2A",

    // Cards / elevated surfaces
    card: "#FFFFFF",
    cardForeground: "#0D1B2A",

    // Primary action color (buttons, links, active states)
    primary: "#003366",
    primaryForeground: "#FFFFFF",

    // Secondary / less-emphasis interactive surfaces
    secondary: "#E8EEF7",
    secondaryForeground: "#003366",

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: "#E8EEF7",
    mutedForeground: "#6B7A8D",

    // Accent highlights (badges, selected items, focus rings)
    accent: "#0066CC",
    accentForeground: "#FFFFFF",

    // Destructive actions (delete, error states)
    destructive: "#E53935",
    destructiveForeground: "#FFFFFF",

    // Success actions
    success: "#00A651",
    successForeground: "#FFFFFF",

    // Borders and input outlines
    border: "#DDE3EE",
    input: "#DDE3EE",
  },
  dark: {
    text: "#F5F7FA",
    tint: "#FFFFFF",
    background: "#0D1B2A",
    foreground: "#F5F7FA",
    card: "#1A2E44",
    cardForeground: "#F5F7FA",
    primary: "#0066CC",
    primaryForeground: "#FFFFFF",
    secondary: "#233A54",
    secondaryForeground: "#F5F7FA",
    muted: "#233A54",
    mutedForeground: "#8BA0B8",
    accent: "#0066CC",
    accentForeground: "#FFFFFF",
    destructive: "#E53935",
    destructiveForeground: "#FFFFFF",
    success: "#00A651",
    successForeground: "#FFFFFF",
    border: "#233A54",
    input: "#233A54",
  },
  radius: 12,
};

export default colors;
