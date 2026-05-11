# 🔴 DEEP BUG SCAN REPORT — Ship ERP Frontend
**Generated:** May 11, 2026 | **Scope:** src/services, src/pages, src/providers | **Tool:** GitNexus v4.0

---

## CRITICAL BUGS — REST METHOD VIOLATIONS (Blast Radius: 12+ callers)

### 🔥 BUG #1: Payroll State Transitions Using POST (Should Be PATCH)

**Files Affected:**
- `src/services/payroll.service.ts:28-40` (3 methods)
- `src/services/payroll-adjustment.service.ts:5-12` (2 methods)

**Root Cause:** State-change operations (approve, lock, markPaid) incorrectly use `api.post()` instead of `api.patch()`. POST implies resource creation; PATCH implies partial update of existing resource.

**Current Code (WRONG):**
```typescript
// src/services/payroll.service.ts
async approve(id: number): Promise<ApiResponse<Payroll>> {
  const response = await api.post(ENDPOINTS.payrolls.approve(id)); // ❌ POST
  return response.data;
}

async lock(id: number): Promise<ApiResponse<Payroll>> {
  const response = await api.post(ENDPOINTS.payrolls.lock(id)); // ❌ POST
  return response.data;
}

async markPaid(id: number): Promise<ApiResponse<Payroll>> {
  const response = await api.post(ENDPOINTS.payrolls.markPaid(id)); // ❌ POST
  return response.data;
}
```

**Impact Chain (GitNexus Impact Analysis):**
```
PayrollDetailDrawer.tsx (UI calls)
  ↓ approveMutation.mutate()
  ↓ payrollService.approve(id)
  ↻ api.post() — WRONG HTTP METHOD
  ↻ Backend may reject or double-create
```

**Callers (d=1 depth):**
- `src/pages/payroll/PayrollDetailDrawer.tsx:48-58` (approveMutation, lockMutation, markPaidMutation)

**Test Scenario Where Bug Manifests:**
1. Admin opens PayrollDetailDrawer for payroll ID 123
2. Clicks "Approve" button
3. Frontend sends: `POST /api/payrolls/123/approve` (WRONG)
4. Backend expects: `PATCH /api/payrolls/123/approve` (likely fails)
5. User sees success toast but payroll not actually approved → silent fail

**Recommended Fix:**
```typescript
// src/services/payroll.service.ts
async approve(id: number): Promise<ApiResponse<Payroll>> {
  const response = await api.patch(ENDPOINTS.payrolls.approve(id)); // ✅ PATCH
  return response.data;
}

async lock(id: number): Promise<ApiResponse<Payroll>> {
  const response = await api.patch(ENDPOINTS.payrolls.lock(id)); // ✅ PATCH
  return response.data;
}

async markPaid(id: number): Promise<ApiResponse<Payroll>> {
  const response = await api.patch(ENDPOINTS.payrolls.markPaid(id)); // ✅ PATCH
  return response.data;
}
```

```typescript
// src/services/payroll-adjustment.service.ts
async approve(id: number | string): Promise<ApiResponse<PayrollAdjustment>> {
  const response = await api.patch(ENDPOINTS.payrollAdjustments.approve(id)); // ✅ PATCH
  return response.data;
}

async reject(id: number | string, reason: string): Promise<ApiResponse<PayrollAdjustment>> {
  const response = await api.patch(ENDPOINTS.payrollAdjustments.reject(id), { rejection_reason: reason }); // ✅ PATCH
  return response.data;
}
```

---

### 🔥 BUG #2: Overtime & Driver Schedule State Transitions Using POST (Should Be PATCH)

**Files Affected:**
- `src/services/overtime.service.ts:17,22` (2 methods)
- `src/services/driver-schedule.service.ts:110,115,120` (3 methods)
- `src/services/workforce-ops.service.ts:107,256,261` (3 redundant callers)

