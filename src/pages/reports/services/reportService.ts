import { ReportResponse, ReportRow } from '../types';

// Mock data generator
const generateMockData = (count: number): ReportRow[] => {
  const data: ReportRow[] = [];
  for (let i = 0; i < count; i++) {
    data.push({
      key: i,
      id: `ID-${i}`,
      name: `Product ${i}`,
      category: `Category ${i % 5}`,
      price: Math.random() * 100,
      stock: Math.floor(Math.random() * 1000),
      createdAt: new Date(new Date().getTime() - Math.random() * 1e10).toISOString(),
    });
  }
  return data;
};

const allMockData = generateMockData(10000);

// Mock API service
export const getReportData = async (params: {
  page: number;
  pageSize: number;
  [key: string]: any;
}): Promise<ReportResponse> => {
  console.log('Fetching report data with params:', params);

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const { page, pageSize, sortField, sortOrder, ...filters } = params;

  let filteredData = allMockData;

  // Apply filters
  Object.keys(filters).forEach(key => {
    if (filters[key]) {
      filteredData = filteredData.filter(item =>
        String(item[key]).toLowerCase().includes(String(filters[key]).toLowerCase())
      );
    }
  });

  // Apply sorting
  if (sortField && sortOrder) {
    filteredData.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (aValue < bValue) return sortOrder === 'ascend' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'ascend' ? 1 : -1;
      return 0;
    });
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = filteredData.slice(start, end);

  return {
    data: paginatedData,
    meta: {
      currentPage: page,
      perPage: pageSize,
      total: filteredData.length,
      totalPages: Math.ceil(filteredData.length / pageSize),
    },
  };
};
