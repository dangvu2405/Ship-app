import { useState } from 'react';
import Papa from 'papaparse';
import { ReportRow } from '../types';

interface UseCsvParserResult {
  data: ReportRow[];
  loading: boolean;
  error: string | null;
  parseCsv: (file: File) => void;
}

const useCsvParser = (): UseCsvParserResult => {
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const parseCsv = (file: File) => {
    setLoading(true);
    setError(null);

    Papa.parse(file, {
      worker: true,
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        setData(results.data);
        setLoading(false);
      },
      error: (err: any) => {
        setError(err.message);
        setLoading(false);
      },
    });
  };

  return { data, loading, error, parseCsv };
};

export default useCsvParser;
