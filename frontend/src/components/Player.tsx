// src/components/Player.jsx

import React from 'react';
import Card from './game/Card.tsx';

const Player = ({ player, positionStyle, isCurrentUser = false, isDealer = false }) => {
    return (
        <div className={`absolute ${positionStyle} flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2`}>
            {/* Player Hand */}
            <div className="flex space-x-1 mb-2">
                {player.hand.map((card, index) => (
                    <Card key={index} card={card} facedown={!isCurrentUser && !player.showCards} />
                ))}
            </div>

            {/* Player Info Box */}
            <div className="bg-gray-800 bg-opacity-80 rounded-lg p-2 text-white text-center w-32 border-2 border-yellow-500 relative">
                <p className="font-bold text-lg">{player.name}</p>
                <p className="text-yellow-400 text-md">${player.stack.toLocaleString()}</p>
                {player.bet > 0 && (
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 px-2 py-0.5 rounded-full text-xs border border-white">
                        ${player.bet}
                    </div>
                )}
            </div>

            {/* Dealer Button */}
            {isDealer && (
                <div className="absolute top-0 right-[-20px] w-8 h-8 bg-white rounded-full flex items-center justify-center text-black font-bold border-2 border-gray-400">
                    D
                </div>
            )}
        </div>
    );
};

export default Player;
