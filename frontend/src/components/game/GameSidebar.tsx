import React, { FC } from 'react';
import GameRoomInfo, { GameRoomInfoProps } from './GameRoomInfo';
import PlayerController, { PlayerControllerProps } from './PlayerController';
import ChatArea, { ChatAreaProps } from './ChatArea';

type GameSidebarProps = GameRoomInfoProps & PlayerControllerProps & ChatAreaProps;

const GameSidebar: FC<GameSidebarProps> = (props) => {
    return (
        <div className="absolute right-4 top-4 bottom-4 flex w-80 flex-col rounded-2xl border border-white/10 bg-black/20 shadow-2xl backdrop-blur-xl">
            <div className="p-4 border-b border-white/10">
                <GameRoomInfo {...props} />
            </div>
            <div className="flex-1 p-4 overflow-y-auto min-h-0">
                <ChatArea {...props} />
            </div>
            <div className="p-4 border-t border-white/10">
                <PlayerController {...props} />
            </div>
        </div>
    );
};

export default GameSidebar;
