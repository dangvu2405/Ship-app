import api from './api';
import { ENDPOINTS } from './endpoints';
import { throwIfEnvelopeFailed, unwrapEnvelope } from './http';
import type { CompanyDebtOverview } from '@/types/api/invoice';
import type { Invoice, InvoiceStatusHistory } from '@/types';

function parsePagedList<T>(body: unknown): { data: T[]; total: number } {
  throwIfEnvelopeFailed(body);
  const envelopeData = unwrapEnvelope<unknown>(body) as
    | T[]
    | { data?: T[]; meta?: { total?: number }; total?: number }
    | null
    | undefined;

  const metaTotal = (body as { meta?: { total?: number } })?.meta?.total;

  if (Array.isArray(envelopeData)) {
    return { data: envelopeData, total: metaTotal ?? envelopeData.length };
  }
  if (envelopeData && typeof envelopeData === 'object' && Array.isArray((envelopeData as { data: T[] }).data)) {
    const inner = envelopeData as { data: T[]; meta?: { total?: number }; total?: number };
    return {
      data: inner.data,
      total: inner.meta?.total ?? inner.total ?? metaTotal ?? inner.data.length,
    };
  }
  return { data: [], total: 0 };
}

export type InvoiceListParams = {
  current?: number;
  pageSize?: number;
  status?: string;
  customer_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
};

class InvoiceService {
  async getList(params?: InvoiceListParams): Promise<{ data: Invoice[]; total: number }> {
    const response = await api.get(ENDPOINTS.invoices.base, {
      params: {
        page: params?.current,
        per_page: params?.pageSize,
        status: params?.status || undefined,
        customer_id: params?.customer_id || undefined,
        date_from: params?.date_from || undefined,
        date_to: params?.date_to || undefined,
        search: params?.search?.trim() || undefined,
      },
    });
    return parsePagedList<Invoice>(response.data);
  }

  async getDebtOverview(): Promise<CompanyDebtOverview> {
    try {
      const response = await api.get(ENDPOINTS.debtOverview, {
        skipErrorToast: true,
      } as Parameters<typeof api.get>[1]);
      throwIfEnvelopeFailed(response.data);
      return unwrapEnvelope<CompanyDebtOverview>(response.data);
    } catch {
      return {
        total_uncollected: 0,
        overdue_amount: 0,
        revenue_collected: 0,
        unpaid_invoices: 0,
        unpaid_total: 0,
        overdue_invoices: 0,
      };
    }
  }

  async getStatusHistories(
    invoiceId: number,
    listParams?: { page?: number; per_page?: number },
  ): Promise<{ data: InvoiceStatusHistory[]; total: number }> {
    const response = await api.get(ENDPOINTS.invoices.statusHistories(invoiceId), {
      params: listParams,
    });
    return parsePagedList<InvoiceStatusHistory>(response.data);
  }

  async issue(id: number): Promise<Invoice> {
    const response = await api.patch(ENDPOINTS.invoices.issue(id));
    throwIfEnvelopeFailed(response.data);
    return unwrapEnvelope<Invoice>(response.data);
  }

  async sendCqt(id: number): Promise<Invoice> {
    const response = await api.post(ENDPOINTS.invoices.sendCqt(id));
    throwIfEnvelopeFailed(response.data);
    return unwrapEnvelope<Invoice>(response.data);
  }

  async markPaid(id: number): Promise<Invoice> {
    const response = await api.patch(ENDPOINTS.invoices.markPaid(id));
    throwIfEnvelopeFailed(response.data);
    return unwrapEnvelope<Invoice>(response.data);
  }

  async cancel(id: number, cancel_reason: string): Promise<Invoice> {
    const response = await api.patch(ENDPOINTS.invoices.cancel(id), { cancel_reason });
    throwIfEnvelopeFailed(response.data);
    return unwrapEnvelope<Invoice>(response.data);
  }

  async sendEmail(id: number): Promise<void> {
    const response = await api.post(ENDPOINTS.invoices.sendEmail(id));
    throwIfEnvelopeFailed(response.data);
    unwrapEnvelope(response.data);
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
