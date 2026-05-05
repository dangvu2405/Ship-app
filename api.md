<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CetaSpecController;
use App\Http\Controllers\Api\DebtOverviewController;
use App\Http\Controllers\Api\DispatchBoardController;
use App\Http\Controllers\Api\VehicleAssignmentController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\TripController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\Company\CompanyController as CompanyController;
use App\Http\Controllers\Api\LeaveController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Toàn bộ nghiệp vụ dùng một prefix `/api/...` (không mirror `/api/v1`).
|
*/

$healthResponse = static function () {
    return response()->json([
        'success' => true,
        'message' => 'API is running',
        'timestamp' => now()->toDateTimeString(),
    ]);
};

$registerPublicAuthRoutes = static function (): void {
    Route::prefix('auth')->group(function (): void {
        Route::post('/login', [AuthController::class, 'login'])
            ->middleware('throttle:5,1');
        Route::post('/social/login', [AuthController::class, 'socialLogin'])
            ->middleware('throttle:10,1');
        Route::post('/refresh-token', [AuthController::class, 'refreshByToken'])
            ->middleware('throttle:20,1');
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
            ->middleware('throttle:3,1');
        Route::post('/check-otp', [AuthController::class, 'checkOtp'])
            ->middleware('throttle:10,1');
        Route::post('/reset-password', [AuthController::class, 'resetPassword'])
            ->middleware('throttle:5,1');
    });
};

