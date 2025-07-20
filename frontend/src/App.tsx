import { Routes, Route } from 'react-router-dom';
import { LoginPage }   from './pages/LoginPage';
import { SignUpPage }  from './pages/SignUpPage';
import { MyPage }      from './pages/MyPage';
import { LobbyPage }   from './pages/LobbyPage';
import { GameRoomPage } from './pages/GameRoomPage';
import { HomePage }    from './pages/HomePage';

export default function App() {
    return (
        <Routes>
            <Route path="/"             element={<HomePage />} />
            <Route path="/lobby"           element={<LobbyPage />} />
            <Route path="/login"      element={<LoginPage />} />
            <Route path="/signup"     element={<SignUpPage />} />
            <Route path="/mypage"     element={<MyPage />} />
            <Route path="/game/:roomId" element={<GameRoomPage />} />
        </Routes>
    );
}
