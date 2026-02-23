/**
 * Utility functions for color manipulation and contrast calculation.
 * Follows WCAG 2.0 guidelines for relative luminance and contrast ratios.
 */

// Helper to convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const cleanHex = hex.replace('#', '');
  const isValid = /^[0-9A-Fa-f]{6}$/.test(cleanHex) || /^[0-9A-Fa-f]{3}$/.test(cleanHex);

  if (!isValid) return null;

  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return { r, g, b };
};

// Calculate relative luminance
// https://www.w3.org/TR/WCAG20/#relativeluminancedef
const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Determines whether text should be light or dark based on background color.
 * Uses a standard threshold (approx 128/255 logic adjusted for perception) or contrast ratio.
 * 
 * @param backgroundColor - The hex color code of the background (e.g., "#DBAA3D")
 * @param lightColor - The color to return if background is dark (default: "#FFFFFF")
 * @param darkColor - The color to return if background is light (default: "#222222")
 * @returns The appropriate text color (lightColor or darkColor)
 */
export const getContrastText = (
  backgroundColor: string,
  lightColor: string = '#FFFFFF',
  darkColor: string = '#222222'
): string => {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return darkColor; // Default to dark text if invalid color

  // Alternative simple brightness formula (Perceived brightness)
  // brightness = (r * 299 + g * 587 + b * 114) / 1000
  // If brightness > 128 -> dark text, else light text
  
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  
  return brightness > 128 ? darkColor : lightColor;
};

/**
 * Calculates the exact contrast ratio between two colors.
 * Useful for checking WCAG compliance (AA = 4.5:1, AAA = 7:1)
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

// Example usage and common colors from the app
export const ThemeColors = {
  Primary: '#dbaa3d',     // Brand Gold
  PrimaryDark: '#b5831f', // Dark Gold
  Surface: '#ffffff',     // White
  Background: '#f1f3f5',  // Light Grey
  Text: '#222222',        // Dark Text
  Error: '#d32f2f'        // Red
};
