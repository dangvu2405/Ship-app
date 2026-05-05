import type {
  Allowance,
  Attendance,
  Company,
  Customer,
  Deduction,
  Department,
  Driver,
  Employee,
  Invoice,
  Office,
  Payroll,
  PayrollAdjustment,
  Position,
  Role,
  TripBonusRule,
  Trip,
  User,
  VehicleAssignment,
  VehicleExpense,
  Vehicle,
  CargoType,
  RouteTemplate,
  Location,
  VehicleTypeCatalog,
} from './entities';

export interface ApiResourceResponseByName {
  allowances: Allowance;
  attendances: Attendance;
  companies: Company;
  customers: Customer;
  deductions: Deduction;
  departments: Department;
  drivers: Driver;
  employees: Employee;
  invoices: Invoice;
  offices: Office;
  payrolls: Payroll;
  payroll_adjustments: PayrollAdjustment;
  positions: Position;
  roles: Role;
  trip_bonus_rules: TripBonusRule;
  trips: Trip;
  users: User;
  vehicle_assignments: VehicleAssignment;
  vehicle_expenses: VehicleExpense;
  vehicles: Vehicle;
  cargo_types: CargoType;
  route_templates: RouteTemplate;
  locations: Location;
  vehicle_types: VehicleTypeCatalog;
}

export type ApiCrudResourceName = keyof ApiResourceResponseByName;
