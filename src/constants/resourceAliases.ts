/**
 * Canonical frontend resource name aliases.
 * Maps legacy or alternative resource names to their canonical API endpoints.
 * 
 * Single source of truth for both:
 * - Route-based resource resolution (src/routes/index.ts)
 * - API-based resource mapping (src/providers/dataProvider.tsx)
 */
export const RESOURCE_ALIASES = {
  'admin-companies': 'admin/companies',
  'reconciliations': 'reconciliation-sessions',
  'payments': 'payment-records',
  'trip-stops': 'trip-routes',
  'trip-surcharges': 'trip-costs',
  'leave': 'leave-requests',
} as const;

/**
 * Resources completely unimplemented in backend.
 * Silently returns [ ] to avoid 404 spam during polling.
 * 
 * IMPORTANT: If adding a new page that queries these resources,
 * the DataProvider will return empty data. Check the rationale below
 * to find the correct alternative endpoint or service.
 * 
 * Rationale per resource:
 */
export const NOT_IMPLEMENTED_RESOURCES = new Set([
  /** trip-bonus-rules: Endpoint not yet implemented in backend.
   * Backend TODO: Implement /api/trip-bonus-rules CRUD endpoints for trip bonus configuration.
   * Fallback: Use trip-costs for cost rules instead, or implement in backend.
   */
  'trip-bonus-rules',
  
  /** attendance: LEGACY name (use 'attendance-ops' instead).
   * This was the old singular form; backend now uses 'attendance-ops' operational endpoints.
   * Use: attendance-ops service (workforce-ops.service.ts) for check-in/check-out operations.
   */
  'attendance',
  
  /** attendances: LEGACY plural form (use 'attendance-ops' instead).
   * Same as above — replaced by operational 'attendance-ops' endpoints.
   * Use: workforce-ops.service for listAttendance(), checkIn(), checkOut().
   */
  'attendances',
  
  /** public-holidays: Fetched from external Nager.Date API (https://date.nager.at).
   * Primary source: Free external API for public holidays by country/year.
   * Fallback: Backend endpoint /api/public-holidays if Nager API fails or needs customization.
   * Use: workforce-ops.service.listPublicHolidays() which handles both sources.
   */
  'public-holidays',
  
  /** cost-approvals: Feature under development.
   * Backend TODO: Implement /api/cost-approvals CRUD + approve/reject state transitions.
   * Status: In planning phase, estimated Q3 2026.
   * Fallback: None currently available.
   */
  'cost-approvals',
  
  /** chat-messages: Use chat service with sessions instead.
   * The chat system uses session-based architecture, not flat message list.
   * Use: chat.service.ts methods: getMessages(sessionId), sendMessage() instead.
   * Better UX: Session-scoped messages prevent out-of-context queries.
   */
  'chat-messages',
  
  /** knowledge-articles: Future feature placeholder.
   * Part of knowledge management module (currently not prioritized).
   * Roadmap status: Under review, no committed implementation date.
   * Fallback: None currently available (documentation in wiki instead).
   */
  'knowledge-articles',
  
  /** debt-overview: Use /invoices/debt-overview endpoint instead.
   * The resource is available but under 'invoices' module, not standalone.
   * Use: api.get(ENDPOINTS.debtOverview) or invoiceService methods.
   * Why separate: Debt is a derived view of invoice status, not independent entity.
   */
  'debt-overview',
]);

/**
 * Fallback resource mapping: if main resource returns 404, try these alternatives.
 * Useful for supporting legacy endpoints during backend migration.
 * 
 * Example: companies → admin/companies (tries /companies first, then /admin/companies)
 */
export const LEGACY_LIST_FALLBACKS: Record<string, string[]> = {
  companies: ['admin/companies'],
  'leave-requests': ['workforce/leave-requests'],
};

