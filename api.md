<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CargoTypeController;
use App\Http\Controllers\Api\CetaSpecController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\CostCategoryController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\CustomerGroupController;
use App\Http\Controllers\Api\ShippingFeeController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\VehicleAssignmentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Toàn bộ nghiệp vụ dùng một prefix `/api/...` (không mirror `/api/v1`).
| Convention:
| - Dùng Route::apiResource cho các resource CRUD chuẩn.
| - Các action đặc thù (không thuộc CRUD) đặt trong group của resource đó.
| - Tên resource dùng kebab-case (vd: vehicle-types).
| - Controller nên "mỏng", chỉ điều phối request/response, logic nằm trong Service/Action.
|
*/

// --- Public Routes ---
Route::get('/', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is running',
        'timestamp' => now()->toDateTimeString(),
    ]);
});

Route::get('/health', fn() => response()->json(['success' => true, 'message' => 'API is running', 'timestamp' => now()->toDateTimeString()]));

Route::controller(AuthController::class)->prefix('auth')->group(function (): void {
    Route::post('/login', 'login')->middleware('throttle:5,1');
    Route::post('/social/login', 'socialLogin')->middleware('throttle:10,1');
    Route::post('/refresh-token', 'refreshByToken')->middleware('throttle:20,1');
    Route::post('/forgot-password', 'forgotPassword')->middleware('throttle:3,1');
    Route::post('/check-otp', 'checkOtp')->middleware('throttle:10,1');
    Route::post('/reset-password', 'resetPassword')->middleware('throttle:5,1');
});

