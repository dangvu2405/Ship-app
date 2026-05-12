import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { Table, Typography, Card, theme, type TableProps } from 'antd';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer, Line, LineChart, Pie, PieChart, Cell } from 'recharts';

type MessageRendererProps = {
  content: string;
};

type RichContent = {
  type: 'table' | 'chart';
  title?: string;
  rows?: Record<string, unknown>[];
  columns?: TableProps<Record<string, unknown>>['columns'];
  data?: unknown[];
  config?: ChartConfig;
  chartType?: 'bar' | 'line' | 'pie';
  xAxisKey?: string;
  yAxisKey?: string;
};

type Segment = {
  type: 'text' | 'rich';
  value: string;
};

const sanitizeHtml = (html: string): string => {
  if (typeof window === 'undefined') return html;
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'style'],
  });
};

export function MessageRenderer({ content }: MessageRendererProps) {
  const { token } = theme.useToken();

  const renderRichContent = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr) as RichContent;
      
      if (data.type === 'table' && Array.isArray(data.rows)) {
        const columns = data.columns || Object.keys(data.rows[0] || {}).map((k: string) => ({ title: k, dataIndex: k, key: k }));
        return (
          <div style={{ margin: '12px 0' }}>
            <Table
              dataSource={data.rows}
              columns={columns as TableProps<Record<string, unknown>>['columns']}
              size="small"
              pagination={data.rows.length > 5 ? { pageSize: 5 } : false}
              bordered
              style={{ background: token.colorBgContainer }}
            />
          </div>
        );
      }

      if (data.type === 'chart') {
        const chartData = data.data || [];
        const config = data.config || { value: { label: 'Value', color: token.colorPrimary } };
        
        return (
          <Card size="small" style={{ margin: '12px 0' }}>
            <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>{data.title}</Typography.Text>
            <div style={{ height: 240, width: '100%' }}>
              <ChartContainer config={config}>
                {data.chartType === 'bar' ? (
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey={data.xAxisKey || 'name'} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey={data.yAxisKey || 'value'} radius={4} fill="var(--color-value)" />
                  </BarChart>
                ) : data.chartType === 'line' ? (
                  <LineChart data={chartData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey={data.xAxisKey || 'name'} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey={data.yAxisKey || 'value'} stroke="var(--color-value)" strokeWidth={2} dot={false} />
                  </LineChart>
                ) : (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={(chartData || []) as Record<string, unknown>[]} dataKey={data.yAxisKey || 'value'} nameKey={data.xAxisKey || 'name'} innerRadius={60} outerRadius={80}>
                        {((chartData || []) as unknown[]).map((_, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={[token.colorPrimary, token.colorSuccess, token.colorWarning, token.colorError, token.colorInfo][index % 5]} 
                          />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </div>
          </Card>
        );
      }
    } catch (e) {
      console.error('Failed to parse rich content:', e);
    }
    return null;
  };

  const segments = useMemo(() => {
    const regex = /```json\s*([\s\S]*?)\s*```/g;
    const parts: Segment[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', value: content.substring(lastIndex, match.index) });
      }
      parts.push({ type: 'rich', value: match[1] });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push({ type: 'text', value: content.substring(lastIndex) });
    }

    return parts;
  }, [content]);

  return (
    <div role="region" aria-label="Assistant message" className="chat-markdown">
      {segments.map((segment: Segment, idx: number) => {
        if (segment.type === 'rich') {
          return <div key={idx}>{renderRichContent(segment.value)}</div>;
        }

        const html = marked.parse(segment.value, { gfm: true, breaks: true }) as string;
        const sanitized = sanitizeHtml(html);

        return (
          <div
            key={idx}
            className="max-w-none whitespace-normal break-words text-sm leading-6 [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted/60 [&_code]:px-1 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted/60 [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: sanitized }}
          />
        );
      })}
    </div>
  );
}
