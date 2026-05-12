import { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Result } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.fallback) return this.fallback;

      return (
        <div style={{ padding: '40px', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Result
            status="error"
            title="Đã xảy ra lỗi không mong muốn"
            subTitle={this.state.error?.message || 'Hệ thống gặp sự cố khi xử lý dữ liệu. Vui lòng thử lại.'}
            extra={[
              <Button type="primary" key="reload" icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
                Tải lại trang
              </Button>,
              <Button key="home" onClick={() => (window.location.href = '/')}>
                Về trang chủ
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }

  private get fallback() {
    return this.props.fallback;
  }
}
