import dayjs from 'dayjs';

/**
 * Formats a date string into a more readable format.
 * @param date - The date string to format.
 * @param format - The desired output format (e.g., 'YYYY-MM-DD').
 * @returns The formatted date string.
 */
export const formatDate = (
  date: string | Date,
  format = 'YYYY-MM-DD HH:mm:ss'
): string => {
  if (!date) return '';
  return dayjs(date).format(format);
};

/**
 * Parses a date string into a Dayjs object.
 * @param dateStr - The date string to parse.
 * @returns A Dayjs object.
 */
export const parseDate = (dateStr: string): dayjs.Dayjs => {
  return dayjs(dateStr);
};
