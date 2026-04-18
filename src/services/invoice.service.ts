import api from './api';
import { ApiResponse, Invoice } from '@/types';
import { ENDPOINTS } from './endpoints';

class InvoiceService {
  async issue(id: number): Promise<ApiResponse<Invoice>> {
    const response = await api.post(ENDPOINTS.invoices.issue(id));
    return response.data;
  }

  async sendCqt(id: number): Promise<ApiResponse<Invoice>> {
    const response = await api.post(ENDPOINTS.invoices.sendCqt(id));
    return response.data;
  }

  async markPaid(id: number): Promise<ApiResponse<Invoice>> {
    const response = await api.post(ENDPOINTS.invoices.markPaid(id));
    return response.data;
  }

  async cancel(id: number, reason: string): Promise<ApiResponse<Invoice>> {
    const response = await api.post(ENDPOINTS.invoices.cancel(id), { reason });
    return response.data;
  }

  async sendEmail(id: number): Promise<ApiResponse<void>> {
    const response = await api.post(ENDPOINTS.invoices.sendEmail(id));
    return response.data;
  }

  async downloadPdf(id: number, code?: string): Promise<void> {
    const response = await api.get(ENDPOINTS.invoices.exportPdf(id), { responseType: 'blob' });
    const blob = response.data as Blob;
    const contentDisposition = response.headers['content-disposition'] as string | undefined;
    const matched = contentDisposition?.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)?.[1];
    const fileName = matched ? decodeURIComponent(matched.replace(/"/g, '')) : `invoice-${code ?? id}.pdf`;
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(objectUrl);
  }
}

export default new InvoiceService();
