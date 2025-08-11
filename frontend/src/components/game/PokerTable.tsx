import React from 'react';
import { Card } from './Card';
import PlayerCard from './PlayerCard';

interface PlayerData {
    id: string;
    name: string;
    chips: number;
    bet: number;
    currentRoundBet: number;
    status: 'active' | 'folded' | 'all-in' | 'busted';
    blind?: string;
    role?: 'dealer' | 'sb' | 'bb';
    hole: { suit: string; rank: string }[];
    timer?: number;
    timeLimit?: number;
}

interface PokerTableProps {
    players: PlayerData[];
    community: { suit: string; rank: string }[];
    currentId: string | null;
    myPlayerId: string;
}

const PokerTable: React.FC<PokerTableProps> = ({ players, community, currentId, myPlayerId }) => {
    // 플레이어 데이터를 각 위치에 맞게 전달
    const topPlayers = players.slice(0, 3);
    const rightPlayers = players.slice(3, 5);
    const bottomPlayers = players.slice(5, 8);
    const leftPlayers = players.slice(8);

    return (
        <div
            id="table"
            className="relative rounded-xl shadow-inner flex items-center justify-center bg-cover bg-center"
            style={{
                width: 800,
                height: 400,
                backgroundColor: '#15803d', // 이미지 로딩 실패 시 보여줄 기본 배경색 (Tailwind green-600)
                backgroundImage: "url('/images/poker-felt-texture.jpg')",
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.6)',
                border: '2px solid #556B2F', // 어두운 녹색 테두리 (선택 사항)
            }}
        >
            {/* 어두운 오버레이를 추가하여 카드 및 텍스트 가독성 확보 (선택 사항) */}
            {/* <div className="absolute inset-0 bg-black/20 rounded-xl"></div> */}

            {/* Community Cards */}
            <div className="relative z-10 flex space-x-4">
                {community.map((c, i) => (
                    <Card key={i} suit={c.suit} rank={c.rank} width={96} className="shadow-md" />
                ))}
            </div>

            {/* Top */}
            <div className="absolute top-[-160px] left-0 w-full flex justify-around z-10">
                {topPlayers.map((p) => (
                    <PlayerCard
                        key={p.id}
                        player={{
                            name: p.name,
                            avatarUrl: undefined,
                            blind: p.blind,
                            status: p.status,
                            isCurrent: p.id === currentId,
                            role: p.role,
                            lastAction: undefined,
                            timer: p.timer,
                            timeLimit: p.timeLimit,
                            bet: p.bet,
                            currentRoundBet: p.currentRoundBet,
                            hole: p.hole,
                        }}
                        isMe={p.id === myPlayerId}
                    />
                ))}
            </div>

            {/* Bottom */}
            <div className="absolute bottom-[-160px] left-0 w-full flex justify-around z-10">
                {bottomPlayers.map((p) => (
                    <PlayerCard
                        key={p.id}
                        player={{
                            name: p.name,
                            avatarUrl: undefined,
                            blind: p.blind,
                            status: p.status,
                            isCurrent: p.id === currentId,
                            role: p.role,
                            lastAction: undefined,
                            timer: p.timer,
                            timeLimit: p.timeLimit,
                            bet: p.bet,
                            currentRoundBet: p.currentRoundBet,
                            hole: p.hole,
                        }}
                        isMe={p.id === myPlayerId}
                    />
                ))}
            </div>

            {/* Left */}
            <div className="absolute left-[-220px] top-1/2 -translate-y-1/2 flex flex-col justify-around h-3/4 z-10">
                {leftPlayers.map((p) => (
                    <PlayerCard
                        key={p.id}
                        player={{
                            name: p.name,
                            avatarUrl: undefined,
                            blind: p.blind,
                            status: p.status,
                            isCurrent: p.id === currentId,
                            role: p.role,
                            lastAction: undefined,
                            timer: p.timer,
                            timeLimit: p.timeLimit,
                            bet: p.bet,
                            currentRoundBet: p.currentRoundBet,
                            hole: p.hole,
                        }}
                        isMe={p.id === myPlayerId}
                    />
                ))}
            </div>

            {/* Right */}
            <div className="absolute right-[-220px] top-1/2 -translate-y-1/2 flex flex-col justify-around h-3/4 z-10">
                {rightPlayers.map((p) => (
                    <PlayerCard
                        key={p.id}
                        player={{
                            name: p.name,
                            avatarUrl: undefined,
                            blind: p.blind,
                            status: p.status,
                            isCurrent: p.id === currentId,
                            role: p.role,
                            lastAction: undefined,
                            timer: p.timer,
                            timeLimit: p.timeLimit,
                            bet: p.bet,
                            currentRoundBet: p.currentRoundBet,
                            hole: p.hole,
                        }}
                        isMe={p.id === myPlayerId}
                    />
                ))}
            </div>
        </div>
    );
};

export default PokerTable;
