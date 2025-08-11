import React, { FC, ReactNode } from 'react';
import { Coins, Calendar, LayoutGrid, Flag } from 'lucide-react';

export interface GameRoomInfoProps {
    roomId: string; roomName: string; playerCount: number; maxPlayers: number;
    smallBlind: number; bigBlind: number; ante: number; potSize: number;
    dealerPosition: number; handNumber: number; roundName: string; timeLeft: number;
}

const InfoRow: FC<{ icon: ReactNode; label: string; value: ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-neutral-300">{icon}<span>{label}</span></div>
        <span className="font-medium text-white">{value}</span>
    </div>
);

const GameRoomInfo: FC<GameRoomInfoProps> = (props) => (
    <div className="flex flex-col space-y-3">
        <div>
            <h2 className="text-lg font-bold text-white truncate">{props.roomName}</h2>
            <p className="text-xs text-neutral-300">ID: {props.roomId}</p>
        </div>
        <div className="grid grid-cols-3 gap-x-4 text-center">
            <div><p className="text-xs text-neutral-300">Small Blind</p><p className="font-semibold text-white">{props.smallBlind}</p></div>
            <div><p className="text-xs text-neutral-300">Big Blind</p><p className="font-semibold text-white">{props.bigBlind}</p></div>
            <div><p className="text-xs text-neutral-300">Ante</p><p className="font-semibold text-white">{props.ante}</p></div>
        </div>
        <hr className="border-t border-white/10" />
        <div className="space-y-2">
            <InfoRow icon={<Coins className="h-4 w-4" />} label="Total Pot" value={props.potSize.toLocaleString()} />
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Hand No." value={`#${props.handNumber}`} />
            <InfoRow icon={<LayoutGrid className="h-4 w-4" />} label="Current Round" value={props.roundName.charAt(0).toUpperCase() + props.roundName.slice(1)} />
            <InfoRow icon={<Flag className="h-4 w-4" />} label="Dealer" value={`Player #${props.dealerPosition + 1}`} />
        </div>
    </div>
);

export default GameRoomInfo;
