import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/common/PageHeader';
import type { BreadcrumbItem } from '@/components/common/Breadcrumb';
import { DataTable } from '@/components/table/DataTable';
import { Pagination } from '@/components/table/Pagination';
import { Button } from '@/components/form/Button';
import { Select } from '@/components/form/Select';
import payrollService from '@/services/payroll.service';
import { Payroll } from '@/types';
import toast from 'react-hot-toast';
import { PlusIcon, EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export const Payrolls = () => {
  const navigate = useNavigate();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const breadcrumb: BreadcrumbItem[] = [
    { label: 'Payroll', path: '/admin/payrolls' },
    { label: 'Payrolls' },
  ];

  useEffect(() => {
    loadPayrolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, month, year]);

  const loadPayrolls = async () => {
    try {
      setLoading(true);
      const response = await payrollService.getAll({
        page: currentPage,
        per_page: 10,
        month,
        year,
      });
      if (response.success && response.data) {
        setPayrolls(response.data.data);
        setLastPage(response.data.last_page);
      }
    } catch (error) {
      toast.error('Failed to load payrolls');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      const response = await payrollService.generate(1, month, year);
      if (response.success) {
        toast.success('Payroll generated successfully');
        loadPayrolls();
      }
    } catch (error) {
      toast.error('Failed to generate payroll');
    }
  };

  const handleExport = async (payrollId: number) => {
    try {
      const blob = await payrollService.export(payrollId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-${payrollId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Payroll exported successfully');
    } catch (error) {
      toast.error('Failed to export payroll');
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
    },
    {
      key: 'month',
      header: 'Period',
      render: (payroll: Payroll) => `${payroll.month}/${payroll.year}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (payroll: Payroll) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            payroll.status === 'paid'
              ? 'bg-green-100 text-green-800'
              : payroll.status === 'approved'
              ? 'bg-blue-100 text-blue-800'
              : payroll.status === 'locked'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {payroll.status}
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Employees',
      render: (payroll: Payroll) => payroll.details?.length || 0,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (payroll: Payroll) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/payrolls/${payroll.id}`);
            }}
            className="text-primary-600 hover:text-primary-900"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleExport(payroll.id);
            }}
            className="text-green-600 hover:text-green-900"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Payrolls"
        description="Manage payrolls"
        breadcrumb={breadcrumb}
        actions={
          <Button onClick={handleGenerate}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Generate Payroll
          </Button>
        }
      />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Month"
            options={Array.from({ length: 12 }, (_, i) => ({
              value: i + 1,
              label: format(new Date(2024, i, 1), 'MMMM'),
            }))}
            value={month}
            onChange={(e) => {
              setMonth(Number(e.target.value));
              setCurrentPage(1);
            }}
          />
          <Select
            label="Year"
            options={Array.from({ length: 5 }, (_, i) => ({
              value: new Date().getFullYear() - i,
              label: String(new Date().getFullYear() - i),
            }))}
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
        <DataTable
          data={payrolls}
          columns={columns}
          loading={loading}
          onRowClick={(payroll) => navigate(`/admin/payrolls/${payroll.id}`)}
        />
        <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} />
      </div>
    </AdminLayout>
  );
};
