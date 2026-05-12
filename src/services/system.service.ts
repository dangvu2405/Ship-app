import api from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';

class SystemService {
  async checkApiHealth(): Promise<boolean> {
    try {
      await api.get(ENDPOINTS.public.health, {
        skipErrorToast: true,
        errorMode: 'silent',
      });
      return true;
    } catch {
      return false;
    }
  }
}

const systemService = new SystemService();

export default systemService;
