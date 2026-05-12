import api from '@/services/api';
import { useQuery, useMutation } from '@tanstack/react-query';

export type ApiEnvelope<T> = { success: boolean; data?: T; message?: string };

// Endpoint: /activity-logs
export const fetch_activity_logs = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/activity-logs', { params });
  return resp.data;
};
export const use_activity_logs = (params?: Record<string, any>) => useQuery(['activity_logs', params], () => fetch_activity_logs(params));

// Endpoint: /admin/companies
export const fetch_admin_companies = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/admin/companies', { params });
  return resp.data;
};
export const use_admin_companies = (params?: Record<string, any>) => useQuery(['admin_companies', params], () => fetch_admin_companies(params));

// Endpoint: /attendance
export const fetch_attendance = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/attendance', { params });
  return resp.data;
};
export const use_attendance = (params?: Record<string, any>) => useQuery(['attendance', params], () => fetch_attendance(params));

// Endpoint: /attendance/check-in
export const fetch_attendance_check_in = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/attendance/check-in', { params });
  return resp.data;
};
export const use_attendance_check_in = (params?: Record<string, any>) => useQuery(['attendance_check_in', params], () => fetch_attendance_check_in(params));

// Endpoint: /attendance/check-out
export const fetch_attendance_check_out = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/attendance/check-out', { params });
  return resp.data;
};
export const use_attendance_check_out = (params?: Record<string, any>) => useQuery(['attendance_check_out', params], () => fetch_attendance_check_out(params));

// Endpoint: /attendances
export const fetch_attendances = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/attendances', { params });
  return resp.data;
};
export const use_attendances = (params?: Record<string, any>) => useQuery(['attendances', params], () => fetch_attendances(params));

// Endpoint: /attendances/late/list
export const fetch_attendances_late_list = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/attendances/late/list', { params });
  return resp.data;
};
export const use_attendances_late_list = (params?: Record<string, any>) => useQuery(['attendances_late_list', params], () => fetch_attendances_late_list(params));

// Endpoint: /attendances/late/notify
export const fetch_attendances_late_notify = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/attendances/late/notify', { params });
  return resp.data;
};
export const use_attendances_late_notify = (params?: Record<string, any>) => useQuery(['attendances_late_notify', params], () => fetch_attendances_late_notify(params));

// Endpoint: /auth/actions
export const fetch_auth_actions = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/auth/actions', { params });
  return resp.data;
};
export const use_auth_actions = (params?: Record<string, any>) => useQuery(['auth_actions', params], () => fetch_auth_actions(params));

// Endpoint: /auth/check-otp
export const fetch_auth_check_otp = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/auth/check-otp', { params });
  return resp.data;
};
export const use_auth_check_otp = (params?: Record<string, any>) => useQuery(['auth_check_otp', params], () => fetch_auth_check_otp(params));

// Endpoint: /auth/forgot-password
export const fetch_auth_forgot_password = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/auth/forgot-password', { params });
  return resp.data;
};
export const use_auth_forgot_password = (params?: Record<string, any>) => useQuery(['auth_forgot_password', params], () => fetch_auth_forgot_password(params));

// Endpoint: /auth/login
export const fetch_auth_login = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/auth/login', { params });
  return resp.data;
};
export const use_auth_login = (params?: Record<string, any>) => useQuery(['auth_login', params], () => fetch_auth_login(params));

// Endpoint: /auth/logout
export const fetch_auth_logout = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/auth/logout', { params });
  return resp.data;
};
export const use_auth_logout = (params?: Record<string, any>) => useQuery(['auth_logout', params], () => fetch_auth_logout(params));

// Endpoint: /auth/me
export const fetch_auth_me = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/auth/me', { params });
  return resp.data;
};
export const use_auth_me = (params?: Record<string, any>) => useQuery(['auth_me', params], () => fetch_auth_me(params));

