import { useMemo } from 'react';

/**
 * ZodFormBridge — Zod validator for AntD Form.
 *
 * Why: AntD's native `<ValidationRule>` watchers get noisy after a few rules per field,
 * and they can't easily express cross-field rules ("password === confirm"). Zod has those
 * for free. We want one schema at the top of the file and AntD Forms that Just Work.
 *
 * Alternative: react-hook-form + @hookform/resolvers/zod. Rejected — we already pull in
 * antd, and react-hook-form against antd inputs requires custom registration wrappers
 * for every control. Using AntD Form keeps the JSX idiomatic for anyone who has worked
 * with AntD before; the only adaptation is the validator.
 *
 * `zodValidator(schema)` returns an AntD validator that looks up `rule.field` in
 * `schema.shape` and validates that field's sub-schema against the *single* field
 * value AntD passed in. It does NOT parse the whole form — AntD's field-level
 * validators are called with one field's value, not the entire object. The whole-form
 * check still happens implicitly because each Form.Item runs its own validator; if
 * every field's sub-schema passes, the whole-form schema passes too (Zod object
 * schemas compose field-by-field for non-strict parsing).
 *
 * Fields not present in `schema.shape` succeed silently — that lets us attach the
 * validator to fields whose validation is owned by other rules (e.g., `required`,
 * `type: 'email'`) without doubling the work. It also means nested-name fields
 * (e.g. `workingHours.end`) skip Zod — those should use AntD's `getFieldValue`
 * cross-field validator pattern directly, as the reset-password modal already does.
 */
export function zodValidator(schema) {
  return (rule, value) => {
    const fieldName = rule?.field;
    const fieldSchema = fieldName ? schema?.shape?.[fieldName] : null;
    if (!fieldSchema) return Promise.resolve();
    const result = fieldSchema.safeParse(value);
    if (result.success) return Promise.resolve();
    const issues = result.error.issues;
    return Promise.reject(new Error(issues[0]?.message ?? 'Validation failed'));
  };
}

export function useZodFormHelpers(schema) {
  return useMemo(
    () => ({
      validateMessages: { default: 'Validation failed' },
      onFinishFailed: ({ errorFields }) => {
        if (typeof window !== 'undefined' && window.console?.debug) {
          window.console.debug('form submit blocked', errorFields);
        }
      },
      schema,
    }),
    [schema],
  );
}
