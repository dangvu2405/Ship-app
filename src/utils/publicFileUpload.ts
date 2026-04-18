import type { UploadRequestOption } from 'rc-upload/lib/interface';
import api from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';
import { getErrorMessage } from '@/utils/errorHandler';

/**
 * POST file tới `ENDPOINTS.public.upload`, gọi `onSuccess` với `{ data: { url } }` (chuẩn Ant Upload).
 */
export async function publicFileUploadToUrl(options: UploadRequestOption): Promise<void> {
  const { file, onSuccess, onError, onProgress } = options;
  const formData = new FormData();
  formData.append('file', file as File);

  try {
    const response = await api.post(ENDPOINTS.public.upload, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          onProgress({ percent: (progressEvent.loaded / progressEvent.total) * 100 });
        }
      },
    });

    const payload = response.data as { data?: { url?: string }; url?: string };
    const uploadedUrl = payload?.data?.url ?? payload?.url;
    if (typeof uploadedUrl !== 'string' || !uploadedUrl.trim()) {
      throw new Error('No URL returned from upload API');
    }

    onSuccess?.({ data: { url: uploadedUrl.trim() } });
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error(getErrorMessage(err)));
  }
}
