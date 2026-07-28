export type AuthUser = {
  id: string;
  email: string;
  role: string;
  fullName?: string;
};

const TOKEN_KEY = "eventbox_admin_token";
const REFRESH_TOKEN_KEY = "eventbox_admin_refresh_token";
const USER_KEY = "eventbox_admin_user";
const LEGACY_TOKEN_KEY = "aquzera_token";
const LEGACY_USER_KEY = "aquzera_user";

export const authStore = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY);
  },
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY) ?? localStorage.getItem(LEGACY_USER_KEY);
    return raw ? JSON.parse(raw) as AuthUser : null;
  },
  getRole() {
    return this.getUser()?.role ?? null;
  },
  setSession(token: string, user: AuthUser, refreshToken?: string | null) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
  }
};