// --- Authenticated Routes ---
Route::middleware(['auth:sanctum', 'tenant.context', 'track.actions'])->group(function (): void {
    // region Auth & User Management
    Route::controller(AuthController::class)->prefix('auth')->group(function (): void {
        Route::post('/logout', 'logout');
        Route::post('/refresh', 'refresh');
        Route::get('/me', 'me');
        Route::patch('/password', 'changePassword');
        Route::get('/logs', 'logs');
        Route::get('/actions', 'actions');
        Route::get('/sessions', 'sessions');
        Route::get('/sessions/summary', 'sessionsSummary');
        Route::post('/sessions/{sessionId}/revoke', 'revokeSession');
        Route::post('/sessions/{sessionId}/lock-account', 'lockAccountForSession');
    });

    // NOTE: CetaSpecController là một God Controller, cần được refactor thành các controller riêng.
    // Tạm thời giữ lại để không phá vỡ logic, nhưng đã chuyển sang apiResource.
    Route::group(['defaults' => ['resource' => 'users']], function () {
        Route::apiResource('users', CetaSpecController::class);
    });
    Route::put('users/{id}/permissions', [CetaSpecController::class, 'nestedStore'])
        ->defaults('parent', 'users')->defaults('child', 'user-permissions');
    Route::patch('users/{id}/status', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'users')->defaults('actionName', 'status');
    Route::post('users/{id}/reset-password', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'users')->defaults('actionName', 'reset-password');

    Route::group(['defaults' => ['resource' => 'companies']], function () {
        Route::apiResource('companies', CetaSpecController::class);
    });
    Route::patch('companies/{id}/status', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'companies')->defaults('actionName', 'status');
    // endregion

    // region Upload & Chat
    Route::controller(UploadController::class)->prefix('upload')->group(function (): void {
        Route::post('/', 'store');
        Route::post('/image', 'storeImage');
        Route::post('/document', 'storeDocument');
        // TODO: DELETE /upload thiếu ID, cần sửa thành DELETE /uploads/{id} và trỏ tới controller/method hợp lệ.
        // Route::delete('/', [CetaSpecController::class, 'uploadDelete']);
    });

    Route::controller(ChatController::class)->prefix('chat')->group(function (): void {
        Route::get('/sessions', 'sessions');
        Route::delete('/sessions/{sessionId}', 'destroySession');
        Route::get('/messages', 'index');
        Route::post('/messages', 'store');
        Route::post('/messages/stream', 'stream');
    });
    // endregion

    // region Catalogs (Danh mục)
    Route::group(['defaults' => ['resource' => 'vehicle-types']], function () {
        Route::apiResource('vehicle-types', CetaSpecController::class)->except('show');
    });
    Route::patch('vehicle-types/reorder', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'vehicle-types')->defaults('actionName', 'reorder');

    Route::apiResource('cargo-types', CargoTypeController::class)->except('show');
    Route::apiResource('cost-categories', CostCategoryController::class)->except('show');
    Route::group(['defaults' => ['resource' => 'spare-parts']], function () {
        Route::apiResource('spare-parts', CetaSpecController::class)->except('show');
    });
    Route::group(['defaults' => ['resource' => 'locations']], function () {
        Route::apiResource('locations', CetaSpecController::class);
    });
    Route::get('locations/search', [CetaSpecController::class, 'index'])->defaults('resource', 'locations');
    Route::group(['defaults' => ['resource' => 'route-templates']], function () {
        Route::apiResource('route-templates', CetaSpecController::class);
    });

    Route::get('order-status-configs', [CetaSpecController::class, 'index'])->defaults('resource', 'order-status-configs');
    // NOTE: Dùng POST để tạo mới/cập nhật cả bộ config, thay vì PUT trên collection.
    Route::post('order-status-configs', [CetaSpecController::class, 'store'])->defaults('resource', 'order-status-configs');
    // endregion

    // region Customers & Pricing
    Route::apiResource('customers', CustomerController::class);
    Route::get('customers/{customer}/trips', [CetaSpecController::class, 'nestedIndex'])
        ->defaults('parent', 'customers')->defaults('child', 'trips');
    Route::get('customers/{customer}/debt', [CetaSpecController::class, 'debtOverview']);
    Route::get('debt-overview', [CetaSpecController::class, 'debtOverview']);

    Route::apiResource('customer-groups', CustomerGroupController::class)->only('index');

    Route::prefix('price-lists')->controller(CetaSpecController::class)->group(function () {
        Route::put('/{id}', 'update')->defaults('resource', 'price-lists');
        Route::delete('/{id}', 'destroy')->defaults('resource', 'price-lists');
        Route::get('/{id}/items', 'nestedIndex')->defaults('parent', 'price-lists')->defaults('child', 'price-list-items');
        Route::post('/{id}/items', 'nestedStore')->defaults('parent', 'price-lists')->defaults('child', 'price-list-items');
        Route::delete('/{id}/items/{itemId}', 'nestedDestroy')->defaults('parent', 'price-lists')->defaults('child', 'price-list-items');
    });
    Route::post('customers/{id}/price-lists', [CetaSpecController::class, 'nestedStore'])
        ->defaults('parent', 'customers')->defaults('child', 'price-lists');
    Route::get('customers/{id}/price-lists', [CetaSpecController::class, 'nestedIndex'])
        ->defaults('parent', 'customers')->defaults('child', 'price-lists');

    Route::post('prices/lookup', [CetaSpecController::class, 'priceLookup']);
    Route::post('shipping-fees/calculate', [ShippingFeeController::class, 'lookup']);
    // endregion

    // region Fleet (Đội xe)
    Route::apiResource('vehicles', VehicleController::class);
    Route::get('vehicles/available', [VehicleController::class, 'available']);
    Route::patch('vehicles/{vehicle}/status', [VehicleController::class, 'updateStatus']);
    // NOTE: Các route RPC như 'expiring-documents' nên được thay bằng filter trên resource chính.
    // Ví dụ: GET /vehicle-documents?status=expiring
    Route::get('vehicles/expiring-documents', [CetaSpecController::class, 'index'])->defaults('resource', 'vehicle-documents');
    Route::get('vehicles/maintenance-due', [CetaSpecController::class, 'index'])->defaults('resource', 'maintenance-schedules');

    Route::group(['defaults' => ['parent' => 'vehicles', 'child' => 'vehicle-documents']], function () {
        Route::apiResource('vehicles.documents', CetaSpecController::class)->shallow();
    });

    Route::apiResource('vehicle-assignments', VehicleAssignmentController::class);

    Route::group(['defaults' => ['parent' => 'vehicles', 'child' => 'maintenance-schedules']], function () {
        Route::apiResource('vehicles.maintenance-schedules', CetaSpecController::class)->shallow();
    });
    Route::group(['defaults' => ['parent' => 'vehicles', 'child' => 'maintenance-records']], function () {
        Route::apiResource('vehicles.maintenance-records', CetaSpecController::class)->shallow();
    });
    Route::patch('maintenance-records/{id}/complete', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'maintenance-records')->defaults('actionName', 'complete');
    // endregion

    // region Drivers (Tài xế)
    Route::group(['defaults' => ['resource' => 'drivers']], function () {
        Route::apiResource('drivers', CetaSpecController::class);
    });
    Route::get('drivers/available', [CetaSpecController::class, 'available'])->defaults('resource', 'drivers');
    Route::patch('drivers/{id}/status', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'drivers')->defaults('actionName', 'status');
    Route::get('drivers/expiring-documents', [CetaSpecController::class, 'index'])->defaults('resource', 'driver-documents');
    Route::group(['defaults' => ['parent' => 'drivers', 'child' => 'driver-documents']], function () {
        Route::apiResource('drivers.documents', CetaSpecController::class)->shallow();
    });
    Route::group(['defaults' => ['resource' => 'driver-teams']], function () {
        Route::apiResource('driver-teams', CetaSpecController::class)->except('show');
    });
    // endregion

    // region Schedules & Leave (Lịch làm việc & Nghỉ phép)
    // NOTE: Đổi tên 'work-schedules' thành 'driver-work-schedules' cho nhất quán.
    Route::group(['defaults' => ['resource' => 'work-schedules']], function () {
        Route::apiResource('driver-work-schedules', CetaSpecController::class)->except(['show', 'update']);
    });
    Route::post('driver-work-schedules/generate', [CetaSpecController::class, 'store'])->defaults('resource', 'work-schedules');
    Route::patch('driver-work-schedules/{id}/submit', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'work-schedules')->defaults('actionName', 'submit');
    Route::patch('driver-work-schedules/{id}/approve', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'work-schedules')->defaults('actionName', 'approve');
    Route::patch('driver-work-schedules/{id}/reject', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'work-schedules')->defaults('actionName', 'reject');

    Route::group(['defaults' => ['resource' => 'leave-requests']], function () {
        Route::apiResource('leave-requests', CetaSpecController::class);
    });
    Route::patch('leave-requests/{id}/approve', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'leave-requests')->defaults('actionName', 'approve');
    Route::patch('leave-requests/{id}/reject', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'leave-requests')->defaults('actionName', 'reject');
    Route::patch('leave-requests/{id}/cancel', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'leave-requests')->defaults('actionName', 'cancel');

    Route::group(['defaults' => ['resource' => 'leave-types']], function () {
        Route::apiResource('leave-types', CetaSpecController::class)->except('show');
    });
    Route::patch('leave-types/{id}/status', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'leave-types')->defaults('actionName', 'status');

    Route::group(['defaults' => ['resource' => 'overtime']], function () {
        Route::apiResource('overtime', CetaSpecController::class);
    });
    Route::patch('overtime/{id}/approve', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'overtime')->defaults('actionName', 'approve');
    Route::patch('overtime/{id}/reject', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'overtime')->defaults('actionName', 'reject');
    // endregion

    // region Trips & Costs (Chuyến xe & Chi phí)
    Route::group(['defaults' => ['resource' => 'transport-requests']], function () {
        Route::apiResource('transport-requests', CetaSpecController::class);
    });
    Route::group(['defaults' => ['resource' => 'trips']], function () {
        Route::apiResource('trips', CetaSpecController::class);
    });
    Route::prefix('trips/{id}')->controller(CetaSpecController::class)->group(function () {
        foreach (['assign', 'start', 'deliver', 'complete', 'cancel', 'change-vehicle', 'change-driver'] as $tripAction) {
            Route::patch("/{$tripAction}", 'action')->defaults('resource', 'trips')->defaults('actionName', $tripAction);
        }
    });

    Route::group(['defaults' => ['parent' => 'trips', 'child' => 'trip-stops']], function () {
        Route::apiResource('trips.stops', CetaSpecController::class)->shallow();
    });
    Route::patch('stops/{childId}/arrive', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'trip-stops')->defaults('actionName', 'arrive');
    Route::patch('stops/{childId}/complete', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'trip-stops')->defaults('actionName', 'complete');

    Route::group(['defaults' => ['parent' => 'trips', 'child' => 'trip-surcharges']], function () {
        Route::apiResource('trips.surcharges', CetaSpecController::class)->shallow();
    });
    Route::group(['defaults' => ['parent' => 'trips', 'child' => 'trip-documents']], function () {
        Route::apiResource('trips.documents', CetaSpecController::class)->shallow();
    });
    Route::group(['defaults' => ['parent' => 'trips', 'child' => 'trip-costs']], function () {
        Route::apiResource('trips.costs', CetaSpecController::class)->shallow();
    });
    Route::group(['defaults' => ['resource' => 'trip-costs']], function () {
        Route::apiResource('trip-costs', CetaSpecController::class);
    });

    Route::group(['defaults' => ['resource' => 'cost-approvals']], function () {
        Route::apiResource('cost-approvals', CetaSpecController::class)->only(['index', 'show']);
    });
    Route::patch('cost-approvals/{id}/approve', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'cost-approvals')->defaults('actionName', 'approve');
    Route::patch('cost-approvals/{id}/reject', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'cost-approvals')->defaults('actionName', 'reject');
    // endregion

    // region Accounting (Kế toán)
    Route::group(['defaults' => ['resource' => 'reconciliations']], function () {
        Route::apiResource('reconciliations', CetaSpecController::class);
    });
    Route::put('reconciliations/{id}/items/{itemId}', [CetaSpecController::class, 'nestedUpdate'])
        ->defaults('parent', 'reconciliations')->defaults('child', 'reconciliation-items');
    Route::patch('reconciliations/{id}/confirm', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'reconciliations')->defaults('actionName', 'confirm');
    Route::get('reconciliations/{id}/export', [CetaSpecController::class, 'show'])->defaults('resource', 'reconciliations');

    Route::group(['defaults' => ['parent' => 'customers', 'child' => 'payments']], function () {
        Route::apiResource('customers.payments', CetaSpecController::class)->shallow();
    });

    Route::group(['defaults' => ['resource' => 'invoices']], function () {
        Route::apiResource('invoices', CetaSpecController::class);
    });
    Route::prefix('invoices/{id}')->controller(CetaSpecController::class)->group(function () {
        Route::patch('/issue', 'action')->defaults('resource', 'invoices')->defaults('actionName', 'issue');
        Route::patch('/mark-paid', 'action')->defaults('resource', 'invoices')->defaults('actionName', 'mark-paid');
        Route::patch('/cancel', 'action')->defaults('resource', 'invoices')->defaults('actionName', 'cancel');
        Route::patch('/email', 'action')->defaults('resource', 'invoices')->defaults('actionName', 'email');
        Route::get('/status-histories', 'nestedIndex')->defaults('parent', 'invoices')->defaults('child', 'invoice-status-histories');
        Route::get('/cqt', 'show')->defaults('resource', 'invoices');
        Route::get('/pdf', 'show')->defaults('resource', 'invoices');
    });
    // endregion

    // region Notifications
    Route::prefix('notifications')->controller(CetaSpecController::class)->group(function () {
        Route::get('/', 'index')->defaults('resource', 'notifications');
        Route::get('/unread-count', 'report')->defaults('reportType', 'notifications-unread');
        Route::patch('/read-all', 'action')->defaults('resource', 'notifications')->defaults('id', 'all')->defaults('actionName', 'read');
        Route::patch('/{id}/read', 'action')->defaults('resource', 'notifications')->defaults('actionName', 'read');
        Route::delete('/{id}', 'destroy')->defaults('resource', 'notifications');
    });
    // endregion

    // region Reports & Dispatch
    Route::prefix('reports')->controller(CetaSpecController::class)->group(function () {
        foreach (['dashboard', 'revenue', 'costs', 'profit', 'trips', 'vehicles', 'drivers', 'debt', 'maintenance'] as $reportType) {
            Route::get("/{$reportType}", 'report')->defaults('reportType', $reportType);
        }
        Route::post('/export', 'report')->defaults('reportType', 'export');
        Route::get('/payroll/export', 'report')->defaults('reportType', 'payroll-export');
    });

    Route::prefix('dispatch')->controller(CetaSpecController::class)->group(function () {
        Route::get('/board', 'dispatch');
        Route::get('/unassigned-trips', 'dispatch');
        Route::get('/daily-summary', 'dispatch');
    });
    // endregion

    // region Legacy Workforce (tạm giữ, cần refactor)
    Route::group(['defaults' => ['resource' => 'offices']], function () {
        Route::apiResource('offices', CetaSpecController::class);
    });
    Route::group(['defaults' => ['resource' => 'departments']], function () {
        Route::apiResource('departments', CetaSpecController::class)->except('show');
    });
    Route::group(['defaults' => ['resource' => 'positions']], function () {
        Route::apiResource('positions', CetaSpecController::class)->except('show');
    });
    Route::group(['defaults' => ['resource' => 'employees']], function () {
        Route::apiResource('employees', CetaSpecController::class);
    });
    // endregion
});
