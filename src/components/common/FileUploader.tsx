import React, { useState } from 'react';
import { Upload, Button, type UploadFile, type UploadProps } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';
import { useTranslation } from '@/hooks/useTranslation';
import { getErrorMessage } from '@/utils/errorHandler';

interface FileUploaderProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
  maxCount?: number;
  accept?: string;
  listType?: UploadProps['listType'];
  buttonText?: string;
}

export function FileUploader({
  value = [],
  onChange,
  maxCount = 5,
  accept = 'image/*,.pdf',
  listType = 'picture',
  buttonText,
}: FileUploaderProps) {
  const { t } = useTranslation();

  // Convert string URLs to UploadFile objects for Ant Design
  const [fileList, setFileList] = useState<UploadFile[]>(() =>
    value.map((url, index) => ({
      uid: `-existing-${index}`,
      name: url.split('/').pop() || `File ${index + 1}`,
      status: 'done',
      url,
    }))
  );

  const handleChange: UploadProps['onChange'] = (info) => {
    setFileList(info.fileList);

    // Extract all successfully uploaded URLs
    const newUrls = info.fileList
      .map((file) => file.url || file.response?.data?.url)
      .filter(Boolean) as string[];

    if (onChange) {
      onChange(newUrls);
    }
  };

  const customRequest: UploadProps['customRequest'] = async (options) => {
    const { action, file, onSuccess, onError, onProgress } = options;
    const formData = new FormData();
    formData.append('file', file);

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

      // Assuming backend responds with { data: { url: string } }
      const uploadedUrl = response.data?.data?.url || response.data?.url;
      if (!uploadedUrl) {
        throw new Error('No URL returned from upload API');
      }

      onSuccess?.({ data: { url: uploadedUrl } });
      toast.success(t('notifications.uploadSuccess') ?? 'Upload thành công');
    } catch (err) {
      onError?.(err as Error);
      const msg = getErrorMessage(err);
      toast.error(msg === 'An error occurred' ? (t('notifications.uploadError') ?? 'Lỗi upload file') : msg);
    }
  };

  return (
    <Upload
      customRequest={customRequest}
      fileList={fileList}
      onChange={handleChange}
      maxCount={maxCount}
      accept={accept}
      listType={listType}
    >
      {fileList.length < maxCount && (
        <Button icon={<UploadOutlined />}>
          {buttonText || t('common.upload') || 'Upload file'}
        </Button>
      )}
    </Upload>
  );
}
