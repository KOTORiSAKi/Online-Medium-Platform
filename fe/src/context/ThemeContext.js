import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { flushSync } from "react-dom";

const ThemeContext = createContext({
  theme: "light",
  isDark: false,
  toggleTheme: () => {},
});

function getSystemIsDark() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getStoredScheme() {
  try {
    const val = localStorage.getItem("color-scheme");
    if (val === "dark" || val === "light") return val;
  } catch (e) {}
  return null;
}

function syncDocumentScheme(storedScheme, resolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (root.dataset.theme !== resolvedTheme) {
    root.dataset.theme = resolvedTheme;
  }
  const meta = document.querySelector('meta[name="color-scheme"]');
  const nextMetaContent = storedScheme ?? "light dark";
  if (meta && meta.content !== nextMetaContent) {
    meta.content = nextMetaContent;
  }
}

export function ThemeProvider({ children }) {
  const [storedScheme, setStoredScheme] = useState(() => getStoredScheme());
  const [systemIsDark, setSystemIsDark] = useState(() => getSystemIsDark());
  const activeTransitionRef = useRef(null);

  const resolvedTheme = storedScheme ?? (systemIsDark ? "dark" : "light");
  const isDark = resolvedTheme === "dark";

  // Sync <meta name="color-scheme"> and data-theme on mount & external changes
  useEffect(() => {
    syncDocumentScheme(storedScheme, resolvedTheme);
  }, [storedScheme, resolvedTheme]);

  // Listen to OS prefers-color-scheme changes & cross-tab localStorage changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;

    const handleMediaChange = (e) => {
      setSystemIsDark(e.matches);
    };

    const handleStorageChange = (e) => {
      if (e.key === "color-scheme") {
        const nextStored =
          e.newValue === "dark" || e.newValue === "light" ? e.newValue : null;
        setStoredScheme(nextStored);
      }
    };

    if (mediaQuery && mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
    }
    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (mediaQuery && mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      }
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const toggleTheme = useCallback(
    (clickEvent) => {
      const currentSysDark = getSystemIsDark();
      const currentResolved =
        storedScheme ?? (currentSysDark ? "dark" : "light");
      const targetScheme = currentResolved === "dark" ? "light" : "dark";
      const sysScheme = currentSysDark ? "dark" : "light";

      // Per dark-mode-toggle guidance:
      // If target matches current system preference, remove the stored override so it follows system again.
      // Otherwise store the explicit override ("light" or "dark").
      const nextStored = targetScheme === sysScheme ? null : targetScheme;

      // Measure button coordinates BEFORE any DOM mutations to avoid forced synchronous reflow
      let x = window.innerWidth - 60;
      let y = 40;
      const btnEl = clickEvent?.currentTarget || null;
      if (btnEl && typeof btnEl.getBoundingClientRect === "function") {
        const rect = btnEl.getBoundingClientRect();
        x = Math.round(rect.left + rect.width / 2);
        y = Math.round(rect.top + rect.height / 2);
      } else if (
        clickEvent &&
        typeof clickEvent.clientX === "number" &&
        typeof clickEvent.clientY === "number"
      ) {
        x = Math.round(clickEvent.clientX);
        y = Math.round(clickEvent.clientY);
      }

      const maxRadius = Math.ceil(
        Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y),
        ),
      );

      // Persist to localStorage asynchronously off the critical rendering path
      const persistAsync = () => {
        setTimeout(() => {
          try {
            if (nextStored === null) {
              localStorage.removeItem("color-scheme");
            } else {
              localStorage.setItem("color-scheme", nextStored);
            }
          } catch (e) {}
        }, 0);
      };

      const applyState = () => {
        syncDocumentScheme(nextStored, targetScheme);
        flushSync(() => {
          setSystemIsDark(currentSysDark);
          setStoredScheme(nextStored);
        });
      };

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (
        typeof document === "undefined" ||
        !document.startViewTransition ||
        prefersReducedMotion
      ) {
        applyState();
        persistAsync();
        return;
      }

      // If a previous transition is still running, skip it cleanly to prevent frame queuing
      if (activeTransitionRef.current) {
        try {
          activeTransitionRef.current.skipTransition();
        } catch (e) {}
        activeTransitionRef.current = null;
      }

      // Freeze element CSS transitions before taking snapshots so the new state paints in 1 single pass
      const root = document.documentElement;
      root.classList.add("theme-transitioning");

      const transition = document.startViewTransition(() => {
        applyState();
      });
      activeTransitionRef.current = transition;

      transition.ready
        .then(() => {
          root.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${maxRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 500,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              pseudoElement: "::view-transition-new(root)",
            },
          );
        })
        .catch(() => {});

      transition.finished
        .catch(() => {})
        .finally(() => {
          if (activeTransitionRef.current === transition) {
            activeTransitionRef.current = null;
            root.classList.remove("theme-transitioning");
          }
          persistAsync();
        });
    },
    [storedScheme],
  );

  const contextValue = useMemo(
    () => ({ theme: resolvedTheme, isDark, toggleTheme }),
    [resolvedTheme, isDark, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}


