import { Alert, Col, Flex, Row, theme } from 'antd';
import dayjs from 'dayjs';
import { useList } from '@refinedev/core';
import { useMemo } from 'react';

import { useDashboardAnalytics } from '@/features/dashboard/hooks/useDashboardAnalytics';
import { KpiCardGrid } from '@/features/dashboard/components/KpiCardGrid';
import { RevenueChart } from '@/features/dashboard/components/RevenueChart';
import { RecentActivityTable } from '@/features/dashboard/components/RecentActivityTable';
import { DashboardHeader } from './components/DashboardHeader';
import { Company } from '@/types';

export default function Dashboard() {
  const { token } = theme.useToken();

  // Load companies for the header filter
  const { data: companiesData } = useList<Company>({
    resource: 'companies',
    pagination: { current: 1, pageSize: 100 },
    filters: [{ field: 'status', operator: 'eq', value: 'active' }],
    sorters: [{ field: 'name', order: 'asc' }],
  });
  const companies = useMemo(() => companiesData?.data ?? [], [companiesData]);

  // Use our new modern dashboard hook
  const {
    filters,
    setCompanyId,
    setDateRange,
    analytics,
    isLoading,
    isError,
    refresh,
  } = useDashboardAnalytics(companies[0]?.id);

  const selectedDate = dayjs(filters.dateRange[1]);

  const handleDateChange = (date: dayjs.Dayjs) => {
    setDateRange([date.startOf('month'), date.endOf('month')]);
  };

  return (
    <Flex vertical style={{ minHeight: '100%' }}>
      <DashboardHeader
        companies={companies}
        companyId={filters.companyId}
        onChangeCompany={setCompanyId}
        selectedDate={selectedDate}
        onChangeDate={handleDateChange}
        onRefresh={refresh}
      />

      <Flex
        vertical
        gap="large"
        style={{
          paddingInline: token.paddingLG,
          paddingBlockEnd: token.paddingLG,
          marginTop: -24, // Pull up to overlap with header slightly for modern look
        }}
      >
        {isError && (
          <Alert
            type="error"
            showIcon
            message="Không thể tải dữ liệu phân tích"
            description="Đã có lỗi xảy ra khi kết nối với máy chủ. Vui lòng thử lại sau."
          />
        )}

        {/* KPI Row */}
        <KpiCardGrid kpis={analytics?.kpis} loading={isLoading} />

        {/* Main Analytics Row */}
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <RevenueChart data={analytics?.chartData} loading={isLoading} />
          </Col>
          <Col xs={24} xl={8}>
            {/* We can put secondary charts or performance lists here */}
            <div style={{ height: '100%' }}>
                {/* Reusing existing ChartAreaInteractive or similar if needed, 
                    but here we'll just leave space for more modern widgets */}
            </div>
          </Col>
        </Row>

        {/* Tables Row */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <RecentActivityTable trips={analytics?.recentTrips} loading={isLoading} />
          </Col>
        </Row>
      </Flex>
    </Flex>
  );
}
