import { useRef, useCallback } from "react";

export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
) {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  return useCallback(
    (...args: Parameters<T>) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), ms);
    },
    [fn, ms]
  );
}
