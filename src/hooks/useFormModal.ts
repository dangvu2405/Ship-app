import { useCallback, useMemo, useState } from 'react'
import type { FormInstance } from 'antd'

type FormValues<T extends object> = Parameters<FormInstance<T>['setFieldsValue']>[0]

type UseFormModalOptions<T extends object> = {
  form?: FormInstance<T>
  initialValues?: FormValues<T>
}

export function useFormModal<T extends object>({ form, initialValues }: UseFormModalOptions<T> = {}) {
  const [open, setOpen] = useState(false)
  const [record, setRecord] = useState<T | null>(null)

  const isEditMode = record !== null

  const applyInitialValues = useCallback(() => {
    if (!form) return
    form.setFieldsValue((initialValues ?? {}) as FormValues<T>)
  }, [form, initialValues])

  const openCreate = useCallback(() => {
    setRecord(null)
    setOpen(true)
    form?.resetFields()
    applyInitialValues()
  }, [applyInitialValues, form])

  const openEdit = useCallback(
    (nextRecord: T) => {
      setRecord(nextRecord)
      setOpen(true)
      form?.setFieldsValue(nextRecord)
    },
    [form],
  )

  const close = useCallback(() => {
    setOpen(false)
    setRecord(null)
    form?.resetFields()
  }, [form])

  const setFormValues = useCallback(
    (values: FormValues<T>) => {
      form?.setFieldsValue(values)
    },
    [form],
  )

  return useMemo(
    () => ({
      open,
      setOpen,
      record,
      isEditMode,
      mode: isEditMode ? ('edit' as const) : ('create' as const),
      openCreate,
      openEdit,
      close,
      setFormValues,
      resetForm: close,
    }),
    [close, isEditMode, open, openCreate, openEdit, record, setFormValues],
  )
}