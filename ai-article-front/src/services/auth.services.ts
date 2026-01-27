// src/services/auth.service.ts
import axios from 'axios';
import { User } from '../types/User'; // ✅ 경로 확인: types/User (src/services 기준)
import { getApiBaseUrl } from '@/lib/api';

const API_URL = `${getApiBaseUrl()}/api/auth`; // 백엔드 API 기본 URL

class AuthService {
  async login(identifier: string, password: string): Promise<User> {
    try {
      const response = await axios.post(`${API_URL}/signin`, {
        // 🚨 이 부분이 'username'에서 'email'로 변경되었습니다!
        // 백엔드가 이메일 기반 로그인을 지원하도록 수정되었다는 가정 하에,
        // 여기에 'email' 필드를 보내야 합니다.
        email: identifier, // <-- 기존 'username: identifier'를 'email: identifier'로 변경
        password: password,
      });

      const userData: User = {
          userId: response.data.userId,
          username: response.data.username,
          email: response.data.email,
          token: response.data.token,
          roles: response.data.roles,
      };

      if (userData.token) {
        localStorage.setItem("user", JSON.stringify(userData));
      }

      return userData;
    } catch (error) {
      console.error("AuthService.login failed:", error);
      throw error;
    }
  }

  logout() {
    localStorage.removeItem("user");
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
        return null;
      }
    }
    return null;
  }
}

export default new AuthService();
