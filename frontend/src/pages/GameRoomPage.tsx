import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // 실제 프로젝트의 라우터 라이브러리
import { useAuth } from '../contexts/Auth'; // 실제 프로젝트의 인증 훅
import { useGame } from '../hooks/useGame'; // 실제 프로젝트의 게임 로직 훅
import { useChat } from '../hooks/useChat'; // 실제 프로젝트의 채팅 로직 훅

import PokerTable from '../components/game/PokerTable';
import UIPanel from '../components/common/UIPanel'; // 새로 만든 UI 패널 컴포넌트
import GameRoomInfo from '../components/game/GameRoomInfo';
import PlayerController from '../components/game/PlayerController';
import ChatArea from '../components/game/ChatArea';

const GameRoomPage: React.FC = () => {
    const { roomId = '' } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const { snap, myId, roomError, sendPlayerAction } = useGame(roomId, user);
    const { messages, sendChatMessage } = useChat(roomId, user);

    const [meta] = useState(() => ({
        name: `홀덤 방 (${roomId})`,
        maxPlayers: 8,
        smallBlind: 10,
        bigBlind: 20,
        ante: 0,
    }));

    useEffect(() => {
        if (roomError) {
            alert('요청한 방이 존재하지 않습니다. 메인 로비로 돌아갑니다.');
            navigate('/');
        }
    }, [roomError, navigate]);

    const currentTurnPlayer = snap.players.find(p => p.id === snap.currentId);
    const highestBetInRound = snap.players.reduce((max, p) => Math.max(max, p.currentRoundBet), 0);
    const callAmount = currentTurnPlayer ? highestBetInRound - currentTurnPlayer.currentRoundBet : 0;
    const isMyTurn = currentTurnPlayer?.id === myId;
    const isShowdown = snap.phase === 'showdown';
    const minRaise = snap.players.length > 0 ? meta.bigBlind : 0;

    return (
        <div
            className="relative flex h-screen w-screen items-center justify-center overflow-hidden text-white"
            style={{
                backgroundColor: '#111827',
                backgroundImage: `
                    radial-gradient(circle at center, rgba(255, 255, 255, 0.03) 0, rgba(255, 255, 255, 0) 60%),
                    repeating-linear-gradient(45deg, #1a2233 0, #1a2233 1px, transparent 1px, transparent 12px),
                    repeating-linear-gradient(-45deg, #1a2233 0, #1a2233 1px, transparent 1px, transparent 12px)
                `,
            }}
        >
            <PokerTable
                players={snap.players}
                community={snap.community}
                currentId={snap.currentId}
                myPlayerId={myId}
            />

            {/* 게임 정보 패널 (우측 상단) */}
            <UIPanel className="absolute top-4 right-4 w-80">
                <GameRoomInfo
                    roomId={roomId}
                    roomName={meta.name}
                    playerCount={snap.players.length}
                    maxPlayers={meta.maxPlayers}
                    smallBlind={meta.smallBlind}
                    bigBlind={meta.bigBlind}
                    ante={meta.ante}
                    potSize={snap.pot}
                    dealerPosition={snap.dealerPos}
                    handNumber={snap.handNumber}
                    roundName={snap.phase}
                    timeLeft={0}
                />
            </UIPanel>

            {/* 채팅 패널 (좌측 하단) */}
            <UIPanel className="absolute bottom-4 left-4 w-80 h-[45%]">
                <ChatArea
                    messages={messages}
                    nickname={user?.nickname || 'Guest'}
                    onSendMessage={sendChatMessage}
                />
            </UIPanel>

            {/* 플레이어 컨트롤러 패널 (우측 하단) */}
            <UIPanel className="absolute bottom-4 right-4 w-80">
                <PlayerController
                    isMyTurn={isMyTurn && !isShowdown}
                    chips={currentTurnPlayer?.chips ?? 0}
                    callAmount={callAmount}
                    minRaise={minRaise}
                    onFold={() => sendPlayerAction('fold')}
                    onCheck={() => sendPlayerAction('check')}
                    onCall={() => sendPlayerAction('call')}
                    onRaise={(amt) => sendPlayerAction('raise', amt)}
                />
            </UIPanel>
        </div>
    );
};

export default GameRoomPage;
