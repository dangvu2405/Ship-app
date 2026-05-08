import { useCallback, useRef, useState } from 'react';

type FilterShape = Record<string, unknown>;

interface UseListFiltersReturn<T extends FilterShape> {
  /** Draft values — what the user is currently editing in the filter bar */
  inputs: T;
  /** Committed values — what the query actually uses */
  applied: T;
  /** Update a single input field without committing to the query */
  setInput: <K extends keyof T>(key: K, value: T[K]) => void;
  /** Commit current inputs → applied, triggering a refetch */
  apply: () => void;
  /** Reset both inputs and applied back to initial values */
  clear: () => void;
}

/**
 * Manages the two-phase filter state used by every List Page:
 * draft inputs (what user edits) and applied filters (what the query uses).
 *
 * Eliminates the repeated [inputValue, appliedValue] useState pairs
 * and the copy-paste apply/clear handlers across list pages.
 *
 * @example
 * const { inputs, applied, setInput, apply, clear } = useListFilters({
 *   plate: '',
 *   status: undefined as string | undefined,
 *   type: undefined as string | undefined,
 * });
 */
export function useListFilters<T extends FilterShape>(initialValues: T): UseListFiltersReturn<T> {
  // Freeze initial values on first render so clear() stays stable
  const initialRef = useRef<T>(initialValues);

  const [inputs, setInputs] = useState<T>(() => ({ ...initialRef.current }));
  const [applied, setApplied] = useState<T>(() => ({ ...initialRef.current }));

  const setInput = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Read current inputs inside the setState callback to avoid stale closure.
  // apply() is stable — safe to put in dependency arrays.
  const apply = useCallback(() => {
    setInputs((current) => {
      setApplied({ ...current });
      return current;
    });
  }, []);

  const clear = useCallback(() => {
    const initial = { ...initialRef.current };
    setInputs(initial);
    setApplied(initial);
  }, []);

  return { inputs, applied, setInput, apply, clear };
}
