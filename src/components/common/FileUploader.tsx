import { useState } from 'react';
import { Upload, Button, type UploadFile, type UploadProps } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import { useTranslation } from '@/hooks/useTranslation';
import { getErrorMessage } from '@/utils/errorHandler';
import { publicFileUploadToUrl } from '@/utils/publicFileUpload';

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
  const feedback = useAppFeedback();

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

  const customRequest: UploadProps['customRequest'] = (options) => {
    void publicFileUploadToUrl({
      ...options,
      onSuccess: (body, xhr) => {
        feedback.success(t('notifications.uploadSuccess'));
        options.onSuccess?.(body, xhr);
      },
      onError: (err) => {
        const msg = getErrorMessage(err);
        feedback.error(msg === 'An error occurred' ? t('notifications.uploadError') : msg);
        options.onError?.(err);
      },
    });
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
