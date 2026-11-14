type LogFields = Record<string, string | number | boolean | null>;

function write(level: "info" | "warn" | "error", message: string, fields?: LogFields): void {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  const line = JSON.stringify({
    level,
    message,
    ...fields,
    timestamp: new Date().toISOString(),
  });
  process.stdout.write(`${line}\n`);
}

export const logger = {
  info: (message: string, fields?: LogFields): void => write("info", message, fields),
  warn: (message: string, fields?: LogFields): void => write("warn", message, fields),
  error: (message: string, fields?: LogFields): void => write("error", message, fields),
};