// Endpoint: /auth/refresh-token
export const fetch_auth_refresh_token = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/auth/refresh-token', { params });
  return resp.data;
};
export const use_auth_refresh_token = (params?: Record<string, any>) => useQuery(['auth_refresh_token', params], () => fetch_auth_refresh_token(params));

// Endpoint: /auth/register
export const fetch_auth_register = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/auth/register', { params });
  return resp.data;
};
export const use_auth_register = (params?: Record<string, any>) => useQuery(['auth_register', params], () => fetch_auth_register(params));

// Endpoint: /auth/reset-password
export const fetch_auth_reset_password = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/auth/reset-password', { params });
  return resp.data;
};
export const use_auth_reset_password = (params?: Record<string, any>) => useQuery(['auth_reset_password', params], () => fetch_auth_reset_password(params));

// Endpoint: /auth/sessions
export const fetch_auth_sessions = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/auth/sessions', { params });
  return resp.data;
};
export const use_auth_sessions = (params?: Record<string, any>) => useQuery(['auth_sessions', params], () => fetch_auth_sessions(params));

// Endpoint: /auth/sessions/summary
export const fetch_auth_sessions_summary = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/auth/sessions/summary', { params });
  return resp.data;
};
export const use_auth_sessions_summary = (params?: Record<string, any>) => useQuery(['auth_sessions_summary', params], () => fetch_auth_sessions_summary(params));

// Endpoint: /auth/social/login
export const fetch_auth_social_login = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/auth/social/login', { params });
  return resp.data;
};
export const use_auth_social_login = (params?: Record<string, any>) => useQuery(['auth_social_login', params], () => fetch_auth_social_login(params));

// Endpoint: /cargo-types
export const fetch_cargo_types = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/cargo-types', { params });
  return resp.data;
};
export const use_cargo_types = (params?: Record<string, any>) => useQuery(['cargo_types', params], () => fetch_cargo_types(params));

// Endpoint: /chat/messages
export const fetch_chat_messages = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/chat/messages', { params });
  return resp.data;
};
export const use_chat_messages = (params?: Record<string, any>) => useQuery(['chat_messages', params], () => fetch_chat_messages(params));

// Endpoint: /chat/messages/stream
export const fetch_chat_messages_stream = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/chat/messages/stream', { params });
  return resp.data;
};
export const use_chat_messages_stream = (params?: Record<string, any>) => useQuery(['chat_messages_stream', params], () => fetch_chat_messages_stream(params));

// Endpoint: /chat/sessions
export const fetch_chat_sessions = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/chat/sessions', { params });
  return resp.data;
};
export const use_chat_sessions = (params?: Record<string, any>) => useQuery(['chat_sessions', params], () => fetch_chat_sessions(params));

// Endpoint: /companies
export const fetch_companies = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/companies', { params });
  return resp.data;
};
export const use_companies = (params?: Record<string, any>) => useQuery(['companies', params], () => fetch_companies(params));

// Endpoint: /cost-approvals
export const fetch_cost_approvals = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/cost-approvals', { params });
  return resp.data;
};
export const use_cost_approvals = (params?: Record<string, any>) => useQuery(['cost_approvals', params], () => fetch_cost_approvals(params));

// Endpoint: /cost-categories
export const fetch_cost_categories = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/cost-categories', { params });
  return resp.data;
};
export const use_cost_categories = (params?: Record<string, any>) => useQuery(['cost_categories', params], () => fetch_cost_categories(params));

// Endpoint: /customer-groups
export const fetch_customer_groups = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/customer-groups', { params });
  return resp.data;
};
export const use_customer_groups = (params?: Record<string, any>) => useQuery(['customer_groups', params], () => fetch_customer_groups(params));

// Endpoint: /customers
export const fetch_customers = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/customers', { params });
  return resp.data;
};
export const use_customers = (params?: Record<string, any>) => useQuery(['customers', params], () => fetch_customers(params));

// Endpoint: /customers/search
export const fetch_customers_search = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/customers/search', { params });
  return resp.data;
};
export const use_customers_search = (params?: Record<string, any>) => useQuery(['customers_search', params], () => fetch_customers_search(params));

