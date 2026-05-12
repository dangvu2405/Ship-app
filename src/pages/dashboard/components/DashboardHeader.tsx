import { Button, DatePicker, Flex, Select, Space, Typography, theme } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth.store';
import type { Company } from '@/types';

const { Text, Title } = Typography;

interface DashboardHeaderProps {
  companies: Company[];
  companyId?: number;
  onChangeCompany: (id?: number) => void;
  selectedDate: dayjs.Dayjs;
  onChangeDate: (date: dayjs.Dayjs) => void;
  onRefresh: () => void;
}

export function DashboardHeader({
  companies,
  companyId,
  onChangeCompany,
  selectedDate,
  onChangeDate,
  onRefresh,
}: DashboardHeaderProps) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { user } = useAuthStore();

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
        borderBottomLeftRadius: token.borderRadiusLG,
        borderBottomRightRadius: token.borderRadiusLG,
        paddingBlockStart: token.paddingLG,
        paddingBlockEnd: token.paddingXL,
        paddingInline: token.paddingXL,
        marginBlockEnd: token.margin,
      }}
    >
      <Flex justify="space-between" align="flex-start" wrap="wrap" gap="middle">
        <Flex vertical gap="small">
          <Title level={3} style={{ margin: 0, color: token.colorTextLightSolid }}>
            {t('dashboard.title')}
          </Title>
          <Text style={{ color: token.colorTextLightSolid, fontSize: token.fontSizeSM }}>
            {t('dashboard.welcome')}, <strong>{user?.username ?? 'User'}</strong>
            {' · '}{dayjs().format('dddd, DD/MM/YYYY')}
          </Text>
        </Flex>
        <Space wrap>
          <Select
            value={companyId}
            onChange={onChangeCompany}
            options={companies.map((c) => ({ label: c.name, value: c.id }))}
            placeholder={t('dashboard.filterByCompany')}
            style={{ minWidth: 200 }}
            allowClear
          />
          <DatePicker
            value={selectedDate}
            onChange={(v) => onChangeDate(v ?? dayjs())}
            picker="month"
            format="MM/YYYY"
            allowClear={false}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            ghost
          >
            {t('common.refresh')}
          </Button>
        </Space>
      </Flex>
    </div>
  );
}
