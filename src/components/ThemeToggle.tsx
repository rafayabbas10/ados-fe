"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  isCollapsed?: boolean;
}

export function ThemeToggle({ isCollapsed = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    // Default to dark theme instead of system preference
    const initialTheme = savedTheme || "dark";
    
    setTheme(initialTheme);
    // Apply light class for light theme, remove for dark theme (since dark is default)
    if (initialTheme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Don't render until theme is determined to prevent flash
  if (theme === null) {
    return (
      <Button 
        variant="outline" 
        size={isCollapsed ? "icon" : "sm"} 
        className={isCollapsed ? "h-8 w-8" : "gap-2"} 
        disabled
      >
        <div className="h-4 w-4" />
        {!isCollapsed && "Theme"}
      </Button>
    );
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    // Apply light class for light theme, remove for dark theme
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  };

  if (isCollapsed) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="h-8 w-8"
        title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
      >
        {theme === "light" ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="gap-2 w-full"
    >
      {theme === "light" ? (
        <>
          <Moon className="h-4 w-4" />
          Dark
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
          Light
        </>
      )}
    </Button>
  );
}
