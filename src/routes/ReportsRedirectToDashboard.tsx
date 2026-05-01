import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/routes';

export function ReportsRedirectToDashboard(): JSX.Element {
  return <Navigate to={ROUTES.dashboard} replace />;
}
