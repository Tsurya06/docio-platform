/**
 * Tiny browser logger. Wraps `console` and adds a single piece of polish: a min-level
 * gate sourced from `VITE_LOG_LEVEL` so noisy `debug` calls in production builds are
 * silenced without code edits. Anything below the configured level is dropped.
 *
 * Why not pino-frontend / loglevel: this is the client; we want zero ceremony. The
 * backend already structures logs through pino; on the client we use AntD's message
 * toast for user-visible notifications and this logger for unstructured diagnostics.
 * Future telemetry (Sentry, etc.) would replace `sink`, the only hook here.
 */
const LEVELS = Object.freeze({ debug: 10, info: 20, warn: 30, error: 40 });
const SET_LEVEL = (import.meta.env.VITE_LOG_LEVEL || 'info').toLowerCase();
const MIN_LEVEL = LEVELS[SET_LEVEL] ?? LEVELS.info;

function emit(level, ...args) {
  if (LEVELS[level] < MIN_LEVEL) return;
  const cons = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  cons(`[${level}]`, ...args);
}

export const logger = {
  debug: (...a) => emit('debug', ...a),
  info: (...a) => emit('info', ...a),
  warn: (...a) => emit('warn', ...a),
  error: (...a) => emit('error', ...a),
};

export default logger;
