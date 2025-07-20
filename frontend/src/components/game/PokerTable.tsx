/** ----------------------------------
 * PokerTable Component
 * ---------------------------------- */
import React from "react";
import { Card } from "./Card";
import PlayerCard from "./PlayerCard";
import { CardSuit, CardRank } from "../types";

export type HoleCard = {
    suit: CardSuit;
    rank: CardRank;
};

export interface TablePlayerEx {
    id: number;
    name: string;
    chips: number;
    bet: number;
    blind?: "BB" | "SB";
    holeCards: HoleCard[];
    status: "active" | "folded" | "all-in";
    timer: number;
    timeLimit: number;
    role?: "dealer" | "sb" | "bb";
    lastAction?: string;
}

interface PokerTableProps {
    players: TablePlayerEx[];
    community: HoleCard[];
    currentId: number;
}

const PokerTable: React.FC<PokerTableProps> = ({ players, community, currentId }) => (
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

        {/* Top (0–2) */}
        <div className="absolute -top-40 left-0 w-full flex justify-between px-4">
            {players.slice(0, 3).map((p) => (
                <PlayerCard
                    key={p.id}
                    player={{
                        name: p.name,
                        avatarUrl: undefined,
                        blind: p.blind,
                        status: p.status,
                        isCurrent: p.id === currentId,
                        role: p.role,
                        lastAction: p.lastAction,
                        timer: p.timer,
                        timeLimit: p.timeLimit,
                        totalBet: p.bet,
                        roundBet: p.bet,
                        holeCards: p.holeCards,
                    }}
                    isMe={p.id === 0}
                />
            ))}
        </div>

        {/* Bottom (5–7) */}
        <div className="absolute -bottom-40 left-0 w-full flex justify-between px-4">
            {players.slice(5, 8).map((p) => (
                <PlayerCard
                    key={p.id}
                    player={{
                        name: p.name,
                        avatarUrl: undefined,
                        blind: p.blind,
                        status: p.status,
                        isCurrent: p.id === currentId,
                        role: p.role,
                        lastAction: p.lastAction,
                        timer: p.timer,
                        timeLimit: p.timeLimit,
                        totalBet: p.bet,
                        roundBet: p.bet,
                        holeCards: p.holeCards,
                    }}
                    isMe={p.id === 0}
                />
            ))}
        </div>

        {/* Left (8–9) */}
        <div className="absolute left-[-220px] top-0 h-full flex flex-col justify-between py-4">
            {players.slice(8).map((p) => (
                <PlayerCard
                    key={p.id}
                    player={{
                        name: p.name,
                        avatarUrl: undefined,
                        blind: p.blind,
                        status: p.status,
                        isCurrent: p.id === currentId,
                        role: p.role,
                        lastAction: p.lastAction,
                        timer: p.timer,
                        timeLimit: p.timeLimit,
                        totalBet: p.bet,
                        roundBet: p.bet,
                        holeCards: p.holeCards,
                    }}
                    isMe={p.id === 0}
                />
            ))}
        </div>

        {/* Right (3–4) */}
        <div className="absolute right-[-220px] top-0 h-full flex flex-col justify-between py-4">
            {players.slice(3, 5).map((p) => (
                <PlayerCard
                    key={p.id}
                    player={{
                        name: p.name,
                        avatarUrl: undefined,
                        blind: p.blind,
                        status: p.status,
                        isCurrent: p.id === currentId,
                        role: p.role,
                        lastAction: p.lastAction,
                        timer: p.timer,
                        timeLimit: p.timeLimit,
                        totalBet: p.bet,
                        roundBet: p.bet,
                        holeCards: p.holeCards,
                    }}
                    isMe={p.id === 0}
                />
            ))}
        </div>
    </div>
);

export default PokerTable;
