import { useState } from "react";
import { Moon, Sun } from "lucide-react";

export const ThemeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains("dark"));

  const toggleTheme = () => {
    const next = !isDarkMode;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Navegação privada pode bloquear o storage; o tema só não fica salvo.
    }
    setIsDarkMode(next);
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDarkMode ? "Ativar tema claro" : "Ativar tema escuro"}
      className="relative z-50 rounded-full p-2 transition-colors duration-300 hover:bg-primary/10"
    >
      {isDarkMode ? <Sun className="h-5 w-5 text-gold" /> : <Moon className="h-5 w-5 text-primary" />}
    </button>
  );
};
