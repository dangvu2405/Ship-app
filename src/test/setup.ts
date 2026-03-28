import '@testing-library/jest-dom';

import { vi } from 'vitest';

// Mocks for React Router DOM since the form uses useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});
