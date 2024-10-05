import { createContext } from "react";
import { ThemeContextType } from "./types";

export const ThemeContext = createContext<ThemeContextType>({
  currentTheme: 'yellow',
  setCurrentTheme: () => {}
})