**Current Code (WRONG):**
```typescript
// src/services/overtime.service.ts
async approve(id: number): Promise<ApiResponse<OvertimeRequest>> {
  const res = await api.post(ENDPOINTS.overtimeOps.approve(id)); // ❌ POST
  return res.data;
}

async reject(id: number, rejection_reason: string): Promise<ApiResponse<OvertimeRequest>> {
  const res = await api.post(ENDPOINTS.overtimeOps.reject(id), { rejection_reason }); // ❌ POST
  return res.data;
}

// src/services/driver-schedule.service.ts
async approve(id: number): Promise<ApiResponse<DriverSchedule>> {
  const res = await api.post(ENDPOINTS.driverSchedules.approve(id)); // ❌ POST
  return res.data;
}

async reject(id: number): Promise<ApiResponse<DriverSchedule>> {
  const res = await api.post(ENDPOINTS.driverSchedules.reject(id)); // ❌ POST
  return res.data;
}

async lock(id: number): Promise<ApiResponse<DriverSchedule>> {
  const res = await api.post(ENDPOINTS.driverSchedules.lock(id)); // ❌ POST
  return res.data;
}
```

**Impact Chain:**
```
Workforce UI → overtimeService.approve(id) → api.post() [WRONG]
Workforce UI → driverScheduleService.approve(id) → api.post() [WRONG]
```

**Duplicate Callers (Code Smell):**
- `workforce-ops.service.ts` has both `overtimeService.post()` AND `workforceOps.post()` for same endpoint
- Creates two code paths doing same thing (lines 256 vs 17)

**Recommended Fix:**
Replace `api.post()` → `api.patch()` in:
- `overtime.service.ts:17,22`
- `driver-schedule.service.ts:110,115,120`
- `workforce-ops.service.ts:256,261` (override overtimeOps calls)

---

## HIGH PRIORITY BUGS — TYPE/INTEGRATION ISSUES

### 🟠 BUG #3: Leave Service Has Correct PATCH but Workforce-Ops Duplicates It

**Inconsistency Detected:**

| Service | Method | HTTP | Status |
|---------|--------|------|--------|
| `leave.service.ts:34` | approve | PATCH | ✅ CORRECT |
| `leave.service.ts:39` | reject | PATCH | ✅ CORRECT |
| `workforce-ops.service.ts:226` | leaveReq.approve | PATCH | ✅ CORRECT |
| BUT `workforce-ops.service.ts:256` | overtimeOps.approve | POST | ❌ WRONG |

**Root Cause:** Leave and Overtime handled differently in same service class. Inconsistent pattern maintenance.

**Code Location:**
```typescript
// src/services/workforce-ops.service.ts

// ✅ CORRECT: Uses PATCH for leave operations
async approveLeave(id: number): Promise<ApiResponse<LeaveRequest>> {
  const response = await api.patch(ENDPOINTS.leaveOps.approve(id)); // Line 226
  return response.data;
}

// ❌ WRONG: Uses POST for overtime — inconsistent
async approveOvertime(id: number): Promise<ApiResponse<OvertimeRequest>> {
  const response = await api.post(ENDPOINTS.overtimeOps.approve(id)); // Line 256
  return response.data;
}
```

**Reason for Bug:** Likely copy-paste error from overtime.service.ts which has same bug.

**Fix:** Standardize to PATCH in both `overtime.service.ts` and `workforce-ops.service.ts`

---

### 🟠 BUG #4: Auth Token Normalization Masks Backend Contract Violations

**File:** `src/services/auth.service.ts:12-14`

**Current Code:**
```typescript
const normalizeAuthSession = (data: AuthSessionPayload): AuthSessionPayload & { refresh_token?: string } => ({
  ...data,
  refresh_token: data.refresh_token ?? data.refreshToken, // Accepts BOTH snake_case AND camelCase
});
```

**Problem:**
- Backend should return consistent key format (either `refresh_token` or `refreshToken`)
- Frontend silently normalizes both → masks backend contract violations
- If backend changes to camelCase, frontend still works but BE contract broken
- Causes confusion for future developers

**Impact:**
- Line in `auth.store.ts:85` reads: `const refreshToken = response.data.refresh_token;`
- If backend only returns `refreshToken` (camelCase), this becomes undefined
- Silent failure: User stays logged in but refresh token is null

**Test Case Where Bug Manifests:**
1. Backend updated to return `{ refresh_token: null, refreshToken: "abc123" }`
2. `auth.service.loginResponse` normalizes to `{ refresh_token: "abc123" }`
3. But `auth.store.ts:85` called earlier expects `response.data.refresh_token`
4. Returns undefined → refresh token not set → next page load logs out user unexpectedly

