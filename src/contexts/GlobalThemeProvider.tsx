"use client";

import "react-loading-skeleton/dist/skeleton.css";
import { ThemeProvider, useTheme } from "next-themes";
import * as React from "react";
import { SkeletonTheme } from "react-loading-skeleton";

const LIGHT_THEME_COLOR = "#f9fafb";
const DARK_THEME_COLOR = "#181a1d";

export function GlobalThemeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      enableColorScheme={true}
      disableTransitionOnChange
    >
      <SkeletonColors>{children}</SkeletonColors>
    </ThemeProvider>
  );
}

function SkeletonColors({ children }: Readonly<{ children: React.ReactNode }>) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  React.useEffect(() => {
    const metaSelector = 'meta[name="theme-color"][data-theme-color="dynamic"]';
    const themeColor = isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
    let meta = document.querySelector<HTMLMetaElement>(metaSelector);

    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      meta.setAttribute("data-theme-color", "dynamic");
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", themeColor);
  }, [isDark]);

  return (
    <SkeletonTheme
      baseColor={isDark ? "#25282d" : "#e5e7eb"}
      highlightColor={isDark ? "#33373e" : "#f3f4f6"}
    >
      {children}
    </SkeletonTheme>
  );
}
