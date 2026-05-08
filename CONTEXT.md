# Ship App — Domain Glossary

Core terms for the logistics/ERP domain. Use these names in code, comments, and architecture suggestions.

## Entities

**Trip** — A single freight delivery order. Has a lifecycle: `pending → assigned → en_route_pickup → in_transit → arrived → completed` (or `cancelled`). Belongs to a Customer, assigned to a Driver and Vehicle.

**Driver** — An employee who operates a Vehicle. Has a work schedule (DriverSchedule), leave requests, and a license with an expiry date.

**Vehicle** — A truck, van, or car owned/operated by an Office. Has a status (`active`, `maintenance`, `broken`, `inactive`), and a current odometer reading.

**Customer** — A company or individual who creates Trips. Has a payment record and a credit limit. May belong to a CustomerGroup.

**Office** — An operational unit within a Company. Drivers and Vehicles are assigned to Offices.

**Company** — The top-level tenant. Offices, Employees, and configuration belong to a Company.

**Invoice** — A billing document for one or more Trips. Has a `payment_status` and a due date.

**DriverSchedule** — A per-Driver, per-day work assignment. Goes through states: `draft → submitted → approved → locked`. Can be overridden.

**Leave** — A Driver's absence request attached to their schedule.

## Operational Concepts

**Dispatch Board** — Real-time view of Trip status grouped by vehicle/driver state columns: Running, Ready, Maintenance, Done. Used by dispatchers to assign unassigned Trips.

**Unassigned Trip** — A Trip in `pending` status with no Driver assigned. Appears in the Dispatch Board "pool."

**Trip Transition** — A valid status change for a Trip, governed by a workflow (`TRIP_TRANSITIONS`). Some transitions require a reason (cancel, delay, emergency).

**TripStatus** — Fine-grained 11-value enum used internally: `pending`, `assigned`, `driver_accepted`, `en_route_pickup`, `picked_up`, `in_transit`, `delayed`, `arrived`, `delivered`, `completed`, `cancelled`, `emergency`.

**ConventionOrderListBucket** — 6-value display grouping used in list views: `new`, `assigned`, `in_transit`, `delivered`, `completed`, `cancelled`. Maps from TripStatus for UI display.

## UI Patterns

**List Page** — A page showing a paginated, filterable table of one entity type. Always has: filter bar, record count, action column (view/edit/delete), delete confirmation dialog.

**Form Dialog** — A modal for creating or editing an entity. Three modes: `create`, `edit`, `show`. Guards against unsaved changes.

**Filter State** — Each List Page maintains paired "input" and "applied" states per filter field. Input is what the user is typing; applied is what the query uses (committed on Search button click).

**KPI Strip** — The row of 4 statistic cards at the top of the Dashboard showing today's metrics.

**Dispatch Board Column** — One of four kanban-style card columns (Running, Ready, Maintenance, Done) on the Dispatch Board.