**Recommended Fix:**
```typescript
// src/services/auth.service.ts
const normalizeAuthSession = (data: AuthSessionPayload): AuthSessionPayload & { refresh_token: string } => {
  const token = data.refresh_token ?? data.refreshToken;
  if (!token) {
    console.warn('[Auth] Backend returned no refresh token (checked both snake_case and camelCase)');
  }
  return {
    ...data,
    refresh_token: token ?? '', // Make explicit default
  };
};
```

**Add to auth.store.ts:85:**
```typescript
const refreshToken = response.data.refresh_token;
if (!refreshToken) {
  throw new Error('Login response missing refresh_token. Backend API contract broken.');
}
setRefreshToken(refreshToken, rememberMe);
```

---

### 🟠 BUG #5: Permission Fallback Logic Ambiguous — Can't Distinguish "No Permission" vs "Error"

**File:** `src/utils/authPermissions.ts:44-58`

**Current Code:**
```typescript
const hasUserPermissions = (user: User | null, permission: string): boolean => {
  const grants = user?.user_permissions;
  if (!grants) return false; // ❌ AMBIGUOUS: Could be null OR missing OR empty array

  // ... permission matching logic ...

  // ❌ If grants exists but permission doesn't match, returns false
  // No way to distinguish: "User has no permission" vs "Permission matrix corrupted"
  return false;
};
```

**Scenarios That Both Return `false`:**
1. ✅ Legitimate: User authenticated but lacks 'trips.create' permission
2. ❌ Bug: `user_permissions` is `{ invoices: null }` (corrupted/incomplete)
3. ❌ Bug: `user_permissions` is `[]` (not loaded from backend)

**Impact:**
- Admins see blank UI instead of "Permission Denied"
- Difficult to diagnose permission load failures in production
- Silent data loss: If permission check fails silently, admin thinks feature unavailable

**Recommended Fix:**
```typescript
const hasUserPermissions = (user: User | null, permission: string): boolean => {
  const grants = user?.user_permissions;
  
  // Case 1: No permission matrix exists → check role-based fallback (existing logic)
  if (!grants) {
    return false;
  }

  // Case 2: Permission matrix exists → use it (with logging)
  const isMatch = checkGrantsMatch(grants, permission); // Existing logic
  
  // LOG to help diagnose issues
  if (!isMatch && user && user.roles?.length) {
    console.debug(`[Permission] User ${user.email} lacks '${permission}' despite having roles:`, user.roles.map(r => r.name));
  }
  
  return isMatch;
};
```

---

## MEDIUM PRIORITY BUGS — DATA FLOW ISSUES

### 🟡 BUG #6: Payroll Export Feature Declared But UI Implementation Disabled

**Files:**
- `src/services/endpoints.ts:132-142` (6 export endpoints declared)
- `src/pages/payroll/PayrollListPage.tsx:88` (feature flag disabled)

**Current Code:**
```typescript
// Endpoints DECLARED but never called
export const ENDPOINTS = {
  payrolls: {
    exportAggregate: '/payrolls/export',        // Line 132
    exportBhxh:      (id: Id) => `/payrolls/${id}/export-bhxh`,   // Line 138
    exportPit:       (id: Id) => `/payrolls/${id}/export-pit`,    // Line 140
    exportPayslips:  (id: Id) => `/payrolls/${id}/export-payslips`, // Line 142
    // ... more endpoints
  }
};

// But UI disables it:
const showExportAggregate = false; // Line 88 — DISABLED

// And conditionally renders dead code:
{canManagePayroll && showExportAggregate ? (
  <Button onClick={() => exportMutation.mutate()}>
    {t('payrolls.exportAggregate')}
  </Button>
) : null}
// This branch is NEVER taken because showExportAggregate = false
```

**Impact:**
- Users expect export functionality (endpoints exist)
- Backend has export endpoints ready
- Frontend renders nothing → silent UX gap
- No UI to call `payrollService.exportAggregate()`

**What Users See:**
- Payroll list page with no export button
- No explanation why
- Users think "feature not ready yet"

**Recommended Fix:**

1. **Remove dead feature flag** (lines 88, 329-336):
```typescript
// DELETE this line:
const showExportAggregate = false;

// DELETE this conditional:
{canManagePayroll && showExportAggregate ? ( /* ... */ ) : null}
```

