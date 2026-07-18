/**
 * Generic Zod validation middleware.
 *
 * Pattern at the route boundary: routes call `validate({ body: schema, query: schema, params: schema })`.
 * On success, parsed values replace the request location so downstream handlers receive coerced,
 * trimmed, defaulted values (no second pass).
 *
 * Implementation note for Express 5: `req.query` is defined as a getter on the prototype with no
 * setter, so `req.query = parsed` throws. `Object.defineProperty` shadows the prototype with an
 * own data property — downstream reads (`req.query`, `req.query.page`) return parsed values.
 *
 * ZodError thrown by `.parse()` propagates to `errorHandler`, which already maps to 400
 * `{ success: false, error: { code: 'VALIDATION_ERROR', details: err.flatten() } }`.
 */
export function validate({ body, query, params } = {}) {
  return (req, _res, next) => {
    if (body) req.body = body.parse(req.body);
    if (query) {
      const parsed = query.parse(req.query);
      Object.defineProperty(req, 'query', {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
    if (params) req.params = params.parse(req.params);
    next();
  };
}
