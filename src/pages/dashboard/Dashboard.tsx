import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/common/PageHeader';
import {
  ChartBarIcon,
  UsersIcon,
  TruckIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const stats = [
  { name: 'Total Employees', value: '150', icon: UsersIcon, change: '+12%', changeType: 'positive' },
  { name: 'Total Vehicles', value: '45', icon: TruckIcon, change: '+5%', changeType: 'positive' },
  { name: 'Total Trips', value: '1,234', icon: ChartBarIcon, change: '+8%', changeType: 'positive' },
  { name: 'Monthly Payroll', value: '$125,000', icon: CurrencyDollarIcon, change: '+3%', changeType: 'positive' },
];

const revenueData = [
  { month: 'Jan', revenue: 4000, trips: 100 },
  { month: 'Feb', revenue: 3000, trips: 120 },
  { month: 'Mar', revenue: 5000, trips: 140 },
  { month: 'Apr', revenue: 4500, trips: 130 },
  { month: 'May', revenue: 6000, trips: 150 },
  { month: 'Jun', revenue: 5500, trips: 145 },
];

const tripsData = [
  { month: 'Jan', completed: 95, cancelled: 5 },
  { month: 'Feb', completed: 115, cancelled: 5 },
  { month: 'Mar', completed: 135, cancelled: 5 },
  { month: 'Apr', completed: 125, cancelled: 5 },
  { month: 'May', completed: 145, cancelled: 5 },
  { month: 'Jun', completed: 140, cancelled: 5 },
];

export const Dashboard = () => {
  return (
    <AdminLayout>
      <PageHeader title="Dashboard" description="Welcome to your ERP dashboard" />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((item) => (
          <div
            key={item.name}
            className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <item.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{item.name}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">{item.value}</div>
                      <div
                        className={`ml-2 flex items-baseline text-sm font-semibold ${
                          item.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {item.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Revenue & Trips</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue ($)" />
              <Line type="monotone" dataKey="trips" stroke="#10b981" name="Trips" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Trips Chart */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Trips Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tripsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Completed" />
              <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AdminLayout>
  );
};
