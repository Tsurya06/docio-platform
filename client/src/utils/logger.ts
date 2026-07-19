/**
 * Tiny browser logger. Wraps `console` and adds a single piece of polish: a min-level
 * gate sourced from `VITE_LOG_LEVEL` so noisy `debug` calls in production builds are
 * silenced without code edits. Anything below the configured level is dropped.
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = Object.freeze({ debug: 10, info: 20, warn: 30, error: 40 });
const SET_LEVEL = ((import.meta.env.VITE_LOG_LEVEL as string) || 'info').toLowerCase() as LogLevel;
const MIN_LEVEL = LEVELS[SET_LEVEL] ?? LEVELS.info;

function emit(level: LogLevel, ...args: unknown[]): void {
  if (LEVELS[level] < MIN_LEVEL) return;
  const cons = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  cons(`[${level}]`, ...args);
}

export const logger = {
  debug: (...a: unknown[]) => emit('debug', ...a),
  info: (...a: unknown[]) => emit('info', ...a),
  warn: (...a: unknown[]) => emit('warn', ...a),
  error: (...a: unknown[]) => emit('error', ...a),
};

export default logger;
