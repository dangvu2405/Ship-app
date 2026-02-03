import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './routes';
import { useAuthStore } from './stores/auth.store';
import { useAppStore } from './stores/app.store';

function App() {
  const { checkAuth } = useAuthStore();
  const { theme } = useAppStore();

  useEffect(() => {
    checkAuth();
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [checkAuth, theme]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </>
  );
}

export default App;
