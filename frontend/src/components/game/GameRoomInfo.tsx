/** ----------------------------------
 * GameRoomInfo Component
 * ---------------------------------- */
import React from "react";
import { Coins, Users, Clock, Calendar, LayoutGrid, Flag } from "lucide-react";

interface GameRoomInfoProps {
    roomId: string;
    roomName: string;
    playerCount: number;
    maxPlayers: number;
    smallBlind: number;
    bigBlind: number;
    ante: number;
    potSize: number;
    dealerPosition: number;  // player index
    handNumber: number;
    roundName: string;
    timeLeft: number; // seconds to next action
}

const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const GameRoomInfo: React.FC<GameRoomInfoProps> = ({
                                                       roomId,
                                                       roomName,
                                                       playerCount,
                                                       maxPlayers,
                                                       smallBlind,
                                                       bigBlind,
                                                       ante,
                                                       potSize,
                                                       dealerPosition,
                                                       handNumber,
                                                       roundName,
                                                       timeLeft,
                                                   }) => (
    <div className="absolute top-4 right-4 w-72 p-5 bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30 rounded-2xl shadow-xl text-white space-y-3">
        {/* Header: Room info */}
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold truncate">{roomName}</h2>
                <p className="text-xs text-gray-200">ID: {roomId}</p>
            </div>
            <div className="flex items-center space-x-1 text-sm">
                <Users className="w-5 h-5 text-blue-200" />
                <span>{playerCount}/{maxPlayers}</span>
            </div>
        </div>

        {/* Stakes: SB/BB/Ante */}
        <div className="grid grid-cols-6 gap-1 text-sm">
            <Flag className="w-4 h-4 text-red-300 col-span-1" />
            <span className="col-span-2 text-gray-200">SB:</span>
            <span className="col-span-3">{smallBlind}</span>
            <Flag className="w-4 h-4 text-yellow-300 col-span-1" />
            <span className="col-span-2 text-gray-200">BB:</span>
            <span className="col-span-3">{bigBlind}</span>
            <LayoutGrid className="w-4 h-4 text-green-300 col-span-1" />
            <span className="col-span-2 text-gray-200">Ante:</span>
            <span className="col-span-3">{ante}</span>
        </div>

        {/* Pot & Round */}
        <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-1">
                <Coins className="w-5 h-5 text-yellow-300" />
                <span>Pot: {potSize}</span>
            </div>
            <div className="flex items-center space-x-1">
                <Calendar className="w-5 h-5 text-gray-300" />
                <span>Hand #{handNumber}</span>
            </div>
        </div>
        <div className="text-sm">
            <span className="font-medium">Round:</span> {roundName}
        </div>

        {/* Dealer & Timer */}
        <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-1">
                <Clock className="w-5 h-5 text-blue-300" />
                <span>{formatTime(timeLeft)}</span>
            </div>
            <div className="flex items-center space-x-1">
                <span className="text-gray-200">Dealer:</span>
                <span>#{dealerPosition + 1}</span>
            </div>
        </div>
    </div>
);

export default GameRoomInfo;
