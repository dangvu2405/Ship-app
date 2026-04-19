/**
 * Bảng phân tách BHXH/BHYT/BHTN cho một dòng PayrollDetail.
 * Nếu backend chưa trả về các field bhxh_*, tự tính từ vnPayrollCalc.
 */
import { Descriptions, Table, Tag, Typography } from 'antd';
import { useTranslation } from '@/hooks/useTranslation';
import type { PayrollDetail } from '@/types';
import { calcSI, calcPIT, fmtVND, SI_SALARY_CAP } from '@/utils/vnPayrollCalc';

interface Props {
  line: PayrollDetail;
}

function resolveField(serverVal: number | undefined, calcVal: number): number {
  return typeof serverVal === 'number' && serverVal > 0 ? serverVal : calcVal;
}

export function PayrollSIBreakdown({ line }: Props) {
  const { t } = useTranslation();
  const gross = line.gross_salary ?? line.base_salary;
  const computed = calcSI(gross);
  const computedPIT = calcPIT(
    gross,
    resolveField(line.total_si_employee, computed.totalSIEmployee),
    line.dependants_count ?? 0,
  );

  const bhxhEmp   = resolveField(line.bhxh_employee,   computed.bhxhEmployee);
  const bhytEmp   = resolveField(line.bhyt_employee,   computed.bhytEmployee);
  const bhtnEmp   = resolveField(line.bhtn_employee,   computed.bhtnEmployee);
  const totalEmp  = resolveField(line.total_si_employee, computed.totalSIEmployee);

  const bhxhEr    = resolveField(line.bhxh_employer,   computed.bhxhEmployer);
  const bhytEr    = resolveField(line.bhyt_employer,   computed.bhytEmployer);
  const bhtnEr    = resolveField(line.bhtn_employer,   computed.bhtnEmployer);
  const bhtnldEr  = resolveField(line.bhtnld_bnn_employer, computed.bhtnldBnnEmployer);
  const totalEr   = resolveField(line.total_si_employer,   computed.totalSIEmployer);

  const siBase    = resolveField(line.si_salary_base, computed.siSalaryBase);
  const isCapped  = siBase >= SI_SALARY_CAP;

  const pitAmt    = resolveField(line.pit ?? line.tax, computedPIT.totalPIT);
  const assessable = resolveField(line.assessable_income, computedPIT.assessableIncome);

  return (
    <div style={{ padding: '8px 0' }}>
      {/* BHXH */}
      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
        {t('payrolls.bhxhSection')}
        {isCapped && <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>Trần BH</Tag>}
      </Typography.Text>

      <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label={t('payrolls.grossSalary')}>{fmtVND(gross)}</Descriptions.Item>
        <Descriptions.Item label={t('payrolls.siSalaryBase')}>{fmtVND(siBase)}</Descriptions.Item>

        <Descriptions.Item label={t('payrolls.bhxhEmployee')}>{fmtVND(bhxhEmp)}</Descriptions.Item>
        <Descriptions.Item label={t('payrolls.bhxhEmployer')}>{fmtVND(bhxhEr)}</Descriptions.Item>

        <Descriptions.Item label={t('payrolls.bhytEmployee')}>{fmtVND(bhytEmp)}</Descriptions.Item>
        <Descriptions.Item label={t('payrolls.bhytEmployer')}>{fmtVND(bhytEr)}</Descriptions.Item>

        <Descriptions.Item label={t('payrolls.bhtnEmployee')}>{fmtVND(bhtnEmp)}</Descriptions.Item>
        <Descriptions.Item label={t('payrolls.bhtnEmployer')}>{fmtVND(bhtnEr)}</Descriptions.Item>

        <Descriptions.Item label={<strong>{t('payrolls.totalSIEmployee')}</strong>}>
          <Typography.Text type="danger" strong>{fmtVND(totalEmp)}</Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label={<strong>{t('payrolls.totalSIEmployer')}</strong>}>
          <Typography.Text type="warning" strong>{fmtVND(totalEr + bhtnldEr)}</Typography.Text>
        </Descriptions.Item>
      </Descriptions>

      {/* PIT brackets */}
      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
        {t('payrolls.pitSection')}
      </Typography.Text>

      <Descriptions column={2} size="small" bordered style={{ marginBottom: 12 }}>
        <Descriptions.Item label={t('payrolls.taxableIncome')}>{fmtVND(gross - totalEmp)}</Descriptions.Item>
        <Descriptions.Item label={t('payrolls.assessableIncome')}>{fmtVND(assessable)}</Descriptions.Item>
        <Descriptions.Item label={t('payrolls.personalDeduction')}>{fmtVND(computedPIT.personalDeduction)}</Descriptions.Item>
        <Descriptions.Item label={t('payrolls.dependantDeduction')}>
          {fmtVND(computedPIT.dependantDeductionTotal)} ({line.dependants_count ?? 0} người)
        </Descriptions.Item>
      </Descriptions>

      <Table
        size="small"
        pagination={false}
        rowKey="level"
        dataSource={computedPIT.brackets.filter((b) => b.incomeInBracket > 0)}
        columns={[
          { title: 'Bậc', dataIndex: 'level', width: 60, render: (v: number) => `Bậc ${v}` },
          { title: 'Thu nhập trong bậc', dataIndex: 'incomeInBracket', render: (v: number) => fmtVND(v) },
          { title: 'Thuế suất', dataIndex: 'rate', render: (v: number) => `${(v * 100).toFixed(0)}%` },
          { title: 'Thuế', dataIndex: 'tax', render: (v: number) => <Typography.Text strong>{fmtVND(v)}</Typography.Text> },
        ]}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={3}>
              <strong>{t('payrolls.pit')}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={3}>
              <Typography.Text type="danger" strong>{fmtVND(pitAmt)}</Typography.Text>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
        style={{ marginBottom: 8 }}
      />

      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
        {t('payrolls.siRateNote')}
      </Typography.Text>
    </div>
  );
}
