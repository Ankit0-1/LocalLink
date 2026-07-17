import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { fetchMe, login as loginRequest } from './api';
import { clearToken, hasToken, setToken } from '../../lib/tokenStorage';
import type { LoginPayload, User } from './types';

interface AuthState {
  user: User | null;
  isInitializing: boolean;
}

type AuthAction = { type: 'AUTH_SUCCESS'; user: User } | { type: 'AUTH_CLEAR' };

const initialState: AuthState = {
  user: null,
  isInitializing: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_SUCCESS':
      return { user: action.user, isInitializing: false };
    case 'AUTH_CLEAR':
      return { user: null, isInitializing: false };
    default:
      return state;
  }
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    if (!hasToken()) {
      dispatch({ type: 'AUTH_CLEAR' });
      return;
    }

    fetchMe()
      .then(({ user }) => dispatch({ type: 'AUTH_SUCCESS', user }))
      .catch(() => {
        clearToken();
        dispatch({ type: 'AUTH_CLEAR' });
      });
  }, []);

  async function login(payload: LoginPayload): Promise<User> {
    const { user, accessToken } = await loginRequest(payload);
    setToken(accessToken);
    dispatch({ type: 'AUTH_SUCCESS', user });
    return user;
  }

  function logout(): void {
    clearToken();
    dispatch({ type: 'AUTH_CLEAR' });
  }

  const value: AuthContextValue = {
    user: state.user,
    isAuthenticated: state.user !== null,
    isInitializing: state.isInitializing,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
