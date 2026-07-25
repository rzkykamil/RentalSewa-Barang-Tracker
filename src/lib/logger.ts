/**
 * Structured JSON logging shared by API route handlers and `worker/`
 * (`docs/technical-spec.md` §7: `info` for key business actions, `error`
 * for caught exceptions). Writes one JSON object per line to stdout/stderr
 * so it can be collected as-is by `docker logs` / any log aggregator.
 */

type LogMeta = Record<string, unknown>;

function write(stream: NodeJS.WriteStream, level: "info" | "warn" | "error", event: string, meta?: LogMeta) {
  stream.write(
    JSON.stringify({
      level,
      event,
      timestamp: new Date().toISOString(),
      ...meta,
    }) + "\n"
  );
}

/** Business-relevant action succeeded (e.g. booking created, reminder sent). */
export function logInfo(event: string, meta?: LogMeta): void {
  write(process.stdout, "info", event, meta);
}

/** Non-fatal anomaly worth surfacing but not an unhandled exception. */
export function logWarn(event: string, meta?: LogMeta): void {
  write(process.stdout, "warn", event, meta);
}

/** Caught exception. `error` is normalized to `message`/`stack`. */
export function logError(event: string, error: unknown, meta?: LogMeta): void {
  write(process.stderr, "error", event, {
    ...meta,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}
