import type { ThemeConfig } from 'antd';

export const shipEnterpriseTheme: ThemeConfig = {
  token: {
    colorPrimary: '#3B82F6',
    borderRadius: 6,
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  },
  components: {
    Table: {
      headerBg: '#f8fafc',
    },
    Tag: {
      borderRadiusSM: 2,
    },
    Button: {
      controlHeight: 40,
      borderRadius: 8,
    },
    Input: {
      controlHeight: 40,
    },
    Select: {
      controlHeight: 40,
    },
  },
};
