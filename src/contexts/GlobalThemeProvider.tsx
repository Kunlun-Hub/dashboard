"use client";

import "react-loading-skeleton/dist/skeleton.css";
import { ThemeProvider, useTheme } from "next-themes";
import * as React from "react";
import { SkeletonTheme } from "react-loading-skeleton";

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
      disableTransitionOnChange
    >
      <SkeletonColors>{children}</SkeletonColors>
    </ThemeProvider>
  );
}

function SkeletonColors({ children }: Readonly<{ children: React.ReactNode }>) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <SkeletonTheme
      baseColor={isDark ? "#25282d" : "#e5e7eb"}
      highlightColor={isDark ? "#33373e" : "#f3f4f6"}
    >
      {children}
    </SkeletonTheme>
  );
}
