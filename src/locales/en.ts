export const en = {
  // Common
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    create: 'Create',
    update: 'Update',
    search: 'Search',
    reset: 'Reset',
    submit: 'Submit',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    loading: 'Loading...',
    noData: 'No data available',
    actions: 'Actions',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    enabled: 'Enabled',
    disabled: 'Disabled',
  },

  // Auth
  auth: {
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    loginSuccess: 'Login successful',
    loginFailed: 'Login failed',
    invalidCredentials: 'Invalid credentials',
    sessionExpired: 'Session expired. Please login again.',
    skipLogin: 'Skip Login (Demo)',
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome',
    overview: 'Overview',
    statistics: 'Statistics',
    recentActivity: 'Recent Activity',
  },

  // Companies
  companies: {
    title: 'Companies',
    name: 'Company Name',
    code: 'Code',
    taxCode: 'Tax Code',
    phone: 'Phone',
    address: 'Address',
    createCompany: 'Create Company',
    editCompany: 'Edit Company',
    deleteCompany: 'Delete Company',
    companyCreated: 'Company created successfully',
    companyUpdated: 'Company updated successfully',
    companyDeleted: 'Company deleted successfully',
    deleteConfirm: 'Are you sure you want to delete this company?',
  },

  // Employees
  employees: {
    title: 'Employees',
    name: 'Employee Name',
    code: 'Employee Code',
    email: 'Email',
    type: 'Type',
    driver: 'Driver',
    office: 'Office',
    createEmployee: 'Create Employee',
    editEmployee: 'Edit Employee',
    deleteEmployee: 'Delete Employee',
    employeeCreated: 'Employee created successfully',
    employeeUpdated: 'Employee updated successfully',
    employeeDeleted: 'Employee deleted successfully',
    deleteConfirm: 'Are you sure you want to delete this employee?',
  },

  // Vehicles
  vehicles: {
    title: 'Vehicles',
    licensePlate: 'License Plate',
    vehicleType: 'Vehicle Type',
    brand: 'Brand',
    model: 'Model',
    createVehicle: 'Create Vehicle',
    editVehicle: 'Edit Vehicle',
    deleteVehicle: 'Delete Vehicle',
  },

  // Trips
  trips: {
    title: 'Trips',
    tripCode: 'Trip Code',
    origin: 'Origin',
    destination: 'Destination',
    createTrip: 'Create Trip',
    editTrip: 'Edit Trip',
    deleteTrip: 'Delete Trip',
  },

  // Payrolls
  payrolls: {
    title: 'Payrolls',
    period: 'Period',
    employee: 'Employee',
    amount: 'Amount',
    createPayroll: 'Create Payroll',
    editPayroll: 'Edit Payroll',
    deletePayroll: 'Delete Payroll',
  },

  // Reports
  reports: {
    title: 'Reports',
    generate: 'Generate Report',
    export: 'Export',
    print: 'Print',
  },

  // Users
  users: {
    title: 'Users',
    username: 'Username',
    email: 'Email',
    role: 'Role',
    createUser: 'Create User',
    editUser: 'Edit User',
    deleteUser: 'Delete User',
  },

  // Header
  header: {
    profile: 'Profile',
    settings: 'Settings',
    notifications: 'Notifications',
    searchPlaceholder: 'Search...',
  },

  // Validation
  validation: {
    required: 'This field is required',
    email: 'Please enter a valid email',
    minLength: 'Minimum {min} characters',
    maxLength: 'Maximum {max} characters',
    min: 'Minimum value is {min}',
    max: 'Maximum value is {max}',
  },

  // Messages
  messages: {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    deleteSuccess: 'Deleted successfully',
    deleteError: 'Failed to delete',
    saveSuccess: 'Saved successfully',
    saveError: 'Failed to save',
    updateSuccess: 'Updated successfully',
    updateError: 'Failed to update',
    createSuccess: 'Created successfully',
    createError: 'Failed to create',
    networkError: 'Network error. Please check your connection.',
    serverError: 'Server error. Please try again later.',
    accessDenied: 'Access denied',
  },
};

export type TranslationKeys = typeof en;