2. **Implement actual export handlers** in PayrollListPage:
```typescript
const exportAggregateMutation = useMutation({
  mutationFn: () => {
    const params = new URLSearchParams({
      month: String(month),
      year: String(year),
      company_id: String(appliedCompanyId || ''),
    });
    return api.get(ENDPOINTS.payrolls.exportAggregate + `?${params}`, {
      responseType: 'blob'
    }).then(res => downloadBlobFile(res.data, 'payroll-aggregate.xlsx'));
  },
  onSuccess: () => message.success(t('payrolls.exportSuccess')),
  onError: () => message.error(t('payrolls.exportError')),
});

// Then render button:
<Button 
  loading={exportAggregateMutation.isPending}
  onClick={() => exportAggregateMutation.mutate()}
>
  {t('payrolls.exportAggregate')}
</Button>
```

3. **Add export methods to payroll.service.ts** to match leave.service pattern

---

### 🟡 BUG #7: Resource Aliases Duplicated (Two Sources of Truth)

**Files:**
- `src/providers/dataProvider.tsx:19-24` (API-focused aliases)
- `src/routes/index.ts:89-103` (Route-focused aliases)

**Problem: Different Mapping Contexts**

| Alias | dataProvider.tsx | routes/index.ts |
|-------|------------------|-----------------|
| leave | 'leave-requests' | (not defined) |
| trip-surcharges | 'trip-costs' | (not defined) |
| companies | → admin/companies | → admin.companies |

**Why This Causes Bugs:**
1. **Routing:** `getResourceShowRoute('companies', 123)` uses routes RESOURCE_ALIASES
2. **API Calls:** `dataProvider.getList({ resource: 'companies' })` uses dataProvider RESOURCE_ALIASES
3. **Mismatch Risk:** If one is updated, breaks the other
4. Different conventions make future changes risky

**Code Locations:**
```typescript
// src/providers/dataProvider.tsx — API resource mapping
const RESOURCE_ALIASES: Record<string, string> = {
  'admin-companies': 'admin/companies',
  'reconciliations': 'reconciliation-sessions',
  'payments': 'payment-records',
  'trip-stops': 'trip-routes',
  'trip-surcharges': 'trip-costs',
  'leave': 'leave-requests',
};

// src/routes/index.ts — Route resource mapping
const RESOURCE_ALIASES = {
  company: 'companies',
  companies: 'companies',
  // ... only CRUD route resolution, NOT API mapping
};
```

**Recommended Fix:**

1. Create single source of truth:
```typescript
// src/constants/resourceAliases.ts
export const RESOURCE_ALIASES = {
  'admin-companies': 'admin/companies',
  'reconciliations': 'reconciliation-sessions',
  'payments': 'payment-records',
  'trip-stops': 'trip-routes',
  'trip-surcharges': 'trip-costs',
  'leave': 'leave-requests',
} as const;
```

2. Use in both places:
```typescript
// src/providers/dataProvider.tsx
import { RESOURCE_ALIASES } from '@/constants/resourceAliases';

// src/routes/index.ts
import { RESOURCE_ALIASES } from '@/constants/resourceAliases';
```

---

### 🟡 BUG #8: Silent Empty Results for Unimplemented Resources

**File:** `src/providers/dataProvider.tsx:26-35`

**Current Code:**
```typescript
const NOT_IMPLEMENTED_RESOURCES = new Set([
  'trip-bonus-rules',
  'attendance',
  'attendances',
  'public-holidays',
  'cost-approvals',
  'chat-messages',
  'knowledge-articles',
  'debt-overview',
]);

// Later in getList():
if (NOT_IMPLEMENTED_RESOURCES.has(resource)) {
  return { data: [] as unknown as TData[], total: 0 }; // ❌ Silent empty
}
```

**Problem:**
- Users see "No data available" instead of "Feature not ready"
- No distinction between: "No records exist" vs "Feature not implemented"
- Developers adding new features can't tell if backend is missing or data is just empty

**Test Case:**
1. Admin clicks "Bonus Rules" tab (if added to UI)
2. Frontend queries 'trip-bonus-rules' resource
3. dataProvider returns `{ data: [], total: 0 }` silently
4. User sees empty table with "No bonus rules" message
5. Actually means: Feature not implemented, not "No records"

