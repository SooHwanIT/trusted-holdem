/* --------------------------------------------------
 * pages/GameRoomPage.tsx
 * -------------------------------------------------- */
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

import PokerTable from '../components/game/PokerTable';
import PlayerController from '../components/game/PlayerController';
import GameRoomInfo from '../components/game/GameRoomInfo';

/* ---------- 타입 (스냅샷) ---------- */
type SnapPlayer = {
    id: string;
    name: string;
    chips: number;
    bet: number;
    status: 'active' | 'folded' | 'all-in';
    timer: number;
    blind?: 'SB' | 'BB';
    hole: (string | null)[];
};

type Snapshot = {
    phase: string;            // preflop | flop | ...
    community: { suit: string; rank: string }[];
    pot: number;
    dealerPos: number;
    hand: number;
    currentId: string;        // 소켓 ID
    players: SnapPlayer[];
};

export const GameRoomPage = () => {
    const { roomId = '' } = useParams();           // /game/:roomId
    const socketRef = useRef<Socket>();
    const [meta, setMeta] = useState<any>(null);   // REST 방 정보
    const [snap, setSnap] = useState<Snapshot>();  // 실시간 스냅샷
    const [myId, setMyId] = useState<string>('');  // 내 소켓 ID

    /* ---------- 1) REST : 방 메타 ---------- */
    useEffect(() => {
        axios
            .get(`http://localhost:4000/api/rooms/${roomId}`)
            .then((r) => setMeta(r.data))
            .catch(() => alert('방을 찾을 수 없습니다.'));
    }, [roomId]);

    /* ---------- 2) WebSocket 연결 ---------- */
    useEffect(() => {
        if (!roomId) return;
        const socket = io('http://localhost:4000');
        socketRef.current = socket;

        socket.emit('join', { roomId, name: 'Me' });

        socket.on('joined', (p) => setMyId(p.id));
        socket.on('state', (s: Snapshot) => setSnap(s));
        socket.on('handFinished', (data) => console.log('Hand finished', data));

        return () => socket.disconnect();
    }, [roomId]);

    /* ---------- 3) 보호용 로딩 ---------- */
    if (!meta || !snap || !snap.players?.length) {
        return <div className="text-white p-10">Loading…</div>;
    }

    /* ---------- 4) 현재 플레이어 계산 ---------- */
    const curIdx = snap.players.findIndex((p) => p.id === snap.currentId);
    if (curIdx === -1) {
        return (
            <div className="text-red-500 p-10">
                잘못된 상태: currentId 미일치
            </div>
        );
    }

    const players = snap.players;
    const current = players[curIdx];
    const highestBet = Math.max(...players.map((p) => p.bet));
    const callAmount = highestBet - current.bet;
    const minRaise = callAmount + Number(meta.bigBlind || 100);
    const isMyTurn = current.id === myId;

    /* ---------- 5) 액션 전송 ---------- */
    const send = (payload: any) =>
        socketRef.current?.emit('action', { roomId, ...payload });

    /* ---------- 6) 렌더 ---------- */
    return (
        <div className="w-screen h-screen flex items-center justify-center relative">
            <PokerTable
                players={players}
                community={snap.community}
                currentId={snap.currentId}
            />

            <PlayerController
                isCurrent={isMyTurn}
                chips={current.chips}
                callAmount={callAmount}
                minRaise={minRaise}
                onFold={() => send({ type: 'fold' })}
                onCheck={() => send({ type: 'check' })}
                onCall={() => send({ type: 'call' })}
                onRaise={(amt: number) => send({ type: 'raise', amount: amt })}
            />

            <GameRoomInfo
                roomId={roomId}
                roomName={meta.name}
                playerCount={players.filter((p) => p.status === 'active').length}
                maxPlayers={meta.maxPlayers}
                smallBlind={meta.smallBlind}
                bigBlind={meta.bigBlind}
                ante={meta.ante || 0}
                potSize={snap.pot}
                dealerPosition={snap.dealerPos}
                handNumber={snap.hand}
                roundName={snap.phase}
                timeLeft={current.timer}
            />
        </div>
    );
};

export default GameRoomPage;
