import { useNavigate, Link } from 'react-router-dom';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Flex, Result } from 'antd';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';

export function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Flex align="center" justify="center" style={{ minHeight: 'calc(100vh - 200px)', padding: 16 }}>
      <Result
        status="404"
        title={t('404.title')}
        subTitle={t('404.description')}
        extra={
          <Flex gap="middle" justify="center" wrap="wrap">
            <Link to={ROUTES.dashboard}>
              <Button type="primary" icon={<HomeOutlined />}>
                {t('404.goToDashboard')}
              </Button>
            </Link>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              {t('404.goBack')}
            </Button>
          </Flex>
        }
      />
    </Flex>
  );
}
