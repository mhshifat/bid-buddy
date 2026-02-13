/* eslint-disable @typescript-eslint/no-explicit-any */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  correlationId?: string;
  userId?: string;
  tenantId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  correlationId?: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name: string;
  };
}

class Logger {
  private static instance: Logger;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatEntry(entry: LogEntry): string {
    if (this.isDevelopment) {
      const parts = [
        `[${entry.timestamp}]`,
        `[${entry.level.toUpperCase()}]`,
        entry.correlationId ? `[${entry.correlationId}]` : "",
        entry.message,
      ].filter(Boolean);

      return parts.join(" ");
    }

    // Production: JSON structured logging (for log aggregation services)
    return JSON.stringify(entry);
  }

  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      correlationId: context?.correlationId,
      context,
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        name: error.name,
      };
    }

    const formatted = this.formatEntry(entry);

    switch (level) {
      case "debug":
        if (this.isDevelopment) {
          console.debug(formatted, context || "");
        }
        break;
      case "info":
        console.info(formatted, context || "");
        break;
      case "warn":
        console.warn(formatted, context || "");
        break;
      case "error":
        console.error(formatted, context || "");
        if (this.isDevelopment && error?.stack) {
          console.error("Stack trace:", error.stack);
        }
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log("error", message, context, error);
  }
}

export const logger = Logger.getInstance();

