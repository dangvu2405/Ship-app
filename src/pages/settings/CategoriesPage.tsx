import { useMemo, useState } from 'react';
import { Card, Col, Menu, Row, Space } from 'antd';
import {
  AppstoreOutlined,
  BgColorsOutlined,
  BoxPlotOutlined,
  CarOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';

// Modular Tab Components
import { CargoTypesTab } from './tabs/CargoTypesTab';
import { VehicleTypesTab } from './tabs/VehicleTypesTab';
import { RouteTemplatesTab } from './tabs/RouteTemplatesTab';
import { SimpleCategoryTab } from './tabs/SimpleCategoryTab';

type CategoryKey = 'cargo' | 'vehicle' | 'route' | 'cost' | 'location' | 'order-status';

export function CategoriesPage() {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState<CategoryKey>('cargo');

  const railItems = useMemo(
    () => [
      { key: 'cargo', icon: <BoxPlotOutlined />, label: 'Loại hàng hóa' },
      { key: 'vehicle', icon: <CarOutlined />, label: 'Loại xe' },
      { key: 'route', icon: <ShareAltOutlined />, label: 'Tuyến đường mẫu' },
      { key: 'cost', icon: <DollarOutlined />, label: 'Loại chi phí' },
      { key: 'location', icon: <EnvironmentOutlined />, label: 'Địa điểm' },
      { key: 'order-status', icon: <BgColorsOutlined />, label: 'Trạng thái đơn' },
    ],
    [],
  );

  const renderActive = () => {
    switch (activeKey) {
      case 'cargo':
        return <CargoTypesTab />;
      case 'vehicle':
        return <VehicleTypesTab />;
      case 'route':
        return <RouteTemplatesTab />;
      case 'cost':
        return <SimpleCategoryTab resource="cost-categories" itemLabel="loại chi phí" />;
      case 'location':
        return (
          <SimpleCategoryTab
            resource="locations"
            itemLabel="địa điểm"
            extraFields={[
              { name: 'address', label: 'Địa chỉ' },
              { name: 'province', label: 'Tỉnh/Thành phố' },
            ]}
          />
        );
      case 'order-status':
        return (
          <SimpleCategoryTab
            resource="order-status-configs"
            itemLabel="trạng thái đơn"
            extraFields={[{ name: 'color', label: 'Màu (hex)', placeholder: '#1677ff' }]}
          />
        );
      default:
        return null;
    }
  };

  const activeItem = railItems.find((r) => r.key === activeKey);

  return (
    <div className="enterprise-page space-y-4">
      <PageHeader
        title={t('sidebar.categories')}
        description="Quản lý danh mục: loại hàng hóa, loại xe, tuyến đường mẫu, loại chi phí, địa điểm, trạng thái đơn"
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('sidebar.settings'), path: ROUTES.admin.settings.root },
          { label: t('sidebar.categories') },
        ]}
      />
      <Row gutter={16}>
        <Col xs={24} md={8} lg={6} xl={5}>
          <Card size="small" styles={{ body: { padding: 0 } }}>
            <Menu
              mode="inline"
              selectedKeys={[activeKey]}
              onClick={({ key }) => setActiveKey(key as CategoryKey)}
              items={railItems}
              style={{ borderRight: 'none' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={16} lg={18} xl={19}>
          <Card
            title={
              <Space>
                {activeItem?.icon ?? <AppstoreOutlined />}
                {activeItem?.label}
              </Space>
            }
          >
            {renderActive()}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

