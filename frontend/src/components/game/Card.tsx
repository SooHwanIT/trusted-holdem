/** ----------------------------------
 * Card Component (with min font-size & min width)
 * ---------------------------------- */
import React from "react";
import { CardSuit, CardRank } from "../../types";

// 타입 별칭
type Suit = CardSuit;
type Rank = CardRank;

// 모양별 심볼 & 색상 매핑
const suitChar: Record<Suit, string> = {
    [CardSuit.Hearts]: "♥",
    [CardSuit.Diamonds]: "♦",
    [CardSuit.Clubs]: "♣",
    [CardSuit.Spades]: "♠",
};

const suitColor: Record<Suit, string> = {
    [CardSuit.Hearts]: "#e63946",
    [CardSuit.Diamonds]: "#e63946",
    [CardSuit.Clubs]: "#1d1d1d",
    [CardSuit.Spades]: "#1d1d1d",
};

// 숫자별 pip 레이아웃 (0~1 좌표계)
const pipLayouts: Record<number, [number, number][]> = {
    1: [[0.5, 0.5]],
    2: [[0.5, 0.22], [0.5, 0.78]],
    3: [[0.5, 0.22], [0.5, 0.5], [0.5, 0.78]],
    4: [[0.25, 0.22], [0.75, 0.22], [0.25, 0.78], [0.75, 0.78]],
    5: [[0.25, 0.22], [0.75, 0.22], [0.5, 0.5], [0.25, 0.78], [0.75, 0.78]],
    6: [[0.25, 0.22], [0.75, 0.22], [0.25, 0.5], [0.75, 0.5], [0.25, 0.78], [0.75, 0.78]],
    7: [[0.25, 0.22], [0.75, 0.22], [0.25, 0.5], [0.75, 0.5], [0.5, 0.35], [0.25, 0.78], [0.75, 0.78]],
    8: [[0.25, 0.22], [0.75, 0.22], [0.25, 0.35], [0.75, 0.35], [0.25, 0.65], [0.75, 0.65], [0.25, 0.78], [0.75, 0.78]],
    9: [[0.25, 0.22], [0.75, 0.22], [0.25, 0.35], [0.75, 0.35], [0.5, 0.5], [0.25, 0.65], [0.75, 0.65], [0.25, 0.78], [0.75, 0.78]],
    10: [[0.25, 0.22], [0.75, 0.22], [0.25, 0.35], [0.75, 0.35], [0.25, 0.5], [0.75, 0.5], [0.25, 0.65], [0.75, 0.65], [0.25, 0.78], [0.75, 0.78]],
};

const SVG_BASE_W = 120; // viewBox 고정 크기
const SVG_BASE_H = 180;
const COMPRESSION = 0.8;
const compress = (pos: number) => 0.5 + (pos - 0.5) * COMPRESSION;

// 최소폭 및 폰트 크기
const MIN_WIDTH = 64;
const MIN_CORNER = 8;
const MAX_CORNER = 14;
const MIN_PIP = 12;
const MAX_PIP = 24;
const MIN_FACE = 32;
const MAX_FACE = 48;

interface CardProps {
    suit: Suit;
    rank: Rank;
    width?: number;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ suit, rank, width = 64, className = "" }) => {
    const w = Math.max(width, MIN_WIDTH);
    const scale = w / SVG_BASE_W;
    const h = (SVG_BASE_H / SVG_BASE_W) * w;

    // clamp 폰트 크기
    const CORNER_FONT = Math.min(Math.max(16 * scale, MIN_CORNER), MAX_CORNER);
    const PIP_FONT = Math.min(Math.max(26 * scale, MIN_PIP), MAX_PIP);
    const FACE_FONT = Math.min(Math.max(64 * scale, MIN_FACE), MAX_FACE);

    const color = suitColor[suit];
    const sChar = suitChar[suit];
    const rankLabel = rank === CardRank.Ten ? "10" : rank;

    const Corner = () => (
        <g>
            <text x={10 * scale} y={20 * scale} fontSize={CORNER_FONT} fontWeight="bold" fill={color}>
                {rankLabel}
            </text>
            <text x={10 * scale} y={38 * scale} fontSize={CORNER_FONT} fill={color}>
                {sChar}
            </text>
        </g>
    );

    const RotatedCorner = () => (
        <g transform={`rotate(180 ${SVG_BASE_W / 2} ${SVG_BASE_H / 2})`}>
            <Corner />
        </g>
    );

    const CenterGraphics = () => {
        // 페이스 카드는 별도로 처리
        if ([CardRank.Jack, CardRank.Queen, CardRank.King].includes(rank)) {
            return (
                <text
                    x={SVG_BASE_W / 2}
                    y={SVG_BASE_H / 2 + FACE_FONT / 3}
                    fontSize={FACE_FONT}
                    fontWeight="bold"
                    textAnchor="middle"
                    fill={color}
                >
                    {rankLabel}
                </text>
            );
        }

        // 숫자 카드의 pipCount를 계산
        const pipCount = rank === CardRank.Ace ? 1 : parseInt(rank as string, 10);

        // pipCount가 1에서 10 사이의 유효한 값인지 확인
        const isValidPipCount = pipCount >= 1 && pipCount <= 10;

        // 유효한 경우 pipLayouts에서 레이아웃을 가져오고, 아니면 빈 배열로 초기화
        const layout = isValidPipCount ? pipLayouts[pipCount] : [];
        const pipSize = rank === CardRank.Ace ? 48 * scale : PIP_FONT;

        return (
            <>
                {/* layout이 빈 배열일 경우 map은 아무것도 렌더링하지 않습니다. */}
                {layout.map(([px, py], idx) => (
                    <text
                        key={idx}
                        x={compress(px) * SVG_BASE_W}
                        y={compress(py) * SVG_BASE_H + pipSize / 3}
                        fontSize={pipSize}
                        textAnchor="middle"
                        fill={color}
                    >
                        {sChar}
                    </text>
                ))}
            </>
        );
    };
    return (
        <svg
            width={w}
            height={h}
            viewBox={`0 0 ${SVG_BASE_W} ${SVG_BASE_H}`}
            preserveAspectRatio="xMidYMid meet"
            className={`rounded-md border border-gray-400 shadow bg-white flex-shrink-0 ${className}`}
        >
            <rect x={0} y={0} width={SVG_BASE_W} height={SVG_BASE_H} rx={4} ry={4} fill="white" />
            <Corner />
            <RotatedCorner />
            <CenterGraphics />
        </svg>
    );
};

export const CardBack: React.FC<Omit<CardProps, "suit" | "rank">> = ({ width = 64, className = "" }) => {
    const w = Math.max(width, MIN_WIDTH);
    const h = (SVG_BASE_H / SVG_BASE_W) * w;
    return (
        <div
            style={{ width: w, height: h }}
            className={`rounded-md shadow-md bg-gray-800 border-2 border-gray-600 flex items-center justify-center relative overflow-hidden ${className}`}
        >
            <div className="absolute inset-0 bg-gray-900 opacity-90" />
            <div className="absolute w-10 h-10 border-2 border-gray-500" />
            <div className="absolute w-12 h-12 bg-gray-500 bg-opacity-10 rotate-45 transform -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute w-12 h-12 bg-gray-500 bg-opacity-10 -rotate-45 transform translate-x-1/2 translate-y-1/2" />
            <span className="relative text-gray-500 font-bold text-xs opacity-70">POKER</span>
        </div>
    );
};
