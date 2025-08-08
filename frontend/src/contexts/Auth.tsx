import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

// 👇️ mongoose 스키마에 맞춰 User 타입 정의를 업데이트했습니다.
type User = { 
    _id: string; // MongoDB의 _id
    email: string; 
    nickname: string; 
    wallet: string;
    chips: number; // 새로 추가
    createdAt: string; // timestamps의 일부
    updatedAt: string; // timestamps의 일부
};

const AuthCtx = createContext<{
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (t: string) => void;
    logout: () => void;
}>({ user: null, token: null, isLoading: true, login: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setTok] = useState<string | null>(() => localStorage.getItem('jwt'));
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const login = (t: string) => {
        localStorage.setItem('jwt', t);
        setTok(t);
    };
    const logout = () => {
        localStorage.removeItem('jwt');
        setTok(null);
        setUser(null);
        setIsLoading(false);
    };

    /* 토큰 바뀌면 axios 헤더 + 유저 프로필 불러오기 */
     useEffect(() => {
        if (token) {
            setIsLoading(true);
            axios.defaults.headers.common.Authorization = `Bearer ${token}`;
            axios.get('/api/user/me')
                .then((r) => {
                    setUser(r.data.user); 
                    setIsLoading(false);
                })
                .catch(logout);
        } else {
            delete axios.defaults.headers.common.Authorization;
            setIsLoading(false);
        }
    }, [token]);

    return <AuthCtx.Provider value={{ user, token, isLoading, login, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);