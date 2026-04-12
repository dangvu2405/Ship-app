import { SearchOutlined } from '@ant-design/icons';
import type { FormInstance, FormProps } from 'antd/es/form';
import type { DefaultOptionType } from 'antd/es/select';
import { Button, ConfigProvider, Flex, Form, Input, Select } from 'antd';
import type { CSSProperties } from 'react';
import { useMemo } from 'react';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app.store';

function readCssSpaceSeparatedHsl(varName: string): string | null {
  if (typeof document === 'undefined') return null;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!raw) return null;
  return raw;
}

export type FilterBarValues = {
  keyword: string;
  status?: string;
};

export type FilterBarProps = {
  /** Controlled form instance; if omitted, an internal form is used. */
  form?: FormInstance<FilterBarValues>;
  initialValues?: Partial<FilterBarValues>;
  statusOptions?: DefaultOptionType[];
  placeholder?: string;
  statusPlaceholder?: string;
  searchLabel?: string;
  resetLabel?: string;
  loading?: boolean;
  onSearch?: (values: FilterBarValues) => void;
  onReset?: () => void;
  className?: string;
  style?: CSSProperties;
  formProps?: Omit<FormProps<FilterBarValues>, 'form' | 'onFinish' | 'initialValues' | 'children'>;
};

const defaultInitial: Partial<FilterBarValues> = {
  keyword: '',
  status: undefined,
};

export function FilterBar({
  form: formProp,
  initialValues,
  statusOptions = [],
  placeholder = 'Tìm kiếm',
  statusPlaceholder = 'Trạng thái',
  searchLabel = 'Tìm kiếm',
  resetLabel = 'Đặt lại',
  loading,
  onSearch,
  onReset,
  className,
  style,
  formProps,
}: FilterBarProps) {
  const theme = useAppStore((s) => s.theme);
  const [internalForm] = Form.useForm<FilterBarValues>();
  const form = formProp ?? internalForm;

  const filterBarTheme = useMemo(() => {
    void theme;
    const primaryRaw = readCssSpaceSeparatedHsl('--primary') ?? '215 80% 48%';
    const borderRaw = readCssSpaceSeparatedHsl('--border') ?? '220 16% 85%';
    const mutedFgRaw = readCssSpaceSeparatedHsl('--muted-foreground') ?? '220 10% 50%';
    const colorPrimary = `hsl(${primaryRaw})`;
    const colorBorder = `hsl(${borderRaw})`;
    const colorTextSecondary = `hsl(${mutedFgRaw})`;

    return {
      token: {
        colorPrimary,
        fontSize: 14,
        fontFamily:
          "'Inter', system-ui, -apple-system, 'Segoe UI', 'Ubuntu', 'Cantarell', 'Noto Sans', sans-serif",
        controlHeight: 40,
        borderRadius: 6,
        colorBorder,
        colorTextSecondary,
      },
      components: {
        Input: {
          hoverBorderColor: `hsl(${primaryRaw} / 0.35)`,
          activeBorderColor: colorPrimary,
          activeShadow: `0 0 0 2px hsl(${primaryRaw} / 0.12)`,
        },
        Select: {
          hoverBorderColor: `hsl(${primaryRaw} / 0.35)`,
          activeBorderColor: colorPrimary,
          optionSelectedBg: `hsl(${primaryRaw} / 0.06)`,
        },
        Button: {
          primaryShadow: `0 1px 2px hsl(${primaryRaw} / 0.2)`,
        },
      },
    } as const;
  }, [theme]);

  const mergedInitial = useMemo(
    () => ({ ...defaultInitial, ...initialValues }),
    [initialValues],
  );

  const handleFinish = (values: FilterBarValues) => {
    onSearch?.({
      keyword: (values.keyword ?? '').trim(),
      status: values.status,
    });
  };

  const handleReset = () => {
    form.resetFields();
    onReset?.();
  };

  return (
    <ConfigProvider theme={filterBarTheme}>
      <Form<FilterBarValues>
        {...formProps}
        form={form}
        initialValues={mergedInitial}
        onFinish={handleFinish}
        className={cn(formProps?.className, className)}
        style={{ ...formProps?.style, ...style }}
        requiredMark={false}
      >
        <Flex align="center" gap={12} wrap="wrap">
          <Form.Item name="keyword" style={{ marginBottom: 0 }}>
            <Input
              allowClear
              prefix={<SearchOutlined className="text-muted-foreground" aria-hidden />}
              placeholder={placeholder}
              style={{ width: 280, fontSize: 14 }}
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item name="status" style={{ marginBottom: 0 }}>
            <Select
              allowClear
              placeholder={statusPlaceholder}
              options={statusOptions}
              style={{ width: 180, fontSize: 14 }}
              popupMatchSelectWidth={false}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SearchOutlined />}
              style={{ minWidth: 120, height: 40, borderRadius: 6, fontSize: 14, fontWeight: 500 }}
            >
              {searchLabel}
            </Button>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="text"
              htmlType="button"
              onClick={handleReset}
              disabled={loading}
              className="text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              style={{
                height: 40,
                paddingInline: 8,
                fontSize: 14,
              }}
            >
              {resetLabel}
            </Button>
          </Form.Item>
        </Flex>
      </Form>
    </ConfigProvider>
  );
}
