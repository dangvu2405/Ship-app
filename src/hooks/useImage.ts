import { useCallback, useEffect, useMemo, useState } from 'react'
import type { UploadFile } from 'antd/es/upload/interface'
import { imageUploadListIgnore, isAcceptedImageFile } from './_shared'

type UseImageOptions = {
  maxSizeMB?: number
  acceptedMimeTypes?: string[]
  acceptedExtensions?: string[]
}

export function useImage(options: UseImageOptions = {}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const maxSizeMB = options.maxSizeMB ?? 5
  const acceptedMimeTypes = useMemo(
    () => options.acceptedMimeTypes ?? ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    [options.acceptedMimeTypes],
  )
  const acceptedExtensions = useMemo(
    () => options.acceptedExtensions ?? ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    [options.acceptedExtensions],
  )

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const validateFile = useCallback(
    (file: File) => {
      if (!isAcceptedImageFile(file, acceptedMimeTypes, acceptedExtensions)) {
        return { valid: false, reason: 'Invalid image format' }
      }

      const sizeInMB = file.size / (1024 * 1024)
      if (sizeInMB > maxSizeMB) {
        return { valid: false, reason: `Image must be smaller than ${maxSizeMB}MB` }
      }

      return { valid: true as const }
    },
    [acceptedExtensions, acceptedMimeTypes, maxSizeMB],
  )

  const beforeUpload = useCallback(
    (file: File) => {
      const result = validateFile(file)
      return result.valid ? true : imageUploadListIgnore()
    },
    [validateFile],
  )

  const createPreviewUrl = useCallback((file: File | UploadFile) => {
    const rawFile = file instanceof File ? file : (file.originFileObj ?? null)
    if (!rawFile) return null

    const nextPreviewUrl = URL.createObjectURL(rawFile)
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return nextPreviewUrl
    })
    return nextPreviewUrl
  }, [])

  const clearPreview = useCallback(() => {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
  }, [])

  return {
    previewUrl,
    validateFile,
    beforeUpload,
    createPreviewUrl,
    clearPreview,
  }
}
