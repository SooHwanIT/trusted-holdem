import React, { useEffect, useRef } from "react";
import { User, Coins, Clock } from "lucide-react";
import { Card, CardBack } from "./Card";
import "./PlayerCard.css";

// Player 인터페이스를 실제 데이터 구조에 맞게 수정
interface Player {
    name: string;
    avatarUrl?: string;
    blind?: string;
    status: "active" | "folded" | "all-in" | "busted";
    isCurrent: boolean;
    role?: "dealer" | "sb" | "bb";
    lastAction?: string;
    timer?: number;
    timeLimit?: number;
    bet: number; // totalBet -> bet으로 변경
    currentRoundBet: number; // roundBet -> currentRoundBet으로 변경
    hole: { suit: string; rank: string }[]; // holeCards -> hole으로 변경
}

interface PlayerCardProps {
    player: Player;
    isMe: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, isMe }) => {
    const { timer, timeLimit, isCurrent } = player;
    const leftBarRef = useRef<HTMLDivElement>(null);
    const rightBarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isCurrent && typeof timeLimit === "number" && leftBarRef.current && rightBarRef.current) {
            leftBarRef.current.style.animation = 'none';
            rightBarRef.current.style.animation = 'none';
            void leftBarRef.current.offsetWidth;
            void rightBarRef.current.offsetWidth;

            const anim = `countdown ${timeLimit}s linear forwards`;
            leftBarRef.current.style.animation = anim;
            rightBarRef.current.style.animation = anim;
        }
        // player 객체 전체를 로깅하여 props가 올바르게 전달되는지 확인
    }, [isCurrent, timeLimit, player]); // player를 의존성 배열에 추가하여 데이터 변경 시 로깅

    return (
        <div
            className={`relative w-52 m-2 bg-gray-800 text-white rounded-lg shadow-lg p-3 flex flex-col transition-transform duration-200 ${
                isCurrent
                    ? "transform -translate-y-1 scale-105 shadow-2xl ring-2 ring-blue-500"
                    : ""
            } ${player.status === "folded" ? "opacity-50" : ""}`}
        >
            {/* 왼쪽 프로그래스 바 */}
            {isCurrent && typeof timer === "number" && typeof timeLimit === "number" && (
                <div className="absolute inset-y-0 -left-2 w-2 bg-gray-700 rounded-l-lg overflow-visible z-10">
                    <div
                        ref={leftBarRef}
                        className="absolute bottom-0 left-0 w-full bg-blue-500 rounded-l-lg"
                        style={{ height: "100%" }}
                    />
                </div>
            )}

            {/* 오른쪽 프로그래스 바 */}
            {isCurrent && typeof timer === "number" && typeof timeLimit === "number" && (
                <div className="absolute inset-y-0 -right-2 w-2 bg-gray-700 rounded-r-lg overflow-visible z-10">
                    <div
                        ref={rightBarRef}
                        className="absolute bottom-0 left-0 w-full bg-blue-500 rounded-r-lg"
                        style={{ height: "100%" }}
                    />
                </div>
            )}

            {/* Blind Badge */}
            {player.blind && (
                <span className="absolute top-1 right-1 px-1 py-0.5 text-[8px] font-bold rounded bg-yellow-400 text-gray-900">
                    {player.blind}
                </span>
            )}

            {/* Header */}
            <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                    {player.avatarUrl ? (
                        <img
                            src={player.avatarUrl}
                            alt={player.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <User className="w-5 h-5 text-gray-300" />
                    )}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-semibold truncate">{player.name}</span>
                    <div className="flex items-center space-x-1 text-[9px] mt-1">
                        <Coins className="w-3 h-3" />
                        <span>{player.bet}/{player.currentRoundBet}</span> {/* bet, currentRoundBet으로 수정 */}
                    </div>
                    {player.role && (
                        <span className="text-[8px] px-1 bg-gray-600 rounded mt-1">
                            {player.role === "dealer" ? "D" : player.role === "sb" ? "SB" : "BB"}
                        </span>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-col items-center mt-2">
                {player.lastAction && (
                    <div className="text-[9px] text-gray-300 mb-1 truncate">
                        {player.lastAction}
                    </div>
                )}
                <div className="flex space-x-1">
                    {isMe ? (
                        // 카드가 유효한지 확인하는 로직 추가
                        player.hole.filter(c => c).map((c, i) => ( // player.hole로 수정
                            <Card key={i} suit={c.suit} rank={c.rank} width={48} className="shadow" />
                        ))
                    ) : (
                        // 상대방 카드 (2장 뒷면)
                        [...Array(2)].map((_, i) => <CardBack key={i} width={48} className="shadow" />)
                    )}
                </div>
            </div>

            {/* Footer: 모든 현재 플레이어에게 타이머 표시 */}
            {isCurrent && typeof timer === "number" && (
                <div className="flex items-center space-x-1 mt-auto pt-2 border-t border-gray-700 text-[9px]">
                    <Clock className="w-3 h-3" />
                    <span>{timer}s</span>
                </div>
            )}

            {/* Status Badge */}
            <span
                className={`absolute bottom-1 right-1 text-[8px] px-1 rounded font-bold ${
                    player.status === "folded"
                        ? "bg-red-600"
                        : player.status === "all-in"
                            ? "bg-yellow-600"
                            : "bg-green-600"
                }`}
            >
                {player.status === "folded"
                    ? "Folded"
                    : player.status === "all-in"
                        ? "All-in"
                        : "Active"}
            </span>
        </div>
    );
};

export default PlayerCard;
