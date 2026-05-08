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
    refresh: '/auth/refresh',
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
  },
  customerGroups: crud('/customer-groups'),
  priceLists: {
    ...crud('/price-lists'),
    items: (id: Id) => `/price-list-items?price_list_id=${id}`,
    itemById: (_id: Id, itemId: Id) => `/price-list-items/${itemId}`,
  },
  routeTemplates: crud('/route-templates'),
  reconciliations: crud('/reconciliation-sessions'),
  payments: crud('/payment-records'),
  trips: {
    ...crud('/trips'),
    costs: (id: Id) => `/trip-costs?trip_id=${id}`,
    assign:    (id: Id) => `/trips/${id}/assign`,
    accept:    (id: Id) => `/trips/${id}/accept`,
    start:     (id: Id) => `/trips/${id}/start`,
    deliver:   (id: Id) => `/trips/${id}/deliver`,
    pickup:    (id: Id) => `/trips/${id}/pickup`,
    transit:   (id: Id) => `/trips/${id}/transit`,
    arrive:    (id: Id) => `/trips/${id}/arrive`,
    complete:  (id: Id) => `/trips/${id}/complete`,
    cancel:    (id: Id) => `/trips/${id}/cancel`,
    delay:     (id: Id) => `/trips/${id}/delay`,
    emergency: (id: Id) => `/trips/${id}/emergency`,
    resume:    (id: Id) => `/trips/${id}/resume`,
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
    /** Phát hành hóa đơn (draft → issued, ký số nội bộ). */
    issue:      (id: Id) => `/invoices/${id}/issue`,
    /** Gửi hóa đơn lên CQT (issued → sent_cqt). */
    sendCqt:    (id: Id) => `/invoices/${id}/send-cqt`,
    /** Đánh dấu đã thanh toán. */
    markPaid:   (id: Id) => `/invoices/${id}/mark-paid`,
    /** Hủy hóa đơn (kèm lý do, gửi thông báo CQT nếu đã sent_cqt). */
    cancel:     (id: Id) => `/invoices/${id}/cancel`,
    /** Tải PDF hóa đơn điện tử. */
    exportPdf:  (id: Id) => `/invoices/${id}/export-pdf`,
    /** Gửi hóa đơn qua email cho khách hàng. */
    sendEmail:  (id: Id) => `/invoices/${id}/send-email`,
    statusHistories: (id: Id) => `/invoices/${id}/status-histories`,
  },
  debtOverview: '/invoices/debt-overview',
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
    dashboard: '/dashboard/overview',
    payrollSummary: '/reports/payroll-summary',
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
    submit: (id: Id) => `/driver-schedules/${id}/submit`,
    approve: (id: Id) => `/driver-schedules/${id}/approve`,
    reject: (id: Id) => `/driver-schedules/${id}/reject`,
    lock: (id: Id) => `/driver-schedules/${id}/lock`,
    override: (id: Id) => `/driver-schedules/${id}/override`,
    hosCheck: (id: Id) => `/driver-schedules/${id}/hos-check`,
  },
  workSchedules: {
    base: '/driver-work-schedules',
    byId: (id: Id) => `/driver-work-schedules/${id}`,
    generate: '/work-schedules/generate',
    submit: (id: Id) => `/work-schedules/${id}/submit`,
    approve: (id: Id) => `/work-schedules/${id}/approve`,
    reject: (id: Id) => `/work-schedules/${id}/reject`,
  },
  workforce: {
    driverSchedules: '/workforce/driver-schedules',
    approveDriverSchedule: (id: Id) => `/workforce/driver-schedules/${id}/approve`,
    lockDriverSchedule: (id: Id) => `/workforce/driver-schedules/${id}/lock`,
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
    items: (id: Id) => `/reconciliation-items?session_id=${id}`,
    itemById: (_id: Id, itemId: Id) => `/reconciliation-items/${itemId}`,
    confirm: (id: Id) => `/reconciliation-sessions/${id}/confirm`,
    lock: (_id: Id) => `/reconciliation-sessions/${_id}/lock`,
  },
  priceLookup: '/price-lookup',
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
} as const;
