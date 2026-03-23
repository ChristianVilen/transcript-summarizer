type Level = "info" | "warn" | "error";
type Context = Record<string, unknown>;

function write(level: Level, message: string, context?: Context): void {
  const entry = { time: new Date().toISOString(), level, message, ...context };
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(JSON.stringify(entry));
}

export const logger = {
  info: (message: string, context?: Context) => write("info", message, context),
  warn: (message: string, context?: Context) => write("warn", message, context),
  error: (message: string, context?: Context) => write("error", message, context),
};
