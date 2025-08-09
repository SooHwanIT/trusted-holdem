// hooks/useGame.ts

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import type { SnapPlayer, Snapshot } from '../types/game';

const SOCKET_URL = 'http://localhost:4000'; // 기본 서버 URL

export const useGame = (roomId: string, user: { _id: string; nickname: string } | null) => {
    const gameSocketRef = useRef<Socket | null>(null);

    const [snap, setSnap] = useState<Snapshot>({
        phase: 'waiting',
        community: [],
        pot: 0,
        dealerPos: -1,
        handNumber: 0,
        currentId: '',
        players: [],
    });

    const [myId, setMyId] = useState<string>('');
    const [roomError, setRoomError] = useState<boolean>(false);

    useEffect(() => {
        if (!user || !roomId) {
            console.log(`[게임 클라이언트] useEffect 실행 건너뜀: 사용자 또는 방 ID 정보 없음.`);
            return;
        }

        console.log(`[게임 클라이언트] ${roomId} 방과 사용자 ${user.nickname}을 위한 소켓 초기화.`);
        const socket = io(SOCKET_URL + '/game');
        gameSocketRef.current = socket;

        // 1. 컴포넌트 마운트 시
        // 게임 서버에 'joinRoom' 이벤트를 보냅니다.
        socket.emit('joinRoom', { roomId, userId: user._id, nickname: user.nickname });
        console.log(`[게임 클라이언트] ${roomId} 방 참가를 위한 'joinRoom' 이벤트 전송.`);

        // 2. 서버로부터 'state' 이벤트 수신 시
        // 서버에서 최신 게임 상태를 받으면 setSnap과 setMyId를 통해 상태를 업데이트합니다.
        socket.on('state', (s: Snapshot) => {
            console.log(`[게임 클라이언트] 'state' 이벤트 수신. 게임 스냅샷:`, s);
            setSnap(s);
            console.log(`[게임 클라이언트] 상태 업데이트 완료. 새로운 단계: ${s.phase}, 핸드 번호: ${s.handNumber}`);

            const myPlayer = s.players.find(p => p.id === user._id);
            if (myPlayer) {
                setMyId(myPlayer.id);
                console.log(`[게임 클라이언트] 내 ID가 ${myPlayer.id}로 설정됨.`);
            }
        });

        // 3. 서버로부터 'roomNotFound' 이벤트 수신 시
        // 방이 없을 경우 에러 상태를 true로 설정합니다.
        socket.on('roomNotFound', () => {
            console.warn('[게임 클라이언트] "roomNotFound" 이벤트 수신. roomError를 true로 설정.');
            setRoomError(true);
        });

        // 4. 컴포넌트 언마운트 시
        // 클린업 함수가 실행되어 소켓 연결을 끊습니다.
        return () => {
            if (gameSocketRef.current) {
                console.log(`[게임 클라이언트] ${roomId} 방 게임 소켓 연결 해제.`);
                gameSocketRef.current.disconnect();
            }
        };
    }, [roomId, user]);

    // 5. 플레이어 액션 발송 시
    // 'playerAction' 이벤트를 서버에 보냅니다.
    const sendPlayerAction = (type: 'fold' | 'call' | 'check' | 'raise', amount?: number) => {
        if (gameSocketRef.current) {
            console.log(`[게임 클라이언트] 'playerAction' 이벤트 전송: { 타입: ${type}, 금액: ${amount || 'N/A'} }`);
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
