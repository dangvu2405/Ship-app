import React, { useState } from 'react';
import { Upload, message, Progress } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import Papa from 'papaparse';
import { ReportRow } from '../types';

const { Dragger } = Upload;

interface CsvUploaderProps {
  onUpload: (data: ReportRow[]) => void;
}

const CsvUploader: React.FC<CsvUploaderProps> = ({ onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const props = {
    name: 'file',
    multiple: false,
    accept: '.csv',
    beforeUpload: (file: File) => {
      if (file.type !== 'text/csv') {
        message.error(`${file.name} is not a CSV file`);
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: ({ file }: any) => {
      setUploading(true);
      setProgress(0);

      Papa.parse(file, {
        worker: true,
        header: true,
        skipEmptyLines: true,
        step: (results, _parser) => {
          // For progress calculation, we need the total size of the file.
          // This is a simplified progress, real progress is harder with streaming.
          setProgress(
            Math.round(
              (results.meta.cursor / file.size) * 100
            )
          );
        },
        complete: (results: any) => {
          setUploading(false);
          onUpload(results.data);
          message.success(`${file.name} file uploaded successfully.`);
        },
        error: (error: any) => {
          setUploading(false);
          message.error(`Error parsing CSV file: ${error.message}`);
        },
      });
    },
  };

  return (
    <Dragger {...props} disabled={uploading}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">
        Click or drag CSV file to this area to upload
      </p>
      <p className="ant-upload-hint">
        Support for a single CSV file upload. Strict parsing will be enforced.
      </p>
      {uploading && (
        <div style={{ marginTop: 16 }}>
          <Progress percent={progress} />
        </div>
      )}
    </Dragger>
  );
};

export default CsvUploader;
