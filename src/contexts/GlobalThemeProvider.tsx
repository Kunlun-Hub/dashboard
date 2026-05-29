"use client";

import "react-loading-skeleton/dist/skeleton.css";
import * as React from "react";
import { SkeletonTheme } from "react-loading-skeleton";

export function GlobalThemeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SkeletonTheme baseColor={"#25282d"} highlightColor={"#33373e"}>{children}</SkeletonTheme>;
}
