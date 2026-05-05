import { useCallback } from 'react'
import dayjs from 'dayjs'

type UseDateTimeOptions = {
  dateFormat?: string
  dateTimeFormat?: string
}

export function useDateTime(options: UseDateTimeOptions = {}) {
  const dateFormat = options.dateFormat ?? 'DD/MM/YYYY'
  const dateTimeFormat = options.dateTimeFormat ?? 'DD/MM/YYYY HH:mm'

  const parse = useCallback((value: dayjs.ConfigType) => dayjs(value), [])

  const formatDate = useCallback(
    (value: dayjs.ConfigType) => {
      const parsed = parse(value)
      return parsed.isValid() ? parsed.format(dateFormat) : '—'
    },
    [dateFormat, parse],
  )

  const formatDateTime = useCallback(
    (value: dayjs.ConfigType) => {
      const parsed = parse(value)
      return parsed.isValid() ? parsed.format(dateTimeFormat) : '—'
    },
    [dateTimeFormat, parse],
  )

  const diff = useCallback((from: dayjs.ConfigType, to: dayjs.ConfigType, unit: string = 'day') => {
    const start = parse(from)
    const end = parse(to)
    if (!start.isValid() || !end.isValid()) return 0
    return end.diff(start, unit as never)
  }, [parse])

  const isBefore = useCallback((value: dayjs.ConfigType, other: dayjs.ConfigType) => {
    const current = parse(value)
    const compare = parse(other)
    return current.isValid() && compare.isValid() ? current.isBefore(compare) : false
  }, [parse])

  const isAfter = useCallback((value: dayjs.ConfigType, other: dayjs.ConfigType) => {
    const current = parse(value)
    const compare = parse(other)
    return current.isValid() && compare.isValid() ? current.isAfter(compare) : false
  }, [parse])

  return {
    parse,
    formatDate,
    formatDateTime,
    diff,
    isBefore,
    isAfter,
    dayjs,
  }
}