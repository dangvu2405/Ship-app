# ERP Admin Dashboard

A complete Admin Dashboard for ERP Mini System (HR + Fleet + Payroll) built with React, TypeScript, and Vite.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router v6** - Routing
- **Axios** - HTTP client
- **Recharts** - Charts
- **Zustand** - State management
- **Headless UI** - UI components
- **React Hot Toast** - Notifications

## Project Structure

```
src/
 ├── assets/              # Static assets
 ├── components/          # Reusable components
 │    ├── common/         # Common components (Breadcrumb, PageHeader, etc.)
 │    ├── form/           # Form components (Input, Select, Button)
 │    ├── table/          # Table components (DataTable, Pagination)
 │    └── modal/          # Modal components (ConfirmModal)
 ├── layouts/             # Layout components
 │    ├── AuthLayout.tsx
 │    └── AdminLayout.tsx
 ├── pages/               # Page components
 │    ├── auth/           # Authentication pages
 │    ├── dashboard/      # Dashboard page
 │    ├── hr/             # HR module pages
 │    ├── payroll/        # Payroll module pages
 │    └── ...
 ├── routes/              # Route configuration
 ├── services/            # API services
 ├── stores/              # Zustand stores
 ├── hooks/               # Custom hooks
 ├── utils/               # Utility functions
 └── types/               # TypeScript types
```

## Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Configure environment:**

Copy `.env.example` to `.env`. Đồng bộ với backend (`APP_URL` trong Laravel, không có `/api`):

```env
VITE_API_ORIGIN=http://localhost:8080
```

Dev mặc định gọi API qua `/api` (Vite proxy → `VITE_API_ORIGIN`). Chỉ cần `VITE_API_BASE_URL` nếu muốn URL đầy đủ tùy chỉnh.

3. **Run development server:**

```bash
npm run dev
```

4. **Build for production:**

```bash
npm run build
```

## Features

### Authentication
- JWT-based authentication
- HttpOnly cookie support
- Auto token refresh
- Protected routes
- Role-based access control

### Dashboard
- Statistics cards
- Revenue charts
- Trips charts
- Real-time data

### CRUD Operations
- Reusable DataTable component
- Pagination
- Search and filters
- Create/Edit/Delete operations
- Confirmation modals

### UI/UX
- Responsive design
- Dark/Light mode
- Toast notifications
- Loading states
- Error handling

## Routing

### Public Routes
- `/login` - Login page

### Protected Routes
- `/dashboard` - Dashboard
- `/admin/employees` - Employee management
- `/admin/payrolls` - Payroll management
- `/admin/vehicles` - Vehicle management
- `/admin/trips` - Trip management
- `/admin/reports` - Reports

## API Integration

The app connects to Laravel backend API:

- Dev: base `/api` + proxy tới `VITE_API_ORIGIN` (khớp `APP_URL` Laravel).
- Prod / override: `VITE_API_BASE_URL` hoặc `VITE_API_ORIGIN` + `/api` (xem `src/utils/constants.ts`).
- Authentication: HttpOnly cookies
- Error handling: Axios interceptors
- Auto refresh: Token refresh on 401

### Example API Calls

```typescript
import employeeService from '@/services/employee.service';

// Get all employees
const response = await employeeService.getAll({ page: 1, per_page: 10 });

// Create employee
const newEmployee = await employeeService.create({ name: 'John Doe', ... });

// Update employee
const updated = await employeeService.update(1, { name: 'Jane Doe' });

// Delete employee
await employeeService.delete(1);
```

## State Management

Using Zustand for state management:

### Auth Store
```typescript
import { useAuthStore } from '@/stores/auth.store';

const { user, isAuthenticated, login, logout } = useAuthStore();
```

### App Store
```typescript
import { useAppStore } from '@/stores/app.store';

const { theme, toggleTheme, sidebarOpen, toggleSidebar } = useAppStore();
```

## Components

### DataTable
Reusable table component with pagination:

```tsx
<DataTable
  data={employees}
  columns={columns}
  loading={loading}
  onRowClick={(item) => navigate(`/employees/${item.id}`)}
/>
```

### Form Components
```tsx
<Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
<Select label="Type" options={options} value={type} onChange={handleChange} />
<Button onClick={handleSubmit} loading={isLoading}>Submit</Button>
```

## Development

### Code Style
- TypeScript strict mode
- ESLint configured
- Prettier (optional)

### Testing
```bash
npm run test
```

### Linting
```bash
npm run lint
```

## Environment Variables

- `VITE_API_ORIGIN` — Origin backend (giống `APP_URL`, không `/api`); dùng cho Vite proxy và build.
- `VITE_API_BASE_URL` — URL đầy đủ tới `/api` (ghi đè mọi quy tắc, tuỳ chọn).
- `VITE_PROXY_TARGET` — Alias cũ của `VITE_API_ORIGIN`.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
