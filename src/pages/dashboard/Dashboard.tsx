import { AdminLayout } from '@/layouts/AdminLayout';
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
import TrendingDown from 'lucide-react/dist/esm/icons/trending-down';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';

const stats = [
  {
    name: 'Total Employees',
    value: '150',
    icon: Users,
    change: '+12%',
    changeType: 'positive' as const,
    description: 'Active employees',
    color: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-50 dark:bg-blue-950',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    name: 'Fleet Vehicles',
    value: '45',
    icon: Truck,
    change: '+5%',
    changeType: 'positive' as const,
    description: 'In operation',
    color: 'from-emerald-500 to-emerald-600',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    name: 'Monthly Trips',
    value: '1,234',
    icon: Package,
    change: '+8%',
    changeType: 'positive' as const,
    description: 'This month',
    color: 'from-amber-500 to-amber-600',
    iconBg: 'bg-amber-50 dark:bg-amber-950',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    name: 'Monthly Payroll',
    value: '$125K',
    icon: DollarSign,
    change: '-2%',
    changeType: 'negative' as const,
    description: 'Total payroll',
    color: 'from-violet-500 to-violet-600',
    iconBg: 'bg-violet-50 dark:bg-violet-950',
    iconColor: 'text-violet-600 dark:text-violet-400',
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

const recentActivities = [
  { text: 'New trip T-1024 created', time: '2 min ago', type: 'info' },
  { text: 'Employee John Doe joined', time: '15 min ago', type: 'success' },
  { text: 'Payroll for Jan approved', time: '1 hour ago', type: 'warning' },
  { text: 'Vehicle VN-001 maintenance', time: '3 hours ago', type: 'destructive' },
  { text: 'New company registered', time: '5 hours ago', type: 'info' },
];

export const Dashboard = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1>Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here&apos;s what&apos;s happening today.
            </p>
          </div>
          <Badge variant="outline" className="h-8 px-3 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-success mr-2 animate-pulse" />
            System Online
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const isPositive = stat.changeType === 'positive';
            return (
              <Card key={stat.name} className="group cursor-pointer hover:shadow-sku-card-hover transition-all duration-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={`p-2.5 rounded-xl ${stat.iconBg} transition-transform group-hover:scale-110`}>
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                      {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {stat.change}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                    <p className="text-sm text-muted-foreground mt-0.5">{stat.name}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Revenue Chart - 4/7 */}
          <Card className="lg:col-span-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Revenue & Trips</CardTitle>
                  <CardDescription>Monthly overview</CardDescription>
                </div>
                <Badge variant="secondary" className="font-medium">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +12.5%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                    name="Revenue ($)"
                  />
                  <Line
                    type="monotone"
                    dataKey="trips"
                    stroke="hsl(var(--success))"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: 'hsl(var(--success))' }}
                    name="Trips"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Activity Feed - 3/7 */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      activity.type === 'success' ? 'bg-success' :
                      activity.type === 'warning' ? 'bg-warning' :
                      activity.type === 'destructive' ? 'bg-destructive' :
                      'bg-info'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{activity.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trips Status Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Trips Status</CardTitle>
                <CardDescription>Completed vs cancelled trips by month</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={tripsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="completed"
                  fill="hsl(var(--success))"
                  name="Completed"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="cancelled"
                  fill="hsl(var(--destructive))"
                  name="Cancelled"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};
