type Id = number | string;

const crud = (base: string) => ({
  base,
  byId: (id: Id) => `${base}/${id}`,
});

export const ENDPOINTS = {
  public: {
    root: '/',
    health: '/health',
    docs: '/documentation',
    upload: '/upload',
  },
  auth: {
    login: '/auth/login',
    socialLogin: '/auth/social/login',
    logout: '/auth/logout',
    // Backend exposes public refresh-by-token endpoint as /auth/refresh-token
    refresh: '/auth/refresh-token',
    register: '/auth/register',
    me: '/auth/me',
    forgotPassword: '/auth/forgot-password',
    checkOtp: '/auth/check-otp',
    forgotPasswordReset: '/auth/reset-password',
    actions: '/auth/actions',
    sessions: {
      base: '/auth/sessions',
      summary: '/auth/sessions/summary',
      revoke: (sessionId: Id) => `/auth/sessions/${sessionId}/revoke`,
      lockAccount: (sessionId: Id) => `/auth/sessions/${sessionId}/lock-account`,
    },
  },
  roles: {
    ...crud('/roles'),
    syncRolePermissions: (roleId: Id) => `/roles/${roleId}/permissions`,
    permissions: '/permissions',
    permissionById: (permissionId: Id) => `/permissions/${permissionId}`,
  },
  vehicles: {
    ...crud('/vehicles'),
    available: '/vehicles/available',
    expiringDocuments: '/vehicles/expiring-documents',
    maintenanceDue: '/vehicles/maintenance-due',
    documents: (id: Id) => `/vehicle-documents?vehicle_id=${id}`,
    documentById: (_vehicleId: Id, documentId: Id) => `/vehicle-documents/${documentId}`,
    assignments: (id: Id) => `/vehicle-assignments?vehicle_id=${id}`,
    assignmentsRelease: (id: Id) => `/vehicle-assignments/${id}/release`,
    maintenanceSchedules: (id: Id) => `/maintenance-schedules?vehicle_id=${id}`,
    maintenanceRecords: (id: Id) => `/maintenance-records?vehicle_id=${id}`,
    status: (id: Id) => `/vehicles/${id}/status`,
  },
  maintenanceSchedules: {
    byId: (id: Id) => `/maintenance-schedules/${id}`,
  },
  maintenanceRecords: {
    complete: (id: Id) => `/maintenance-records/${id}/complete`,
  },
  dispatch: {
    board: '/dispatch/board',
    unassignedTrips: '/dispatch/unassigned-trips',
    dailySummary: '/dispatch/daily-summary',
  },
  drivers: {
    ...crud('/drivers'),
    available: '/drivers/available',
    expiringDocuments: '/drivers/expiring-documents',
  },
  customers: {
    ...crud('/customers'),
    trips: (id: Id) => `/customers/${id}/trips`,
    debt: (id: Id) => `/customers/${id}/debt`,
    payments: (id: Id) => `/customers/${id}/payments`,
    priceLists: (id: Id) => `/customers/${id}/price-lists`,
    groups: '/customer-groups',
  },
  customerGroups: crud('/customer-groups'),
  priceLists: {
    ...crud('/price-lists'),
    items: (id: Id) => `/price-lists/${id}/items`,
    itemById: (priceListId: Id, itemId: Id) => `/price-lists/${priceListId}/items/${itemId}`,
  },
  routeTemplates: crud('/route-templates'),
  reconciliations: crud('/reconciliations'),
  payments: crud('/payments'),
  trips: {
    ...crud('/trips'),
    costs: (id: Id) => `/trip-costs?trip_id=${id}`,
    assign: (id: Id) => `/trips/${id}/assign`,
    start: (id: Id) => `/trips/${id}/start`,
    deliver: (id: Id) => `/trips/${id}/deliver`,
    complete: (id: Id) => `/trips/${id}/complete`,
    cancel: (id: Id) => `/trips/${id}/cancel`,
    changeVehicle: (id: Id) => `/trips/${id}/change-vehicle`,
    changeDriver: (id: Id) => `/trips/${id}/change-driver`,
  },
  tripStops: {
    arrive: (stopId: Id) => `/stops/${stopId}/arrive`,
    complete: (stopId: Id) => `/stops/${stopId}/complete`,
  },
  chat: {
    messages: '/chat/messages',
    messagesStream: '/chat/messages/stream',
    sessions: '/chat/sessions',
    sessionById: (sessionId: Id) => `/chat/sessions/${sessionId}`,
  },
  attendanceLate: {
    list: '/attendances/late/list',
    notify: '/attendances/late/notify',
  },
  invoices: {
    ...crud('/invoices'),
    issue: (id: Id) => `/invoices/${id}/issue`,
    /** GET — tra cứu / trạng thái CQT theo `api.php`. */
    cqt: (id: Id) => `/invoices/${id}/cqt`,
    markPaid: (id: Id) => `/invoices/${id}/mark-paid`,
    cancel: (id: Id) => `/invoices/${id}/cancel`,
    pdf: (id: Id) => `/invoices/${id}/pdf`,
    /** PATCH — action `email` trên backend. */
    email: (id: Id) => `/invoices/${id}/email`,
    statusHistories: (id: Id) => `/invoices/${id}/status-histories`,
  },
  debtOverview: '/debt-overview',
  attendances: crud('/attendances'),
  payrolls: {
    ...crud('/payrolls'),
    generate: '/payrolls/generate',
    /** Xuất bảng lương tổng hợp (.xlsx) theo kỳ — query: month, year, company_id, driver_id. */
    exportAggregate: '/payrolls/export',
    approve:      (id: Id) => `/payrolls/${id}/approve`,
    lock:         (id: Id) => `/payrolls/${id}/lock`,
    markPaid:     (id: Id) => `/payrolls/${id}/mark-paid`,
    export:       (id: Id) => `/payrolls/${id}/export`,
    /** Xuất file khai báo BHXH D02-TS (xlsx/csv). */
    exportBhxh:   (id: Id) => `/payrolls/${id}/export-bhxh`,
    /** Xuất tờ khai thuế TNCN 05/KK-TNCN (xlsx). */
    exportPit:    (id: Id) => `/payrolls/${id}/export-pit`,
    /** Xuất phiếu lương từng nhân viên (pdf zip). */
    exportPayslips: (id: Id) => `/payrolls/${id}/export-payslips`,
    mySalary:     '/payrolls/my-salary',
    driverHistory: (driverId: Id) => `/payrolls/driver/${driverId}`,
  },
  payrollAdjustments: {
    ...crud('/payroll-adjustments'),
    approve: (id: Id) => `/payroll-adjustments/${id}/approve`,
    reject: (id: Id) => `/payroll-adjustments/${id}/reject`,
  },
  salaryAdjustments: {
    base: '/salary-adjustments',
    byId: (id: Id) => `/salary-adjustments/${id}`,
    cancel: (id: Id) => `/salary-adjustments/${id}/cancel`,
  },
  reports: {
    dashboard: '/reports/dashboard',
    /** Backend: `GET /reports/payroll/export` — response JSON phải khớp `PayrollSummaryData` hoặc đổi UI. */
    payrollSummary: '/reports/payroll/export',
    revenueSummary: '/reports/revenue-summary',
    revenue: '/reports/revenue',
    costs: '/reports/costs',
    trips: '/reports/trips',
    profit: '/reports/profit',
    vehicles: '/reports/vehicles',
    drivers: '/reports/drivers',
    maintenance: '/reports/maintenance',
    debt: '/reports/debt',
    export: '/reports/export',
  },
  driverSchedules: {
    base: '/driver-work-schedules',
    byId: (id: Id) => `/driver-work-schedules/${id}`,
    submit: (id: Id) => `/driver-work-schedules/${id}/submit`,
    approve: (id: Id) => `/driver-work-schedules/${id}/approve`,
    reject: (id: Id) => `/driver-work-schedules/${id}/reject`,
    /** Không có trong `api.md` — giữ path dự kiến nếu backend bổ sung. */
    lock: (id: Id) => `/driver-work-schedules/${id}/lock`,
    override: (id: Id) => `/driver-work-schedules/${id}/override`,
    hosCheck: (id: Id) => `/driver-work-schedules/${id}/hos-check`,
  },
  workSchedules: {
    base: '/driver-work-schedules',
    byId: (id: Id) => `/driver-work-schedules/${id}`,
    generate: '/driver-work-schedules/generate',
    submit: (id: Id) => `/driver-work-schedules/${id}/submit`,
    approve: (id: Id) => `/driver-work-schedules/${id}/approve`,
    reject: (id: Id) => `/driver-work-schedules/${id}/reject`,
  },
  workforce: {
    driverSchedules: '/driver-work-schedules',
    approveDriverSchedule: (id: Id) => `/driver-work-schedules/${id}/approve`,
    lockDriverSchedule: (id: Id) => `/driver-work-schedules/${id}/lock`,
    leaveRequests: '/leave-requests',
    absences: '/workforce/absences',
  },
  publicHolidays: {
    list: '/public-holidays',
  },
  attendanceOps: {
    list: '/attendance',
    checkIn: '/attendance/check-in',
    checkOut: '/attendance/check-out',
    adjust: (id: Id) => `/attendance/${id}/adjust`,
  },
  leaveOps: {
    types: '/leave-types',
    base: '/leave-requests',
    balance: '/leave/balance',
    byId: (id: Id) => `/leave-requests/${id}`,
    approve: (id: Id) => `/leave-requests/${id}/approve`,
    reject: (id: Id) => `/leave-requests/${id}/reject`,
    cancel: (id: Id) => `/leave-requests/${id}/cancel`,
  },
  overtimeOps: {
    base: '/overtime',
    byId: (id: Id) => `/overtime/${id}`,
    approve: (id: Id) => `/overtime/${id}/approve`,
    reject: (id: Id) => `/overtime/${id}/reject`,
  },
  violationOps: {
    base: '/violations',
    byId: (id: Id) => `/violations/${id}`,
    confirm: (id: Id) => `/violations/${id}/confirm`,
    dispute: (id: Id) => `/violations/${id}/dispute`,
    resolveDispute: (id: Id) => `/violations/${id}/resolve-dispute`,
    waive: (id: Id) => `/violations/${id}/waive`,
  },
  v2: {
    employees: {
      base: '/v2/employees',
      byId: (id: Id) => `/v2/employees/${id}`,
    },
  },
  notifications: {
    base: '/notifications',
    byId: (id: Id) => `/notifications/${id}`,
    /** Đánh dấu một thông báo đã đọc. */
    markRead:    (id: Id) => `/notifications/${id}/read`,
    /** Đánh dấu tất cả đã đọc. */
    markAllRead: '/notifications/read-all',
    /** Lấy số chưa đọc (lightweight). */
    unreadCount: '/notifications/unread-count',
  },
  activityLogs: {
    base: '/activity-logs',
  },
  costCategories: {
    base: '/cost-categories',
  },
  costApprovals: {
    base: '/cost-approvals',
    approve: (id: Id) => `/cost-approvals/${id}/approve`,
    reject: (id: Id) => `/cost-approvals/${id}/reject`,
  },
  users: {
    ...crud('/users'),
    permissions: (id: Id) => `/users/${id}/permissions`,
    status: (id: Id) => `/users/${id}/status`,
    resetPassword: (id: Id) => `/users/${id}/reset-password`,
  },
  cargoTypes: crud('/cargo-types'),
  vehicleTypes: crud('/vehicle-types'),
  locations: crud('/locations'),
  orderStatusConfigs: {
    base: '/order-status-configs',
    byId: (id: Id) => `/order-status-configs/${id}`,
  },
  reconciliationItems: {
    items: (id: Id) => `/reconciliations/${id}/items`,
    itemById: (sessionId: Id, itemId: Id) => `/reconciliations/${sessionId}/items/${itemId}`,
    confirm: (id: Id) => `/reconciliations/${id}/confirm`,
    /** Không có trong `api.md` snapshot. */
    lock: (id: Id) => `/reconciliations/${id}/lock`,
  },
  priceLookup: '/prices/lookup',
  customerSearch: '/customers/search',
  companies: {
    ...crud('/companies'),
    status: (id: Id) => `/companies/${id}/status`,
  },
  offices: {
    ...crud('/offices'),
    applySchedule: (officeId: Id) => `/offices/${officeId}/apply-schedule`,
  },
  adminCompanies: {
    ...crud('/admin/companies'),
    status: (id: Id) => `/admin/companies/${id}/status`,
  },
  shippingFeeLookup: '/shipping-fees/calculate',
} as const;

