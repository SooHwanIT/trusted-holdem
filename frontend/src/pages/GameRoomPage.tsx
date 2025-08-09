// pages/GameRoomPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/Auth';

// ✅ 수정: 게임 관련 훅과 채팅 관련 훅을 모두 임포트합니다.
import { useGame } from '../hooks/useGame';
import { useChat } from '../hooks/useChat';

import PokerTable from '../components/game/PokerTable';
import PlayerController from '../components/game/PlayerController';
import GameRoomInfo from '../components/game/GameRoomInfo';
import ChatArea from '../components/game/ChatArea';

// 타입 정의는 각 훅 파일에서 가져옵니다.
import type { Snapshot, Message } from '../types/game';

export const GameRoomPage = () => {
    // URL 파라미터에서 방 ID를 가져옵니다.
    const { roomId = '' } = useParams();
    // 인증 컨텍스트에서 사용자 정보를 가져옵니다.
    const { user } = useAuth();
    const navigate = useNavigate();

    // ✅ useGame 훅을 사용하여 게임 상태를 관리합니다.
    const {
        gameSocket,
        snap,
        myId,
        roomError,
        sendPlayerAction
    } = useGame(roomId, user);

    // ✅ useChat 훅을 사용하여 채팅 상태를 관리합니다.
    const {
        chatSocket,
        messages,
        sendChatMessage
    } = useChat(roomId, user);

    // 게임방 메타 정보는 useState로 관리하여 필요시 동적으로 변경할 수 있도록 합니다.
    const [meta] = useState(() => ({
        name: `홀덤 방 (${roomId})`,
        maxPlayers: 8,
        smallBlind: 10,
        bigBlind: 20,
        ante: 0,
    }));

    // `roomError` 상태가 true가 되면 경고창을 띄우고 메인 로비로 이동합니다.
    useEffect(() => {
        if (roomError) {
            alert('요청한 방이 존재하지 않습니다. 메인 로비로 돌아갑니다.');
            navigate('/');
        }
    }, [roomError, navigate]);

    // --- 플레이어 컨트롤러를 위한 상태 계산 로직 ---
    // `snap` (게임 상태 스냅샷)이 업데이트될 때마다 자동으로 재계산됩니다.

    // 현재 턴인 플레이어, 콜 금액, 내 턴 여부 등을 계산하여 플레이어 컨트롤러에 필요한 데이터를 준비합니다.
    const currentTurnPlayer = snap.players.find(p => p.id === snap.currentId);
    const highestBetInRound = snap.players.reduce((max, p) => Math.max(max, p.currentRoundBet), 0);
    const callAmount = currentTurnPlayer ? highestBetInRound - currentTurnPlayer.currentRoundBet : 0;
    const isMyTurn = currentTurnPlayer && currentTurnPlayer.id === myId;
    const isShowdown = snap.phase === 'showdown';
    const minRaise = snap.players.length > 0 ? meta.bigBlind : 0;

    return (
        <div className="w-screen h-screen flex items-center justify-center relative bg-gray-900 text-white">

            <PokerTable
                players={snap.players}
                community={snap.community}
                currentId={snap.currentId}
                myPlayerId={myId} // ✅ 추가: 나의 ID를 전달하여 내 카드를 구분할 수 있도록 합니다.
            />

            {/* 현재 턴인 플레이어가 존재하고, 아직 쇼다운 단계가 아닐 때만 컨트롤러를 보여줍니다. */}
            {currentTurnPlayer && (
                <PlayerController
                    isCurrent={isMyTurn && !isShowdown}
                    chips={currentTurnPlayer.chips}
                    callAmount={callAmount}
                    minRaise={minRaise}
                    onFold={() => sendPlayerAction('fold')}
                    onCheck={() => sendPlayerAction('check')}
                    onCall={() => sendPlayerAction('call')}
                    onRaise={(amt: number) => sendPlayerAction('raise', amt)}
                />
            )}

            <GameRoomInfo
                roomId={roomId}
                roomName={meta.name}
                playerCount={snap.players.length}
                maxPlayers={meta.maxPlayers}
                smallBlind={meta.smallBlind}
                bigBlind={meta.bigBlind}
                ante={meta.ante || 0}
                potSize={snap.pot}
                dealerPosition={snap.dealerPos}
                handNumber={snap.handNumber}
                roundName={snap.phase}
                // TODO: 턴 타이머 기능이 구현되면 여기에 시간을 전달합니다.
                timeLeft={0}
            />

            <ChatArea
                socket={chatSocket}
                roomId={roomId}
                nickname={user?.nickname || 'Guest'}
                messages={messages}
                onSendMessage={sendChatMessage}
            />
        </div>
    );
};

export default GameRoomPage;
