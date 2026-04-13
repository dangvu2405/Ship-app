import { GlobalOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { useTranslation } from '@/hooks/useTranslation';

export const LanguageSwitcher = () => {
  const { setLocale } = useTranslation();

  const items: MenuProps['items'] = [
    { key: 'vi', label: 'Tiếng Việt', onClick: () => setLocale('vi') },
    { key: 'en', label: 'English', onClick: () => setLocale('en') },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <Button type="text" icon={<GlobalOutlined />} aria-label="Toggle language" />
    </Dropdown>
  );
};