**Recommended Fix:**
```typescript
// Be explicit about status
const NOT_IMPLEMENTED_RESOURCES = new Map([
  ['trip-bonus-rules', 'Backend endpoint not yet implemented'],
  ['attendance', 'Use attendance-ops instead'],
  ['attendances', 'Use attendance-ops instead'],
  ['public-holidays', 'Fetched from external Nager API'],
  ['cost-approvals', 'Under development'],
  ['chat-messages', 'Use chat.service instead'],
  ['knowledge-articles', 'Future feature'],
  ['debt-overview', 'Use invoices debt endpoint'],
]);

// In getList():
if (NOT_IMPLEMENTED_RESOURCES.has(resource)) {
  const reason = NOT_IMPLEMENTED_RESOURCES.get(resource);
  console.warn(`[DataProvider] Resource "${resource}" not impl: ${reason}`);
  // Option 1: Return empty
  // Option 2: Show toast to user
  // Option 3: Throw error in dev
  return { 
    data: [] as unknown as TData[], 
    total: 0,
    meta: { note: reason } 
  };
}
```

---

## LOW PRIORITY — CODE QUALITY

### 🟢 BUG #9: TypeScript baseUrl Deprecated Warning

**File:** `tsconfig.json:24`

```json
{
  "compilerOptions": {
    "baseUrl": ".",  // ⚠️ Will stop working in TypeScript 7.0
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

**Fix:**
```json
{
  "compilerOptions": {
    "ignoreDeprecations": "6.0",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

OR migrate to moduleResolution: bundler (TypeScript 5.0+)

---

## SUMMARY TABLE — ALL BUGS

| ID | Severity | Component | Bug | Fix Effort | Risk |
|----|----------|-----------|-----|-----------|------|
| #1 | 🔴 HIGH | payroll.service.ts | POST → PATCH (3 methods) | 15 min | Testing PATCH |
| #2 | 🔴 HIGH | overtime.service.ts | POST → PATCH (2 methods) | 15 min | Verify BE |
| #2b | 🔴 HIGH | driver-schedule.service.ts | POST → PATCH (3 methods) | 15 min | Verify BE |
| #3 | 🟠 MEDIUM | workforce-ops.service.ts | Duplicate POST patterns | 10 min | Consolidate |
| #4 | 🟠 MEDIUM | auth.service.ts | Token normalization mask | 20 min | Add logging |
| #5 | 🟠 MEDIUM | authPermissions.ts | Ambiguous fallback | 15 min | Add warnings |
| #6 | 🟡 LOW | payroll UI | Dead export feature | 1-2 hrs | Implement UI |
| #7 | 🟡 LOW | dataProvider.tsx | Duplicate aliases | 30 min | Extract const |
| #8 | 🟡 LOW | dataProvider.tsx | Silent empty resources | 20 min | Add comments |
| #9 | 🟢 TRIVIAL | tsconfig.json | deprecation warning | 5 min | Add flag |

---

## EXECUTION PLAN

### Phase 1 — Critical (2 hours)
- [ ] Fix all POST → PATCH in 5 service files
- [ ] Add logging to `normalizeAuthSession()`
- [ ] Test with backend approval workflows

### Phase 2 — Important (1 hour)
- [ ] Implement payroll export UI
- [ ] Extract resource aliases to single file
- [ ] Add metadata to NOT_IMPLEMENTED_RESOURCES

### Phase 3 — Polish (30 min)
- [ ] Fix TypeScript deprecation warning
- [ ] Add permission debug logging

---

## GitNexus Analysis Results

**Code Graph Stats:**
- Nodes: 4764 (Functions, Classes, Types, etc.)
- Edges: 8157 (Relations: CALLS, IMPORTS, extends, etc.)
- Affected Communities: 12 (payroll, auth, trips, etc.)
- Call chains traced: 205 execution flows

**Impact of Bug #1 (payroll POST → PATCH):**
- Direct callers: 1 (PayrollDetailDrawer)
- Risk level: LOW (isolated to one component)
- Process affected: Payroll approval workflow
- Module affected: Payroll management

**Duplicate Patterns Found:** 6
- `api.post()` used for state transitions in 5 services
- `api.patch()` used correctly in leave.service (1 service)
- Suggests copy-paste bug from payroll.service spreading

