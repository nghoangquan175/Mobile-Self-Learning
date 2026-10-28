import { createContext, useContext, useState } from "react";
import { Platform, useColorScheme } from "react-native";

// The web's colour tokens (QuanNH-Landing styles/includes/_theme.scss).
const dark = {
  bg: "#07080b",
  panel: "#0f1117",
  panel2: "#0a0c11",
  line: "#1f2330",
  text: "#e9ecf3",
  muted: "#8a91a3",
  accent: "#7cf5c4",
  onAccent: "#04120c",
  glow: "rgba(124, 245, 196, 0.22)",
  titleB: "#b9f7de",
};

const light: typeof dark = {
  bg: "#fbfaff",
  panel: "#ffffff",
  panel2: "#f3f1ff",
  line: "#e4e0f7",
  text: "#16142b",
  muted: "#6b6884",
  accent: "#6d5dfc",
  onAccent: "#ffffff",
  glow: "rgba(124, 108, 255, 0.22)",
  titleB: "#6d5dfc",
};

export type Colors = typeof dark;
type Scheme = "light" | "dark";

const ThemeContext = createContext<{ scheme: Scheme; toggle: () => void }>({ scheme: "dark", toggle: () => {} });

/** Follows the phone's setting until the header toggle picks one, as on the web. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme() === "light" ? "light" : "dark";
  const [picked, setPicked] = useState<Scheme | null>(null);
  const scheme = picked ?? system;
  return <ThemeContext.Provider value={{ scheme, toggle: () => setPicked(scheme === "light" ? "dark" : "light") }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useColors(): Colors {
  return useTheme().scheme === "light" ? light : dark;
}

export const fonts = {
  mono: Platform.select({ ios: "Menlo", default: "monospace" }),
};