// Endpoint: /debt-overview
export const fetch_debt_overview = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/debt-overview', { params });
  return resp.data;
};
export const use_debt_overview = (params?: Record<string, any>) => useQuery(['debt_overview', params], () => fetch_debt_overview(params));

// Endpoint: /dispatch/board
export const fetch_dispatch_board = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/dispatch/board', { params });
  return resp.data;
};
export const use_dispatch_board = (params?: Record<string, any>) => useQuery(['dispatch_board', params], () => fetch_dispatch_board(params));

// Endpoint: /dispatch/daily-summary
export const fetch_dispatch_daily_summary = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/dispatch/daily-summary', { params });
  return resp.data;
};
export const use_dispatch_daily_summary = (params?: Record<string, any>) => useQuery(['dispatch_daily_summary', params], () => fetch_dispatch_daily_summary(params));

// Endpoint: /dispatch/unassigned-trips
export const fetch_dispatch_unassigned_trips = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/dispatch/unassigned-trips', { params });
  return resp.data;
};
export const use_dispatch_unassigned_trips = (params?: Record<string, any>) => useQuery(['dispatch_unassigned_trips', params], () => fetch_dispatch_unassigned_trips(params));

// Endpoint: /documentation
export const fetch_documentation = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/documentation', { params });
  return resp.data;
};
export const use_documentation = (params?: Record<string, any>) => useQuery(['documentation', params], () => fetch_documentation(params));

// Endpoint: /driver-work-schedules
export const fetch_driver_work_schedules = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/driver-work-schedules', { params });
  return resp.data;
};
export const use_driver_work_schedules = (params?: Record<string, any>) => useQuery(['driver_work_schedules', params], () => fetch_driver_work_schedules(params));

// Endpoint: /driver-work-schedules/generate
export const fetch_driver_work_schedules_generate = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/driver-work-schedules/generate', { params });
  return resp.data;
};
export const use_driver_work_schedules_generate = (params?: Record<string, any>) => useQuery(['driver_work_schedules_generate', params], () => fetch_driver_work_schedules_generate(params));

// Endpoint: /drivers
export const fetch_drivers = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/drivers', { params });
  return resp.data;
};
export const use_drivers = (params?: Record<string, any>) => useQuery(['drivers', params], () => fetch_drivers(params));

// Endpoint: /drivers/available
export const fetch_drivers_available = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/drivers/available', { params });
  return resp.data;
};
export const use_drivers_available = (params?: Record<string, any>) => useQuery(['drivers_available', params], () => fetch_drivers_available(params));

// Endpoint: /drivers/expiring-documents
export const fetch_drivers_expiring_documents = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/drivers/expiring-documents', { params });
  return resp.data;
};
export const use_drivers_expiring_documents = (params?: Record<string, any>) => useQuery(['drivers_expiring_documents', params], () => fetch_drivers_expiring_documents(params));

// Endpoint: /health
export const fetch_health = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/health', { params });
  return resp.data;
};
export const use_health = (params?: Record<string, any>) => useQuery(['health', params], () => fetch_health(params));

// Endpoint: /invoices
export const fetch_invoices = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/invoices', { params });
  return resp.data;
};
export const use_invoices = (params?: Record<string, any>) => useQuery(['invoices', params], () => fetch_invoices(params));

// Endpoint: /leave-requests
export const fetch_leave_requests = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/leave-requests', { params });
  return resp.data;
};
export const use_leave_requests = (params?: Record<string, any>) => useQuery(['leave_requests', params], () => fetch_leave_requests(params));

// Endpoint: /leave-types
export const fetch_leave_types = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/leave-types', { params });
  return resp.data;
};
export const use_leave_types = (params?: Record<string, any>) => useQuery(['leave_types', params], () => fetch_leave_types(params));

