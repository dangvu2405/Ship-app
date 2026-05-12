import { ReportRow } from '../types';

interface Summary {
  total: number;
  average: number;
}

/**
 * Calculates summary statistics for a specific column in the report data.
 * @param data - The array of report rows.
 * @param columnKey - The key of the column to summarize.
 * @returns An object containing the total and average.
 */
export const calculateSummary = (
  data: ReportRow[],
  columnKey: string
): Summary => {
  if (!data || data.length === 0) {
    return { total: 0, average: 0 };
  }

  const total = data.reduce((sum, row) => {
    const value = parseFloat(row[columnKey]);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);

  const average = total / data.length;

  return { total, average };
};
