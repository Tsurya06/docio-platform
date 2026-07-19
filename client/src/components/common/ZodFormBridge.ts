import { useMemo } from 'react';
import type { ZodTypeAny } from 'zod';

/**
 * ZodFormBridge — Zod validator for AntD Form.
 */
export function zodValidator(schema: ZodTypeAny) {
  return (rule: any, value: unknown): Promise<void> => {
    const fieldName = rule?.field;
    if (!fieldName) return Promise.resolve();

    let targetSchema = schema;
    while (targetSchema && '_def' in targetSchema && (targetSchema as any)._def.schema) {
      targetSchema = (targetSchema as any)._def.schema;
    }

    const shape = (targetSchema as any).shape;
    const fieldSchema = shape ? shape[fieldName] : null;

    if (!fieldSchema) return Promise.resolve();
    const result = fieldSchema.safeParse(value);
    if (result.success) return Promise.resolve();
    const issues = result.error.issues;
    return Promise.reject(new Error(issues[0]?.message ?? 'Validation failed'));
  };
}

export function useZodFormHelpers(schema: ZodTypeAny) {
  return useMemo(
    () => ({
      validateMessages: { default: 'Validation failed' },
      onFinishFailed: ({ errorFields }: { errorFields: unknown[] }) => {
        if (typeof window !== 'undefined' && window.console?.debug) {
          window.console.debug('form submit blocked', errorFields);
        }
      },
      schema,
    }),
    [schema],
  );
}
