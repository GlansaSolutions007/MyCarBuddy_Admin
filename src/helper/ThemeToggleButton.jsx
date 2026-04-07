/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";

const ThemeToggleButton = ({ className = "" }) => {
  // 1. Initialize state for the current theme
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  // 2. Function to update the theme on the HTML element
  const updateThemeOnHtmlEl = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
  };

  // 4. On initial render, set the theme from localStorage
  useEffect(() => {
    updateThemeOnHtmlEl(theme);
  }, [theme]);

  // 5. Toggle theme when button is clicked
  const handleThemeToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeOnHtmlEl(newTheme);
  };

  return (
    <button
      type="button"
      data-theme-toggle
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
      className={`${className} topbar-theme-button`.trim()}
      onClick={handleThemeToggle}
    >
      <Icon
        icon={theme === "dark" ? "line-md:sunny-outline-to-moon-loop-transition" : "line-md:moon-alt-to-sunny-outline-loop-transition"}
        className="topbar-icon topbar-theme-icon"
        width="25"
      />
    </button>
  );
};

export default ThemeToggleButton;
