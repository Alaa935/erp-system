import { useRef, useCallback } from 'react';
import { useMutation, useQueryClient, type UseMutationOptions, type MutationFunction, type UseMutationResult } from '@tanstack/react-query';

export interface ProtectedMutationOptions<TData, TError, TVariables, TContext>
  extends UseMutationOptions<TData, TError, TVariables, TContext> {
  invalidates?: string[][];
}

export function useProtectedMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  mutationFn: MutationFunction<TData, TVariables>,
  options?: ProtectedMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> & { isPendingRef: React.RefObject<boolean> } {
  const qc = useQueryClient();
  const busyRef = useRef(false);

  const wrappedFn = useCallback(async (vars: TVariables, context: any): Promise<TData> => {
    if (busyRef.current) {
      throw new Error('DUPLICATE_CALL');
    }
    busyRef.current = true;
    try {
      return await mutationFn(vars, context);
    } finally {
      busyRef.current = false;
    }
  }, [mutationFn]);

  const mutation = useMutation({
    ...options,
    mutationFn: wrappedFn,
    onSuccess: async (data: any, variables: any, context?: any, extra?: any) => {
      if (options?.invalidates) {
        await Promise.all(
          options.invalidates.map(key =>
            qc.invalidateQueries({ queryKey: key, refetchType: 'all' }),
          ),
        );
      }
      options?.onSuccess?.(data, variables, context, extra);
    },
  });

  return Object.assign(mutation, { isPendingRef: busyRef });
}
