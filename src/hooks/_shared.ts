import type { CrudFilter, CrudSort } from '@refinedev/core'
import { Upload } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { antdUtils } from '@/utils/antdGlobal'

export function safeMessage() {
  try {
    return antdUtils.getMessage()
  } catch {
    return undefined
  }
}

export function safeModal() {
  try {
    return antdUtils.getModal()
  } catch {
    return undefined
  }
}

export function showSuccess(content: string) {
  safeMessage()?.success(content)
}

export function confirmAction(options: {
  title: string
  content?: string
  okText?: string
  cancelText?: string
  onOk: () => void | Promise<void>
}) {
  const modal = safeModal()

  if (modal) {
    modal.confirm({
      title: options.title,
      content: options.content,
      okText: options.okText,
      cancelText: options.cancelText,
      onOk: options.onOk,
    })
    return
  }

  const confirmed = typeof window !== 'undefined' ? window.confirm(options.content || options.title) : true
  if (confirmed) {
    void options.onOk()
  }
}

export function mergeCrudFilters(filters: CrudFilter[] = [], overrides: CrudFilter[] = []) {
  const map = new Map<string, CrudFilter>()

  for (const filter of [...filters, ...overrides]) {
    if ('field' in filter) {
      map.set(String(filter.field), filter)
    }
  }

  return [...map.values()]
}

export function mergeCrudSorters(sorters: CrudSort[] = [], overrides: CrudSort[] = []) {
  const map = new Map<string, CrudSort>()

  for (const sorter of [...sorters, ...overrides]) {
    if ('field' in sorter) {
      map.set(String(sorter.field), sorter)
    }
  }

  return [...map.values()]
}

export function getUploadFileUrl(file?: UploadFile | null) {
  if (!file) return null
  if (typeof file.url === 'string' && file.url) return file.url

  const responseUrl = file.response && typeof file.response === 'object'
    ? (file.response as Record<string, unknown>).url
    : undefined

  return typeof responseUrl === 'string' ? responseUrl : null
}

export function isAcceptedImageFile(file: File, acceptedMimeTypes: string[], acceptedExtensions: string[]) {
  const mimeMatches = acceptedMimeTypes.length === 0 || acceptedMimeTypes.includes(file.type)
  const extensionMatches =
    acceptedExtensions.length === 0 || acceptedExtensions.some((extension) => file.name.toLowerCase().endsWith(extension.toLowerCase()))
  return mimeMatches && extensionMatches
}

export function imageUploadListIgnore() {
  return Upload.LIST_IGNORE
}