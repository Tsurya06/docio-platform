import { useMemo } from 'react';
import type { ZodTypeAny } from 'zod';

/**
 * ZodFormBridge — Zod validator for AntD Form.
 * Includes a built-in debounce to prevent flashing errors immediately as the user types.
 */
export function zodValidator(schema: ZodTypeAny, debounceMs = 350) {
  let timeoutId: any = null;
  let currentResolve: (() => void) | null = null;

  return (rule: any, value: unknown): Promise<void> => {
    const fieldName = rule?.field;
    if (!fieldName) return Promise.resolve();

    // Cancel the previous pending validation timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      // Quietly resolve previous validation so it does not block the pipeline
      if (currentResolve) currentResolve();
    }

    return new Promise<void>((resolve, reject) => {
      currentResolve = resolve;

      timeoutId = setTimeout(() => {
        let targetSchema = schema;
        while (targetSchema && '_def' in targetSchema && (targetSchema as any)._def.schema) {
          targetSchema = (targetSchema as any)._def.schema;
        }

        const shape = (targetSchema as any).shape;
        const fieldSchema = shape ? shape[fieldName] : null;

        if (!fieldSchema) {
          resolve();
          return;
        }

        const result = fieldSchema.safeParse(value);
        if (result.success) {
          resolve();
        } else {
          const issues = result.error.issues;
          reject(new Error(issues[0]?.message ?? 'Validation failed'));
        }
      }, debounceMs);
    });
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
