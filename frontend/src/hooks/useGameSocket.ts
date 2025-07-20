import { useEffect } from 'react';
import { webSocketService } from '../services/socket';
import { useGameStore } from '../stores/gameStore';

export const useGameSocket = (roomId: string, token: string) => {
    const setGameState = useGameStore((state) => state.setGameState);
    const socket = webSocketService.getSocket();

    useEffect(() => {
        if (!socket) return;

        // 백엔드로부터 게임 상태 업데이트 메시지를 구독
        socket.on('GAME_STATE_UPDATE', (payload) => {
            setGameState(payload);
        });

        // 게임방에 입장하는 메시지를 백엔드로 전송
        socket.emit('JOIN_ROOM', { roomId, token });

        return () => {
            // 컴포넌트 언마운트 시 소켓 리스너 정리
            socket.off('GAME_STATE_UPDATE');
        };
    }, [socket, setGameState, roomId, token]);

    const sendAction = (actionType: string, amount?: number) => {
        socket?.emit('PLAYER_ACTION', { actionType, amount });
    };

    return { sendAction };
};
