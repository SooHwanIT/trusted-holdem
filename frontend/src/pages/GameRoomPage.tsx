// pages/GameRoomPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/Auth';

// ✅ 수정: 두 개의 훅을 임포트합니다.
import { useGame } from '../hooks/useGame'; 
import { useChat } from '../hooks/useChat'; 

import PokerTable from '../components/game/PokerTable';
import PlayerController from '../components/game/PlayerController';
import GameRoomInfo from '../components/game/GameRoomInfo';
import ChatArea from '../components/game/ChatArea'; // 채팅 컴포넌트는 남겨둡니다.

// 타입 정의는 이제 각 훅 파일에서 가져오거나 필요시 여기에 선언.
import type { Snapshot, Message } from '../types/game';

export const GameRoomPage = () => {
    const { roomId = '' } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    // ✅ useGame 훅 사용 (주석 처리)
    const { 
        gameSocket, 
        snap, 
        myId, 
        roomError, 
        sendPlayerAction 
    } = useGame(roomId, user); // 게임 관련 훅 호출은 유지하되, 반환값은 사용하지 않음

    // ✅ useChat 훅 사용 (채팅 관련 훅이므로 남겨둡니다.)
    const { 
        chatSocket, 
        messages, 
        sendChatMessage 
    } = useChat(roomId, user);

    // 게임 메타 정보는 채팅과 직접적인 관련이 없어 주석 처리
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
    }, [ roomError, navigate ]); 
    
    const curIdx = snap.players.findIndex((p) => p.id === snap.currentId);
    const current = curIdx !== -1 ? snap.players[curIdx] : null;
    const highestBet = snap.players.reduce((max, p) => Math.max(max, p.bet), 0);
    const callAmount = current ? highestBet - current.bet : 0;
    const isMyTurn = current && current.id === myId;
    const isShowdown = snap.phase === 'showdown';
    
    return (
        <div className="w-screen h-screen flex items-center justify-center relative">
        
            <PokerTable
                players={snap.players}
                community={snap.community}
                currentId={snap.currentId}
            /> 

            {current &&
                <PlayerController
                    isCurrent={isMyTurn && !isShowdown}
                    chips={current.chips}
                    callAmount={callAmount}
                    minRaise={0}
                    onFold={() => sendPlayerAction('fold')}
                    onCheck={() => sendPlayerAction('check')}
                    onCall={() => sendPlayerAction('call')}
                    onRaise={(amt: number) => sendPlayerAction('raise', amt)}
                />
            } 

           
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
                timeLeft={0}
            /> 
            
            {/* ✅ 채팅 관련 컴포넌트는 그대로 남겨둡니다. */}
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