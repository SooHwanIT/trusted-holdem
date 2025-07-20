/** ----------------------------------
 * PlayerController Component
 * ---------------------------------- */
import React, { useState, useEffect } from "react";
import { Coins, ArrowUpCircle, ArrowDownCircle, XCircle, CheckCircle } from "lucide-react";

interface PlayerControllerProps {
    isCurrent: boolean;
    chips: number;
    callAmount: number;
    minRaise: number;
    onFold: () => void;
    onCheck: () => void;
    onCall: () => void;
    onRaise: (amount: number) => void;
}

const PlayerController: React.FC<PlayerControllerProps> = ({
                                                               isCurrent,
                                                               chips,
                                                               callAmount,
                                                               minRaise,
                                                               onFold,
                                                               onCheck,
                                                               onCall,
                                                               onRaise,
                                                           }) => {
    const [raiseAmount, setRaiseAmount] = useState(minRaise);

    // Reset raiseAmount when minRaise changes
    useEffect(() => {
        setRaiseAmount(minRaise);
    }, [minRaise]);

    return (
        <div className="absolute bottom-4 right-4 w-64 bg-black text-white rounded-xl shadow-lg p-4 flex flex-col space-y-4">
            {/* Header: title and chips */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <span className="text-sm font-semibold">Your Move</span>
                <span className="flex items-center text-xs">
          <Coins className="w-4 h-4 mr-1 text-yellow-400" />
                    {chips}
        </span>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-around">
                <button
                    className="flex flex-col items-center disabled:opacity-50"
                    onClick={onFold}
                    disabled={!isCurrent}
                >
                    <XCircle className="w-6 h-6 text-red-500" />
                    <span className="text-xs">Fold</span>
                </button>

                {callAmount === 0 ? (
                    <button
                        className="flex flex-col items-center disabled:opacity-50"
                        onClick={onCheck}
                        disabled={!isCurrent}
                    >
                        <CheckCircle className="w-6 h-6 text-gray-400" />
                        <span className="text-xs">Check</span>
                    </button>
                ) : (
                    <button
                        className="flex flex-col items-center disabled:opacity-50"
                        onClick={onCall}
                        disabled={!isCurrent || chips < callAmount}
                    >
                        <ArrowDownCircle className="w-6 h-6 text-blue-500" />
                        <span className="text-xs">Call {callAmount}</span>
                    </button>
                )}

                <button
                    className="flex flex-col items-center disabled:opacity-50"
                    onClick={() => onRaise(raiseAmount)}
                    disabled={!isCurrent || raiseAmount < minRaise || raiseAmount > chips - callAmount}
                >
                    <ArrowUpCircle className="w-6 h-6 text-green-500" />
                    <span className="text-xs">Raise</span>
                </button>
            </div>

            {/* Raise Input */}
            <div className="flex items-center justify-between">
                <input
                    type="number"
                    className="w-2/3 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white disabled:opacity-50"
                    value={raiseAmount}
                    min={minRaise}
                    max={chips - callAmount}
                    onChange={e => setRaiseAmount(Number(e.target.value))}
                    disabled={!isCurrent}
                />
                <span className="text-xs text-gray-400">min {minRaise}</span>
            </div>
        </div>
    );
};

export default PlayerController;
