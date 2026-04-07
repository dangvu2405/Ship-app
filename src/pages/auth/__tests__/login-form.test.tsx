import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LoginForm } from '../login-form';
import { useAuthStore } from '@/stores/auth.store';
import { BrowserRouter } from 'react-router-dom';

const mockApiGet = vi.fn();

vi.mock('@/services/api', () => ({
  default: {
    get: (...args: unknown[]) => mockApiGet(...args),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Mock auth store
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock translation hook
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('LoginForm Component', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup typical return value for useAuthStore
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      login: mockLogin,
    });
  });

  const renderComponent = () => render(
    <BrowserRouter>
      <LoginForm />
    </BrowserRouter>
  );

  it('renders email and password inputs correctly', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { success: true, data: [] } });

    renderComponent();

    expect(screen.getByLabelText('auth.email')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'auth.login' })).toBeInTheDocument();
  });

  it('fetches and dynamically renders test login role buttons from API', async () => {
    const mockAccounts = [
      { role: 'admin', role_display: 'Admin', email: 'admin@test.com' },
      { role: 'driver', role_display: 'Driver', email: 'driver@test.com' }
    ];

    mockApiGet.mockResolvedValueOnce({
      data: { success: true, data: mockAccounts }
    });

    renderComponent();

    expect(mockApiGet).toHaveBeenCalledWith('/auth/test-accounts');

    const adminButton = await screen.findByText('Admin');
    const driverButton = await screen.findByText('Driver');

    expect(adminButton).toBeInTheDocument();
    expect(driverButton).toBeInTheDocument();
  });

  it('calls login function automatically when a test account button is clicked', async () => {
    const mockAccounts = [
      { role: 'admin', role_display: 'Admin', email: 'admin@test.com' },
      { role: 'hr', role_display: 'HR', email: 'no-user-hr@test.com' }
    ];

    mockApiGet.mockResolvedValueOnce({
      data: { success: true, data: mockAccounts }
    });

    renderComponent();

    const adminButton = await screen.findByText('Admin');
    fireEvent.click(adminButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'password');
    });
  });

  it('disables test button if email starts with no-user', async () => {
    const mockAccounts = [
      { role: 'hr', role_display: 'HR', email: 'no-user-hr@test.com' }
    ];

    mockApiGet.mockResolvedValueOnce({
      data: { success: true, data: mockAccounts }
    });

    renderComponent();

    const hrButton = await screen.findByText('HR');
    const btnNode = hrButton.closest('button');
    expect(btnNode).toBeDisabled();
  });
});
