import type {
  Allowance,
  Attendance,
  Company,
  Customer,
  Deduction,
  Driver,
  Employee,
  Invoice,
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
  drivers: Driver;
  employees: Employee;
  invoices: Invoice;
  payrolls: Payroll;
  'payroll-adjustments': PayrollAdjustment;
  positions: Position;
  roles: Role;
  'trip-bonus-rules': TripBonusRule;
  trips: Trip;
  users: User;
  'vehicle-assignments': VehicleAssignment;
  'vehicle-expenses': VehicleExpense;
  vehicles: Vehicle;
  'cargo-types': CargoType;
  'route-templates': RouteTemplate;
  locations: Location;
  'vehicle-types': VehicleTypeCatalog;
}

export type ApiCrudResourceName = keyof ApiResourceResponseByName;
