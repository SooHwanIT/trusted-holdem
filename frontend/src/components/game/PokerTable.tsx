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
            className="relative bg-green-700 rounded-lg shadow-inner flex items-center justify-center"
            style={{ width: 800, height: 400 }}
        >
            {/* Community Cards */}
            <div className="flex space-x-2">
                {community.map((c, i) => (
                    <Card key={i} suit={c.suit} rank={c.rank} width={96} className="shadow-lg" />
                ))}
            </div>

            {/* Top */}
            <div className="absolute top-[-160px] left-0 w-full flex justify-around">
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
                            // PlayerCard 인터페이스에 맞게 속성 이름 변경
                            bet: p.bet,
                            currentRoundBet: p.currentRoundBet,
                            hole: p.hole,
                        }}
                        isMe={p.id === myPlayerId}
                    />
                ))}
            </div>

            {/* Bottom */}
            <div className="absolute bottom-[-160px] left-0 w-full flex justify-around">
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
                            // PlayerCard 인터페이스에 맞게 속성 이름 변경
                            bet: p.bet,
                            currentRoundBet: p.currentRoundBet,
                            hole: p.hole,
                        }}
                        isMe={p.id === myPlayerId}
                    />
                ))}
            </div>

            {/* Left */}
            <div className="absolute left-[-220px] top-1/2 -translate-y-1/2 flex flex-col justify-around h-3/4">
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
                            // PlayerCard 인터페이스에 맞게 속성 이름 변경
                            bet: p.bet,
                            currentRoundBet: p.currentRoundBet,
                            hole: p.hole,
                        }}
                        isMe={p.id === myPlayerId}
                    />
                ))}
            </div>

            {/* Right */}
            <div className="absolute right-[-220px] top-1/2 -translate-y-1/2 flex flex-col justify-around h-3/4">
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
                            // PlayerCard 인터페이스에 맞게 속성 이름 변경
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
