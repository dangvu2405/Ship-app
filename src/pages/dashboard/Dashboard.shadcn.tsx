/**
 * Dashboard - Redesigned with shadcn/ui
 * 
 * This is an example implementation following shadcn/ui design principles:
 * - Minimal, clean, modern design
 * - Consistent spacing and typography
 * - shadcn/ui components throughout
 * - Dark mode support
 * - Responsive layout
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import Users from 'lucide-react/dist/esm/icons/users';
import Truck from 'lucide-react/dist/esm/icons/truck';
import Package from 'lucide-react/dist/esm/icons/package';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';

const stats = [
  {
    name: 'Total Employees',
    value: '150',
    icon: Users,
    change: '+12%',
    changeType: 'positive' as const,
    description: 'Active employees',
  },
  {
    name: 'Total Vehicles',
    value: '45',
    icon: Truck,
    change: '+5%',
    changeType: 'positive' as const,
    description: 'Fleet vehicles',
  },
  {
    name: 'Total Trips',
    value: '1,234',
    icon: Package,
    change: '+8%',
    changeType: 'positive' as const,
    description: 'This month',
  },
  {
    name: 'Monthly Payroll',
    value: '$125,000',
    icon: DollarSign,
    change: '+3%',
    changeType: 'positive' as const,
    description: 'Total payroll',
  },
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

export const DashboardShadcn = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your ERP dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
                <div className="flex items-center mt-2">
                  <Badge
                    variant={stat.changeType === 'positive' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {stat.change}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Trips</CardTitle>
            <CardDescription>
              Monthly revenue and trip statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'calc(var(--radius) - 2px)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Revenue ($)"
                />
                <Line
                  type="monotone"
                  dataKey="trips"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  name="Trips"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trips Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Trips Status</CardTitle>
            <CardDescription>
              Completed vs cancelled trips
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tripsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'calc(var(--radius) - 2px)',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="completed"
                  fill="hsl(var(--chart-1))"
                  name="Completed"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="cancelled"
                  fill="hsl(var(--destructive))"
                  name="Cancelled"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
