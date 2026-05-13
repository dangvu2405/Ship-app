import { ReportRow, ReportColumn } from '../types';

const exportToExcel = (
  data: ReportRow[],
  columns: ReportColumn[],
  fileName: string
) => {
  const escapeHtml = (value: unknown) => {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const headerCells = columns
    .map(col => `<th>${escapeHtml(col.title)}</th>`)
    .join('');
  const bodyRows = data
    .map(row => {
      const cells = columns
        .map(col => `<td>${escapeHtml((row as any)[col.dataIndex])}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
  </head>
  <body>
    <table>
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </body>
</html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};

export const exportService = {
  exportToExcel,
};
