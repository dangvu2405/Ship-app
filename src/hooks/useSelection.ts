import { useCallback, useMemo, useState } from 'react'
import type { Key } from 'react'
import type { TableRowSelection } from 'antd/es/table/interface'

export function useSelection<T extends object>() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [selectedRows, setSelectedRows] = useState<T[]>([])

  const clearSelection = useCallback(() => {
    setSelectedRowKeys([])
    setSelectedRows([])
  }, [])

  const rowSelection = useMemo<TableRowSelection<T>>(
    () => ({
      selectedRowKeys,
      onChange: (keys, rows) => {
        setSelectedRowKeys(keys)
        setSelectedRows(rows)
      },
    }),
    [selectedRowKeys],
  )

  return {
    selectedRowKeys,
    selectedRows,
    setSelectedRowKeys,
    setSelectedRows,
    clearSelection,
    rowSelection,
  }
}