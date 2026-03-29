"use client";

import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";

export type TimezoneMode = "utc" | "local" | "bd" | "uae";

interface TimezoneContextState {
  mode: TimezoneMode;
  setMode: (mode: TimezoneMode) => void;
  formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string;
}

const TimezoneContext = createContext<TimezoneContextState | null>(null);

const TIMEZONE_CONFIG = {
  utc: { label: "Server (UTC+0)", zone: "UTC" },
  local: { label: "My Local Time", zone: undefined }, // Browser default
  bd: { label: "Bangladesh (UTC+6)", zone: "Asia/Dhaka" },
  uae: { label: "UAE (UTC+4)", zone: "Asia/Dubai" },
};

export function TimezoneProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<TimezoneMode>("utc");

  useEffect(() => {
    const saved = localStorage.getItem("cms_display_timezone");
    if (saved && (saved === "utc" || saved === "local" || saved === "bd" || saved === "uae")) {
      setModeState(saved);
    }
  }, []);

  const setMode = (nextMode: TimezoneMode) => {
    setModeState(nextMode);
    localStorage.setItem("cms_display_timezone", nextMode);
  };

  const formatDate = (date: string | Date, options: Intl.DateTimeFormatOptions = {}) => {
    const value = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(value.getTime())) {
      return "Invalid date";
    }

    const config = TIMEZONE_CONFIG[mode];
    
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: config.zone,
      timeZoneName: "short",
      ...options,
    }).format(value);
  };

  return (
    <TimezoneContext.Provider value={{ mode, setMode, formatDate }}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error("useTimezone must be used within a TimezoneProvider");
  }
  return context;
}

export const TIMEZONE_OPTIONS = Object.entries(TIMEZONE_CONFIG).map(([key, config]) => ({
  label: config.label,
  value: key,
}));