// Endpoint: /leave/balance
export const fetch_leave_balance = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/leave/balance', { params });
  return resp.data;
};
export const use_leave_balance = (params?: Record<string, any>) => useQuery(['leave_balance', params], () => fetch_leave_balance(params));

// Endpoint: /locations
export const fetch_locations = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/locations', { params });
  return resp.data;
};
export const use_locations = (params?: Record<string, any>) => useQuery(['locations', params], () => fetch_locations(params));

// Endpoint: /notifications
export const fetch_notifications = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/notifications', { params });
  return resp.data;
};
export const use_notifications = (params?: Record<string, any>) => useQuery(['notifications', params], () => fetch_notifications(params));

// Endpoint: /notifications/read-all
export const fetch_notifications_read_all = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/notifications/read-all', { params });
  return resp.data;
};
export const use_notifications_read_all = (params?: Record<string, any>) => useQuery(['notifications_read_all', params], () => fetch_notifications_read_all(params));

// Endpoint: /notifications/unread-count
export const fetch_notifications_unread_count = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/notifications/unread-count', { params });
  return resp.data;
};
export const use_notifications_unread_count = (params?: Record<string, any>) => useQuery(['notifications_unread_count', params], () => fetch_notifications_unread_count(params));

// Endpoint: /offices
export const fetch_offices = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/offices', { params });
  return resp.data;
};
export const use_offices = (params?: Record<string, any>) => useQuery(['offices', params], () => fetch_offices(params));

// Endpoint: /order-status-configs
export const fetch_order_status_configs = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/order-status-configs', { params });
  return resp.data;
};
export const use_order_status_configs = (params?: Record<string, any>) => useQuery(['order_status_configs', params], () => fetch_order_status_configs(params));

// Endpoint: /overtime
export const fetch_overtime = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/overtime', { params });
  return resp.data;
};
export const use_overtime = (params?: Record<string, any>) => useQuery(['overtime', params], () => fetch_overtime(params));

// Endpoint: /payments
export const fetch_payments = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/payments', { params });
  return resp.data;
};
export const use_payments = (params?: Record<string, any>) => useQuery(['payments', params], () => fetch_payments(params));

// Endpoint: /payroll-adjustments
export const fetch_payroll_adjustments = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/payroll-adjustments', { params });
  return resp.data;
};
export const use_payroll_adjustments = (params?: Record<string, any>) => useQuery(['payroll_adjustments', params], () => fetch_payroll_adjustments(params));

// Endpoint: /payrolls
export const fetch_payrolls = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/payrolls', { params });
  return resp.data;
};
export const use_payrolls = (params?: Record<string, any>) => useQuery(['payrolls', params], () => fetch_payrolls(params));

// Endpoint: /payrolls/export
export const fetch_payrolls_export = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/payrolls/export', { params });
  return resp.data;
};
export const use_payrolls_export = (params?: Record<string, any>) => useQuery(['payrolls_export', params], () => fetch_payrolls_export(params));

// Endpoint: /payrolls/generate
export const fetch_payrolls_generate = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/payrolls/generate', { params });
  return resp.data;
};
export const use_payrolls_generate = (params?: Record<string, any>) => useQuery(['payrolls_generate', params], () => fetch_payrolls_generate(params));

// Endpoint: /payrolls/my-salary
export const fetch_payrolls_my_salary = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/payrolls/my-salary', { params });
  return resp.data;
};
export const use_payrolls_my_salary = (params?: Record<string, any>) => useQuery(['payrolls_my_salary', params], () => fetch_payrolls_my_salary(params));

// Endpoint: /permissions
export const fetch_permissions = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/permissions', { params });
  return resp.data;
};
export const use_permissions = (params?: Record<string, any>) => useQuery(['permissions', params], () => fetch_permissions(params));

// Endpoint: /price-lists
export const fetch_price_lists = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/price-lists', { params });
  return resp.data;
};
export const use_price_lists = (params?: Record<string, any>) => useQuery(['price_lists', params], () => fetch_price_lists(params));

