import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PortfolioProvider } from "@/lib/portfolio";
import { ThemeProvider, useColors, useTheme } from "@/lib/theme";

function Screens() {
  const c = useColors();
  const { scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === "light" ? "dark" : "light"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <PortfolioProvider>
        <Screens />
      </PortfolioProvider>
    </ThemeProvider>
  );
}
