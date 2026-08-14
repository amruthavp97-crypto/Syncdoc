import { useEffect, useRef } from "react";

export function useDebouncedCallback<T extends (...args: any[]) => void>(callback: T, delay: number) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay);
  };
}