// Endpoint: /prices/lookup
export const fetch_prices_lookup = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/prices/lookup', { params });
  return resp.data;
};
export const use_prices_lookup = (params?: Record<string, any>) => useQuery(['prices_lookup', params], () => fetch_prices_lookup(params));

// Endpoint: /public-holidays
export const fetch_public_holidays = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/public-holidays', { params });
  return resp.data;
};
export const use_public_holidays = (params?: Record<string, any>) => useQuery(['public_holidays', params], () => fetch_public_holidays(params));

// Endpoint: /reconciliations
export const fetch_reconciliations = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/reconciliations', { params });
  return resp.data;
};
export const use_reconciliations = (params?: Record<string, any>) => useQuery(['reconciliations', params], () => fetch_reconciliations(params));

// Endpoint: /reports/costs
export const fetch_reports_costs = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/reports/costs', { params });
  return resp.data;
};
export const use_reports_costs = (params?: Record<string, any>) => useQuery(['reports_costs', params], () => fetch_reports_costs(params));

// Endpoint: /reports/dashboard
export const fetch_reports_dashboard = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/reports/dashboard', { params });
  return resp.data;
};
export const use_reports_dashboard = (params?: Record<string, any>) => useQuery(['reports_dashboard', params], () => fetch_reports_dashboard(params));

// Endpoint: /reports/debt
export const fetch_reports_debt = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/reports/debt', { params });
  return resp.data;
};
export const use_reports_debt = (params?: Record<string, any>) => useQuery(['reports_debt', params], () => fetch_reports_debt(params));

// Endpoint: /reports/drivers
export const fetch_reports_drivers = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/reports/drivers', { params });
  return resp.data;
};
export const use_reports_drivers = (params?: Record<string, any>) => useQuery(['reports_drivers', params], () => fetch_reports_drivers(params));

// Endpoint: /reports/export
export const fetch_reports_export = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/reports/export', { params });
  return resp.data;
};
export const use_reports_export = (params?: Record<string, any>) => useQuery(['reports_export', params], () => fetch_reports_export(params));

// Endpoint: /reports/maintenance
export const fetch_reports_maintenance = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/reports/maintenance', { params });
  return resp.data;
};
export const use_reports_maintenance = (params?: Record<string, any>) => useQuery(['reports_maintenance', params], () => fetch_reports_maintenance(params));

// Endpoint: /reports/payroll/export
export const fetch_reports_payroll_export = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/reports/payroll/export', { params });
  return resp.data;
};
export const use_reports_payroll_export = (params?: Record<string, any>) => useQuery(['reports_payroll_export', params], () => fetch_reports_payroll_export(params));

// Endpoint: /reports/profit
export const fetch_reports_profit = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/reports/profit', { params });
  return resp.data;
};
export const use_reports_profit = (params?: Record<string, any>) => useQuery(['reports_profit', params], () => fetch_reports_profit(params));

// Endpoint: /reports/revenue
export const fetch_reports_revenue = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/reports/revenue', { params });
  return resp.data;
};
export const use_reports_revenue = (params?: Record<string, any>) => useQuery(['reports_revenue', params], () => fetch_reports_revenue(params));

// Endpoint: /reports/revenue-summary
export const fetch_reports_revenue_summary = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/reports/revenue-summary', { params });
  return resp.data;
};
export const use_reports_revenue_summary = (params?: Record<string, any>) => useQuery(['reports_revenue_summary', params], () => fetch_reports_revenue_summary(params));

// Endpoint: /reports/trips
export const fetch_reports_trips = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/reports/trips', { params });
  return resp.data;
};
export const use_reports_trips = (params?: Record<string, any>) => useQuery(['reports_trips', params], () => fetch_reports_trips(params));

// Endpoint: /reports/vehicles
export const fetch_reports_vehicles = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/reports/vehicles', { params });
  return resp.data;
};
export const use_reports_vehicles = (params?: Record<string, any>) => useQuery(['reports_vehicles', params], () => fetch_reports_vehicles(params));