$registerAuthenticatedRoutes = static function (): void {
    Route::prefix('auth')->group(function (): void {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::get('/logs', [AuthController::class, 'logs']);
        Route::get('/actions', [AuthController::class, 'actions']);
        Route::get('/sessions', [AuthController::class, 'sessions']);
        Route::get('/sessions/summary', [AuthController::class, 'sessionsSummary']);
        Route::post('/sessions/{sessionId}/revoke', [AuthController::class, 'revokeSession']);
        Route::post('/sessions/{sessionId}/lock-account', [AuthController::class, 'lockAccountForSession']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::patch('/password', [AuthController::class, 'changePassword']);
    });

    Route::post('/upload', [\App\Http\Controllers\Api\UploadController::class, 'store']);
    Route::post('/upload/image', [\App\Http\Controllers\Api\UploadController::class, 'storeImage']);
    Route::post('/upload/document', [\App\Http\Controllers\Api\UploadController::class, 'storeDocument']);

    Route::prefix('chat')->group(function (): void {
        Route::get('/sessions', [\App\Http\Controllers\Api\ChatController::class, 'sessions']);
        Route::delete('/sessions/{sessionId}', [\App\Http\Controllers\Api\ChatController::class, 'destroySession']);
        Route::get('/messages', [\App\Http\Controllers\Api\ChatController::class, 'index']);
        Route::post('/messages', [\App\Http\Controllers\Api\ChatController::class, 'store']);
        Route::post('/messages/stream', [\App\Http\Controllers\Api\ChatController::class, 'stream']);
    });

};

$registerCetaRoutes = static function (): void {
    $crud = static function (string $uri, string $resource, bool $show = true): void {
        Route::get($uri, [CetaSpecController::class, 'index'])->defaults('resource', $resource);
        Route::post($uri, [CetaSpecController::class, 'store'])->defaults('resource', $resource);
        if ($show) {
            Route::get("{$uri}/{id}", [CetaSpecController::class, 'show'])->defaults('resource', $resource);
        }
        Route::put("{$uri}/{id}", [CetaSpecController::class, 'update'])->defaults('resource', $resource);
        Route::patch("{$uri}/{id}", [CetaSpecController::class, 'update'])->defaults('resource', $resource);
        Route::delete("{$uri}/{id}", [CetaSpecController::class, 'destroy'])->defaults('resource', $resource);
    };

    $nested = static function (string $parentUri, string $parent, string $childUri, string $child): void {
        Route::get("{$parentUri}/{id}/{$childUri}", [CetaSpecController::class, 'nestedIndex'])
            ->defaults('parent', $parent)->defaults('child', $child);
        Route::post("{$parentUri}/{id}/{$childUri}", [CetaSpecController::class, 'nestedStore'])
            ->defaults('parent', $parent)->defaults('child', $child);
        Route::put("{$parentUri}/{id}/{$childUri}/{childId}", [CetaSpecController::class, 'nestedUpdate'])
            ->defaults('parent', $parent)->defaults('child', $child);
        Route::patch("{$parentUri}/{id}/{$childUri}/{childId}", [CetaSpecController::class, 'nestedUpdate'])
            ->defaults('parent', $parent)->defaults('child', $child);
        Route::delete("{$parentUri}/{id}/{$childUri}/{childId}", [CetaSpecController::class, 'nestedDestroy'])
            ->defaults('parent', $parent)->defaults('child', $child);
    };

    $action = static function (string $method, string $uri, string $resource, string $actionName): void {
        $verb = strtolower($method);
        Route::{$verb}($uri, [CetaSpecController::class, 'action'])
            ->defaults('resource', $resource)
            ->defaults('actionName', $actionName);
    };

    // Users & permissions
    $crud('users', 'users');
    Route::get('users/{id}/permissions', [CetaSpecController::class, 'nestedIndex'])
        ->defaults('parent', 'users')->defaults('child', 'user-permissions');
    Route::put('users/{id}/permissions', [CetaSpecController::class, 'nestedStore'])
        ->defaults('parent', 'users')->defaults('child', 'user-permissions');
    $action('PATCH', 'users/{id}/status', 'users', 'status');
    $action('POST', 'users/{id}/reset-password', 'users', 'reset-password');

    // Catalog
    $action('PATCH', 'vehicle-types/reorder', 'vehicle-types', 'reorder');
    $crud('vehicle-types', 'vehicle-types', false);
    $crud('cargo-types', 'cargo-types', false);
    $crud('cost-categories', 'cost-categories', false);
    $crud('spare-parts', 'spare-parts', false);
    Route::get('locations/search', [CetaSpecController::class, 'index'])->defaults('resource', 'locations');
    $crud('locations', 'locations');
    $crud('route-templates', 'route-templates');
    Route::get('order-status-configs', [CetaSpecController::class, 'index'])->defaults('resource', 'order-status-configs');
    Route::put('order-status-configs', [CetaSpecController::class, 'store'])->defaults('resource', 'order-status-configs');

    // Customers and pricing

    Route::get('customers/{id}/trips', [CetaSpecController::class, 'nestedIndex'])
        ->defaults('parent', 'customers')->defaults('child', 'trips');
    Route::get('customers/{id}/debt', [CetaSpecController::class, 'debtOverview']);
    $crud('customer-groups', 'customer-groups', false);
    Route::get('customers/{id}/price-lists', [CetaSpecController::class, 'nestedIndex'])
        ->defaults('parent', 'customers')->defaults('child', 'price-lists');
    Route::post('customers/{id}/price-lists', [CetaSpecController::class, 'nestedStore'])
        ->defaults('parent', 'customers')->defaults('child', 'price-lists');
    Route::put('price-lists/{id}', [CetaSpecController::class, 'update'])->defaults('resource', 'price-lists');
    Route::delete('price-lists/{id}', [CetaSpecController::class, 'destroy'])->defaults('resource', 'price-lists');
    Route::get('price-lists/{id}/items', [CetaSpecController::class, 'nestedIndex'])
        ->defaults('parent', 'price-lists')->defaults('child', 'price-list-items');
    Route::post('price-lists/{id}/items', [CetaSpecController::class, 'nestedStore'])
        ->defaults('parent', 'price-lists')->defaults('child', 'price-list-items');
    Route::delete('price-lists/{id}/items/{itemId}', [CetaSpecController::class, 'nestedDestroy'])
        ->defaults('parent', 'price-lists')->defaults('child', 'price-list-items');
    Route::post('price-lookup', [CetaSpecController::class, 'priceLookup']);

    // Fleet

    $action('PATCH', 'vehicles/{id}/status', 'vehicles', 'status');
    $nested('vehicles', 'vehicles', 'documents', 'vehicle-documents');
    Route::get('vehicles/{id}/assignments', [CetaSpecController::class, 'nestedIndex'])
        ->defaults('parent', 'vehicles')->defaults('child', 'vehicle-assignments');
    Route::post('vehicles/{id}/assignments', [CetaSpecController::class, 'nestedStore'])
        ->defaults('parent', 'vehicles')->defaults('child', 'vehicle-assignments');
    Route::patch('vehicles/{id}/assignments/release', [CetaSpecController::class, 'releaseVehicleAssignment']);
    $nested('vehicles', 'vehicles', 'maintenance-schedules', 'maintenance-schedules');
    $nested('vehicles', 'vehicles', 'maintenance-records', 'maintenance-records');
    Route::put('maintenance-schedules/{id}', [CetaSpecController::class, 'update'])->defaults('resource', 'maintenance-schedules');
    $action('PATCH', 'maintenance-records/{id}/complete', 'maintenance-records', 'complete');

    // Vehicle assignments (top-level CRUD)
    Route::get('vehicle-assignments', [VehicleAssignmentController::class, 'index']);
    Route::post('vehicle-assignments', [VehicleAssignmentController::class, 'store']);
    Route::get('vehicle-assignments/{vehicle_assignment}', [VehicleAssignmentController::class, 'show']);
    Route::put('vehicle-assignments/{vehicle_assignment}', [VehicleAssignmentController::class, 'update']);
    Route::patch('vehicle-assignments/{vehicle_assignment}', [VehicleAssignmentController::class, 'update']);
    Route::delete('vehicle-assignments/{vehicle_assignment}', [VehicleAssignmentController::class, 'destroy']);

    // Drivers
    Route::get('drivers/available', [CetaSpecController::class, 'available'])->defaults('resource', 'drivers');
    Route::get('drivers/expiring-documents', [CetaSpecController::class, 'index'])->defaults('resource', 'driver-documents');
    $crud('drivers', 'drivers');
    $action('PATCH', 'drivers/{id}/status', 'drivers', 'status');
    $nested('drivers', 'drivers', 'documents', 'driver-documents');
    $crud('driver-teams', 'driver-teams', false);

    // Schedules and leave
    $crud('work-schedules', 'work-schedules', false);
    Route::post('work-schedules/generate', [CetaSpecController::class, 'store'])->defaults('resource', 'work-schedules');
    foreach (['submit', 'approve', 'reject'] as $scheduleAction) {
        $action('PATCH', "work-schedules/{id}/{$scheduleAction}", 'work-schedules', $scheduleAction);
    }

    foreach (['approve', 'reject', 'cancel'] as $leaveAction) {
        $action('PATCH', "leave-requests/{id}/{$leaveAction}", 'leave-requests', $leaveAction);
    }

    $action('PATCH', 'leave-types/{id}/status', 'leave-types', 'status');

    // Trips core
    $crud('transport-requests', 'transport-requests');

    foreach (['assign', 'start', 'deliver', 'complete', 'cancel', 'change-vehicle', 'change-driver'] as $tripAction) {
        $action('PATCH', "trips/{id}/{$tripAction}", 'trips', $tripAction);
    }
    $nested('trips', 'trips', 'stops', 'trip-stops');
    $action('PATCH', 'trips/{id}/stops/{childId}/arrive', 'trip-stops', 'arrive');
    $action('PATCH', 'trips/{id}/stops/{childId}/complete', 'trip-stops', 'complete');
    $nested('trips', 'trips', 'surcharges', 'trip-surcharges');
    $nested('trips', 'trips', 'documents', 'trip-documents');

    // Costs and approvals
    $nested('trips', 'trips', 'costs', 'trip-costs');
    Route::put('trip-costs/{id}', [CetaSpecController::class, 'update'])->defaults('resource', 'trip-costs');
    Route::delete('trip-costs/{id}', [CetaSpecController::class, 'destroy'])->defaults('resource', 'trip-costs');
    Route::get('cost-approvals', [CetaSpecController::class, 'index'])->defaults('resource', 'cost-approvals');
    Route::get('cost-approvals/{id}', [CetaSpecController::class, 'show'])->defaults('resource', 'cost-approvals');
    $action('PATCH', 'cost-approvals/{id}/approve', 'cost-approvals', 'approve');
    $action('PATCH', 'cost-approvals/{id}/reject', 'cost-approvals', 'reject');

    // Accounting
    $crud('reconciliations', 'reconciliations');
    Route::put('reconciliations/{id}/items/{itemId}', [CetaSpecController::class, 'nestedUpdate'])
        ->defaults('parent', 'reconciliations')->defaults('child', 'reconciliation-items');
    $action('PATCH', 'reconciliations/{id}/confirm', 'reconciliations', 'confirm');
    Route::get('reconciliations/{id}/export', [CetaSpecController::class, 'show'])->defaults('resource', 'reconciliations');
    Route::get('customers/{id}/payments', [CetaSpecController::class, 'nestedIndex'])
        ->defaults('parent', 'customers')->defaults('child', 'payments');
    Route::post('customers/{id}/payments', [CetaSpecController::class, 'nestedStore'])
        ->defaults('parent', 'customers')->defaults('child', 'payments');
    Route::delete('payments/{id}', [CetaSpecController::class, 'destroy'])->defaults('resource', 'payments');
    Route::get('debt-overview', [DebtOverviewController::class, 'index']);

    // Invoices

    $action('PATCH', 'invoices/{id}/issue', 'invoices', 'issue');
    $action('PATCH', 'invoices/{id}/mark-paid', 'invoices', 'mark-paid');
    $action('PATCH', 'invoices/{id}/cancel', 'invoices', 'cancel');
    Route::get('invoices/{id}/status-histories', [CetaSpecController::class, 'nestedIndex'])
        ->defaults('parent', 'invoices')->defaults('child', 'invoice-status-histories');

    // Notifications
    Route::get('notifications', [CetaSpecController::class, 'index'])->defaults('resource', 'notifications');
    Route::get('notifications/unread-count', [CetaSpecController::class, 'report'])->defaults('reportType', 'notifications-unread');
    $action('PATCH', 'notifications/{id}/read', 'notifications', 'read');
    Route::patch('notifications/read-all', [CetaSpecController::class, 'action'])
        ->defaults('resource', 'notifications')->defaults('id', 'all')->defaults('actionName', 'read');
    Route::delete('notifications/{id}', [CetaSpecController::class, 'destroy'])->defaults('resource', 'notifications');

    // Reports and dispatch
    foreach (['dashboard', 'revenue', 'costs', 'profit', 'trips', 'vehicles', 'drivers', 'debt', 'maintenance'] as $reportType) {
        Route::get("reports/{$reportType}", [CetaSpecController::class, 'report'])->defaults('reportType', $reportType);
    }
    Route::post('reports/export', [CetaSpecController::class, 'report'])->defaults('reportType', 'export');
    Route::get('dispatch/board', [DispatchBoardController::class, 'board']);
    Route::get('dispatch/unassigned-trips', [DispatchBoardController::class, 'unassignedTrips']);
    Route::get('dispatch/daily-summary', [DispatchBoardController::class, 'dailySummary']);

    // Upload
    Route::delete('upload', [CetaSpecController::class, 'uploadDelete']);
};

$mAuth = ['auth:sanctum', 'tenant.context', 'track.actions'];

Route::get('/', function () {
    return response()->json([
        'success' => true,
        'message' => 'Company Ship API',
        'version' => 'api',
        'preferred_base' => url('/api'),
    ]);
});
Route::get('/health', $healthResponse);

$registerPublicAuthRoutes();

Route::middleware($mAuth)->group($registerAuthenticatedRoutes);

// Prefer dedicated controllers for high-impact resources so audit and
// documentation match actual implementation. These explicit routes are
// registered before the generic CetaSpecController routes so they take precedence.
Route::middleware($mAuth)->group(function () {
    // Customers
    Route::get('customers/search', [CetaSpecController::class, 'index'])->defaults('resource', 'customers');
    Route::get('customers', [CustomerController::class, 'index']);
    Route::post('customers', [CustomerController::class, 'store']);
    Route::get('customers/{id}', [CustomerController::class, 'show']);
    Route::put('customers/{id}', [CustomerController::class, 'update']);
    Route::patch('customers/{id}', [CustomerController::class, 'update']);
    Route::delete('customers/{id}', [CustomerController::class, 'destroy']);

    // Vehicles
    Route::get('vehicles/available', [CetaSpecController::class, 'available'])->defaults('resource', 'vehicles');
    Route::get('vehicles/expiring-documents', [CetaSpecController::class, 'index'])->defaults('resource', 'vehicle-documents');
    Route::get('vehicles/maintenance-due', [CetaSpecController::class, 'index'])->defaults('resource', 'maintenance-schedules');
    Route::get('vehicles', [VehicleController::class, 'index']);
    Route::post('vehicles', [VehicleController::class, 'store']);
    Route::get('vehicles/{id}', [VehicleController::class, 'show']);
    Route::put('vehicles/{id}', [VehicleController::class, 'update']);
    Route::patch('vehicles/{id}', [VehicleController::class, 'update']);
    Route::delete('vehicles/{id}', [VehicleController::class, 'destroy']);

    // Trips (keep action routes handled by TripController)
    Route::get('trips', [TripController::class, 'index']);
    Route::post('trips', [TripController::class, 'store']);
    Route::get('trips/{id}', [TripController::class, 'show']);
    Route::put('trips/{id}', [TripController::class, 'update']);
    Route::patch('trips/{id}', [TripController::class, 'update']);
    Route::delete('trips/{id}', [TripController::class, 'destroy']);
    foreach (['assign', 'start', 'deliver', 'complete', 'cancel', 'change-vehicle', 'change-driver'] as $tripAction) {
        Route::patch("trips/{id}/{$tripAction}", [TripController::class, 'action']);
    }

    // Invoices
    Route::get('invoices', [InvoiceController::class, 'index']);
    Route::post('invoices', [InvoiceController::class, 'store']);
    Route::get('invoices/{id}', [InvoiceController::class, 'show']);
    Route::put('invoices/{id}', [InvoiceController::class, 'update']);
    Route::patch('invoices/{id}', [InvoiceController::class, 'update']);
    Route::delete('invoices/{id}', [InvoiceController::class, 'destroy']);

    // Companies
    Route::get('companies', [CompanyController::class, 'index']);
    Route::post('companies', [CompanyController::class, 'store']);
    Route::get('companies/{id}', [CompanyController::class, 'show']);
    Route::put('companies/{id}', [CompanyController::class, 'update']);
    Route::patch('companies/{id}', [CompanyController::class, 'update']);
    Route::delete('companies/{id}', [CompanyController::class, 'destroy']);

    // Leaves
    Route::get('leave-requests', [LeaveController::class, 'index']);
    Route::post('leave-requests', [LeaveController::class, 'store']);
    Route::get('leave-requests/{id}', [LeaveController::class, 'show']);
    Route::patch('leave-requests/{id}/approve', [LeaveController::class, 'approve']);
    Route::patch('leave-requests/{id}/reject', [LeaveController::class, 'reject']);
    Route::patch('leave-requests/{id}/cancel', [LeaveController::class, 'cancel']);
    Route::get('leave-types', [LeaveController::class, 'types']);
});

Route::middleware($mAuth)->group($registerCetaRoutes);
