import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

type User = { email: string; nickname: string; wallet: string };

const AuthCtx = createContext<{
    user: User | null;
    token: string | null;
    login: (t: string) => void;
    logout: () => void;
}>({ user: null, token: null, login: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setTok] = useState<string | null>(() => localStorage.getItem('jwt'));
    const [user, setUser] = useState<User | null>(null);

    const login = (t: string) => {
        localStorage.setItem('jwt', t);
        setTok(t);
    };
    const logout = () => {
        localStorage.removeItem('jwt');
        setTok(null);
        setUser(null);
    };

    /* 토큰 바뀌면 axios 헤더 + 유저 프로필 불러오기 */
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common.Authorization = `Bearer ${token}`;
            axios.get('/api/user/me').then((r) => setUser(r.data)).catch(logout);
        } else {
            delete axios.defaults.headers.common.Authorization;
        }
    }, [token]);

    return <AuthCtx.Provider value={{ user, token, login, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