// Endpoint: /roles
export const fetch_roles = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/roles', { params });
  return resp.data;
};
export const use_roles = (params?: Record<string, any>) => useQuery(['roles', params], () => fetch_roles(params));

// Endpoint: /route-templates
export const fetch_route_templates = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/route-templates', { params });
  return resp.data;
};
export const use_route_templates = (params?: Record<string, any>) => useQuery(['route_templates', params], () => fetch_route_templates(params));

// Endpoint: /salary-adjustments
export const fetch_salary_adjustments = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/salary-adjustments', { params });
  return resp.data;
};
export const use_salary_adjustments = (params?: Record<string, any>) => useQuery(['salary_adjustments', params], () => fetch_salary_adjustments(params));

// Endpoint: /shipping-fees/calculate
export const fetch_shipping_fees_calculate = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/shipping-fees/calculate', { params });
  return resp.data;
};
export const use_shipping_fees_calculate = (params?: Record<string, any>) => useQuery(['shipping_fees_calculate', params], () => fetch_shipping_fees_calculate(params));

// Endpoint: /trips
export const fetch_trips = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/trips', { params });
  return resp.data;
};
export const use_trips = (params?: Record<string, any>) => useQuery(['trips', params], () => fetch_trips(params));

// Endpoint: /upload
export const fetch_upload = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/upload', { params });
  return resp.data;
};
export const use_upload = (params?: Record<string, any>) => useQuery(['upload', params], () => fetch_upload(params));

// Endpoint: /users
export const fetch_users = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/users', { params });
  return resp.data;
};
export const use_users = (params?: Record<string, any>) => useQuery(['users', params], () => fetch_users(params));

// Endpoint: /v2/employees
export const fetch_v2_employees = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/v2/employees', { params });
  return resp.data;
};
export const use_v2_employees = (params?: Record<string, any>) => useQuery(['v2_employees', params], () => fetch_v2_employees(params));

// Endpoint: /vehicle-types
export const fetch_vehicle_types = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/vehicle-types', { params });
  return resp.data;
};
export const use_vehicle_types = (params?: Record<string, any>) => useQuery(['vehicle_types', params], () => fetch_vehicle_types(params));

// Endpoint: /vehicles
export const fetch_vehicles = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/vehicles', { params });
  return resp.data;
};
export const use_vehicles = (params?: Record<string, any>) => useQuery(['vehicles', params], () => fetch_vehicles(params));

// Endpoint: /vehicles/available
export const fetch_vehicles_available = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/vehicles/available', { params });
  return resp.data;
};
export const use_vehicles_available = (params?: Record<string, any>) => useQuery(['vehicles_available', params], () => fetch_vehicles_available(params));

// Endpoint: /vehicles/expiring-documents
export const fetch_vehicles_expiring_documents = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/vehicles/expiring-documents', { params });
  return resp.data;
};
export const use_vehicles_expiring_documents = (params?: Record<string, any>) => useQuery(['vehicles_expiring_documents', params], () => fetch_vehicles_expiring_documents(params));

// Endpoint: /vehicles/maintenance-due
export const fetch_vehicles_maintenance_due = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/vehicles/maintenance-due', { params });
  return resp.data;
};
export const use_vehicles_maintenance_due = (params?: Record<string, any>) => useQuery(['vehicles_maintenance_due', params], () => fetch_vehicles_maintenance_due(params));

// Endpoint: /violations
export const fetch_violations = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/violations', { params });
  return resp.data;
};
export const use_violations = (params?: Record<string, any>) => useQuery(['violations', params], () => fetch_violations(params));

// Endpoint: /workforce/absences
export const fetch_workforce_absences = async (params?: Record<string, any>) => {
  const resp = await api.get<ApiEnvelope<any>>('/workforce/absences', { params });
  return resp.data;
};
export const use_workforce_absences = (params?: Record<string, any>) => useQuery(['workforce_absences', params], () => fetch_workforce_absences(params));
