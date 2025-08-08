// hooks/useGame.ts

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import type { SnapPlayer, Snapshot } from '../types/game';

const SOCKET_URL = 'http://localhost:4000'; // 기본 서버 URL

export const useGame = (roomId: string, user: { _id: string; nickname: string } | null) => {
    const gameSocketRef = useRef<Socket | null>(null);

    // ✅ Snapshot 타입의 모든 필수 속성을 포함하는 유효한 초기값으로 수정했습니다.
    const [snap, setSnap] = useState<Snapshot>({
        phase: 'waiting',       // 게임의 초기 페이즈
        community: [],          // 초기 커뮤니티 카드 없음
        pot: 0,                 // 초기 팟 0
        dealerPos: -1,          // 초기 딜러 위치 없음
        handNumber: 0,          // 초기 핸드 번호 0
        currentId: '',          // 초기 현재 턴 플레이어 없음
        players: [],            // 초기 플레이어 목록 비어 있음
    });

    const [myId, setMyId] = useState<string>('');
    const [roomError, setRoomError] = useState<boolean>(false);

    useEffect(() => {
        if (!user || !roomId) return;
        
        const socket = io(SOCKET_URL + '/game'); 
        gameSocketRef.current = socket;

        socket.emit('joinRoom', { roomId, userId: user._id, nickname: user.nickname });

        socket.on('state', (s: Snapshot) => {
            console.log(`[Game Client] Received 'state' event. Game snapshot:`, s);
            setSnap(s);
            const myPlayer = s.players.find(p => p.id === user._id);
            if (myPlayer) {
                setMyId(myPlayer.id);
            }
        });

        socket.on('roomNotFound', () => {
            console.warn('[Game Client] Room not found.');
            setRoomError(true);
        });

        return () => {
            if (gameSocketRef.current) {
                console.log(`[Game Client] Disconnecting game socket for room ${roomId}`);
                gameSocketRef.current.disconnect();
            }
        };
    }, [roomId, user]);

    const sendPlayerAction = (type: 'fold' | 'call' | 'check' | 'raise', amount?: number) => {
        if (gameSocketRef.current) {
            gameSocketRef.current.emit('playerAction', {
                roomId,
                type,
                data: amount,
            });
        }
    };
    
    return {
        gameSocket: gameSocketRef.current,
        snap,
        myId,
        roomError,
        sendPlayerAction,
    };
};