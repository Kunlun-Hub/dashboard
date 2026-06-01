"use client";

import "@xterm/xterm/css/xterm.css";
import { cn } from "@utils/helpers";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { brandColorAppliedEvent } from "@/modules/account/accountBranding";

const getBrandColor = (
  shade: 200 | 300 | 500 | 600 | 700,
  fallback: string,
) => {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--cloink-brand-${shade}`)
    .trim();
  return value ? `rgb(${value})` : fallback;
};

const createTerminalTheme = (mode: "dark" | "light") => {
  if (mode === "light") {
    return {
      background: "#ffffff",
      foreground: "#171717",
      cursor: getBrandColor(500, "#e55311"),
      selectionBackground: "#e5e7eb",
      black: "#171717",
      red: "#dc2626",
      green: "#047857",
      yellow: "#a16207",
      blue: getBrandColor(600, "#e55311"),
      magenta: "#7e22ce",
      cyan: "#0e7490",
      white: "#f5f5f5",
      brightBlack: "#737373",
      brightRed: "#b91c1c",
      brightGreen: "#065f46",
      brightYellow: "#854d0e",
      brightBlue: getBrandColor(700, "#be3e10"),
      brightMagenta: "#6b21a8",
      brightCyan: "#155e75",
      brightWhite: "#ffffff",
    };
  }

  return {
    background: "#181a1d",
    foreground: "#e4e7e9",
    cursor: "#e4e7e9",
    selectionBackground: "#3f444b",
    black: "#181a1d",
    red: "#f87171",
    green: "#34d399",
    yellow: "#facc15",
    blue: getBrandColor(300, "#fab677"),
    magenta: "#c084fc",
    cyan: "#22d3ee",
    white: "#e4e7e9",
    brightBlack: "#616e79",
    brightRed: "#fca5a5",
    brightGreen: "#86efac",
    brightYellow: "#fde047",
    brightBlue: getBrandColor(200, "#ffd4a6"),
    brightMagenta: "#d8b4fe",
    brightCyan: "#67e8f9",
    brightWhite: "#ffffff",
  };
};

type TerminalTheme = ReturnType<typeof createTerminalTheme>;

const DEFAULT_TERMINAL_THEME = createTerminalTheme("dark");

const TERMINAL_OPTIONS = {
  theme: DEFAULT_TERMINAL_THEME,
  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
  fontSize: 13,
  cursorBlink: true,
  convertEol: true,
  scrollback: 1000,
  allowTransparency: true,
};

interface TerminalWithCore {
  _core?: { _isDisposed: boolean };
  options: { theme?: TerminalTheme };
  dispose(): void;
  write(data: string | Uint8Array): void;
  writeln(data: string): void;
  onData(callback: (data: string) => void): void;
  onResize(callback: (event: { cols: number; rows: number }) => void): void;
  focus(): void;
  cols: number;
  rows: number;
}

interface SSHTerminalWrapperProps {
  session: any;
  onResize?: (cols: number, rows: number) => void;
  onClose?: () => void;
  className?: string;
}

export const Terminal = ({
  session,
  onResize,
  onClose,
  className = "",
}: SSHTerminalWrapperProps) => {
  const { resolvedTheme } = useTheme();
  const [brandColorVersion, setBrandColorVersion] = useState(0);
  const terminalMode = resolvedTheme === "light" ? "light" : "dark";
  const terminalTheme = useMemo(() => {
    void brandColorVersion;
    return createTerminalTheme(terminalMode);
  }, [brandColorVersion, terminalMode]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<{
    terminal: TerminalWithCore;
    fitAddon: any;
  } | null>(null);
  const handlersSetRef = useRef(false);

  const fitTerminal = useCallback(() => {
    if (terminalInstanceRef.current?.fitAddon) {
      terminalInstanceRef.current.fitAddon.fit();
    }
  }, []);

  const initializeTerminal = useCallback(async () => {
    if (terminalInstanceRef.current || !terminalRef.current) return;

    const { Terminal: XTerminal } = await import("@xterm/xterm");
    const { FitAddon } = await import("@xterm/addon-fit");

    const terminal = new XTerminal({
      ...TERMINAL_OPTIONS,
      theme: terminalTheme,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    if (!terminalRef.current) return;
    terminalRef.current.innerHTML = "";
    terminal.open(terminalRef.current);

    // Set terminal focus behavior
    const terminalElement = terminalRef.current.querySelector(
      ".xterm",
    ) as HTMLElement;
    if (terminalElement) {
      terminalElement.setAttribute("tabindex", "0");
      terminalElement.addEventListener("click", () => terminal.focus());
      terminalElement.addEventListener("keydown", (e) => e.stopPropagation());
    }

    terminalInstanceRef.current = {
      terminal: terminal as TerminalWithCore,
      fitAddon,
    };

    // Initial fit with delay to ensure proper sizing
    setTimeout(fitTerminal, 100);

    return terminal as TerminalWithCore;
  }, [fitTerminal, terminalTheme]);

  useEffect(() => {
    const terminal = terminalInstanceRef.current?.terminal;
    if (!terminal || terminal._core?._isDisposed) return;
    terminal.options.theme = terminalTheme;
  }, [terminalTheme]);

  useEffect(() => {
    const refreshBrandColors = () => {
      setBrandColorVersion((version) => version + 1);
    };

    window.addEventListener(brandColorAppliedEvent, refreshBrandColors);
    return () =>
      window.removeEventListener(brandColorAppliedEvent, refreshBrandColors);
  }, []);

  const setupSSHHandlers = useCallback(async () => {
    if (!session || handlersSetRef.current) return;

    const terminal = await initializeTerminal();
    if (!terminal) return;

    handlersSetRef.current = true;

    // Setup terminal event handlers
    terminal.onData((data: string) => session?.write?.(data));
    terminal.onResize(({ cols, rows }: { cols: number; rows: number }) => {
      session?.resize?.(cols, rows);
      onResize?.(cols, rows);
    });

    // Setup SSH event handlers
    session.ondata = (data: Uint8Array) => {
      if (!terminal._core?._isDisposed) {
        terminal.write(new Uint8Array(data));
      }
    };

    const originalOnClose = session.onclose;
    session.onclose = () => {
      if (!terminal._core?._isDisposed) {
        terminal.writeln("\r\n*** Connection closed ***");
      }
      handlersSetRef.current = false;
      originalOnClose?.();
      onClose?.();
    };

    // Final setup with proper sizing
    setTimeout(() => {
      if (
        terminalInstanceRef.current?.fitAddon &&
        !terminal._core?._isDisposed
      ) {
        fitTerminal();
        session?.resize?.(terminal.cols, terminal.rows);
        terminal.focus();
      }
    }, 200);
  }, [session, initializeTerminal, onResize, onClose, fitTerminal]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => fitTerminal();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [fitTerminal]);

  // Setup SSH handlers when session changes
  useEffect(() => {
    setupSSHHandlers().then();
  }, [setupSSHHandlers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (terminalInstanceRef.current?.terminal) {
        const terminal = terminalInstanceRef.current.terminal;
        if (!terminal._core?._isDisposed) {
          terminal.dispose();
        }
        terminalInstanceRef.current = null;
      }
      handlersSetRef.current = false;
    };
  }, []);

  return (
    <div
      ref={terminalRef}
      className={cn(
        "w-full h-full flex flex-col m-0 p-0 bg-white text-neutral-900 dark:bg-nb-gray-950 dark:text-nb-gray-100",
        className,
      )}
    />
  );
};
