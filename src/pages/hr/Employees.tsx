import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/common/PageHeader';
import type { BreadcrumbItem } from '@/components/common/Breadcrumb';
import { DataTable } from '@/components/table/DataTable';
import { Pagination } from '@/components/table/Pagination';
import { Button } from '@/components/form/Button';
import { Input } from '@/components/form/Input';
import { Select } from '@/components/form/Select';
import { ConfirmModal } from '@/components/modal/ConfirmModal';
import employeeService from '@/services/employee.service';
import { Employee } from '@/types';
import toastService from '@/services/toast.service';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export const Employees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; employee: Employee | null }>({
    isOpen: false,
    employee: null,
  });

  const breadcrumb: BreadcrumbItem[] = [
    { label: 'HR', path: '/admin/employees' },
    { label: 'Employees' },
  ];

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search, typeFilter]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getAll({
        page: currentPage,
        per_page: 10,
        search: search || undefined,
        type: typeFilter || undefined,
      });
      if (response.success && response.data) {
        setEmployees(response.data.data);
        setLastPage(response.data.last_page);
      }
    } catch (error) {
      // Error toast handled by interceptor
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.employee) return;
    try {
      await employeeService.delete(deleteModal.employee.id);
      toastService.success('Employee deleted successfully');
      setDeleteModal({ isOpen: false, employee: null });
      loadEmployees();
    } catch (error) {
      // Error toast handled by interceptor
      console.error('Failed to delete employee:', error);
    }
  };

  const columns = [
    {
      key: 'code',
      header: 'Code',
    },
    {
      key: 'name',
      header: 'Name',
    },
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'type',
      header: 'Type',
      render: (employee: Employee) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            employee.type === 'driver'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          {employee.type}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (employee: Employee) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            employee.status === 'active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {employee.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (employee: Employee) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/employees/${employee.id}`);
            }}
            className="text-primary-600 hover:text-primary-900"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal({ isOpen: true, employee });
            }}
            className="text-red-600 hover:text-red-900"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Employees"
        description="Manage your employees"
        breadcrumb={breadcrumb}
        actions={
          <Button onClick={() => navigate('/admin/employees/new')}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Employee
          </Button>
        }
      />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Select
            options={[
              { value: '', label: 'All Types' },
              { value: 'office', label: 'Office' },
              { value: 'driver', label: 'Driver' },
            ]}
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
        <DataTable
          data={employees}
          columns={columns}
          loading={loading}
          onRowClick={(employee) => navigate(`/admin/employees/${employee.id}`)}
        />
        <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, employee: null })}
        onConfirm={handleDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete ${deleteModal.employee?.name}? This action cannot be undone.`}
        variant="danger"
      />
    </AdminLayout>
  );
};
