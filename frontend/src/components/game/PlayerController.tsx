import React, { useState, useEffect, FC, ReactNode } from 'react';
import { Coins, ArrowUpCircle, ArrowDownCircle, XCircle, CheckCircle } from 'lucide-react';

export interface PlayerControllerProps {
    isMyTurn: boolean; chips: number; callAmount: number; minRaise: number;
    onFold: () => void; onCheck: () => void; onCall: () => void; onRaise: (amount: number) => void;
}

const ActionButton: FC<{ onClick: () => void; disabled: boolean; icon: ReactNode; label: string; subLabel?: string; color: string; }> =
    ({ onClick, disabled, icon, label, subLabel, color }) => (
        <button onClick={onClick} disabled={disabled} className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg p-3 transition-all duration-200 enabled:hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed ${color}`}>
            {icon}<span className="text-sm font-semibold">{label}</span>{subLabel && <span className="text-xs">{subLabel}</span>}
        </button>
    );

const PlayerController: FC<PlayerControllerProps> = ({ isMyTurn, chips, callAmount, minRaise, onFold, onCheck, onCall, onRaise }) => {
    const [raiseAmount, setRaiseAmount] = useState(minRaise);
    useEffect(() => { setRaiseAmount(minRaise); }, [minRaise]);

    return (
        <div className="flex flex-col space-y-3 text-white">
            <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                <span className="text-sm font-medium text-white/80">보유 칩</span>
                <div className="flex items-center gap-2 font-semibold"><Coins className="h-5 w-5 text-yellow-400" /><span>{chips.toLocaleString()}</span></div>
            </div>
            <div className="flex items-stretch gap-3">
                <ActionButton onClick={onFold} disabled={!isMyTurn} icon={<XCircle className="h-6 w-6" />} label="폴드" color="bg-red-500/80 enabled:hover:bg-red-500" />
                {callAmount === 0 ? (
                    <ActionButton onClick={onCheck} disabled={!isMyTurn} icon={<CheckCircle className="h-6 w-6" />} label="체크" color="bg-gray-500/80 enabled:hover:bg-gray-500" />
                ) : (
                    <ActionButton onClick={onCall} disabled={!isMyTurn || chips < callAmount} icon={<ArrowDownCircle className="h-6 w-6" />} label="콜" subLabel={callAmount.toString()} color="bg-blue-500/80 enabled:hover:bg-blue-500" />
                )}
            </div>
            <div className="flex flex-col gap-3 rounded-lg bg-white/5 p-3">
                <div className="flex items-center justify-between">
                    <label htmlFor="raise-amount" className="text-sm font-medium text-white/80">레이즈 금액</label>
                    <span className="text-xs text-white/60">최소: {minRaise}</span>
                </div>
                <input id="raise-amount" type="range" min={minRaise} max={chips} step={minRaise > 0 ? minRaise : 10} value={raiseAmount} onChange={(e) => setRaiseAmount(Number(e.target.value))} disabled={!isMyTurn || chips < minRaise} className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/20 disabled:cursor-not-allowed" />
                <div className="flex items-center gap-3">
                    <input type="number" value={raiseAmount} onChange={(e) => setRaiseAmount(Number(e.target.value))} disabled={!isMyTurn || chips < minRaise} className="w-full rounded-md border-none bg-black/30 p-2 text-center font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50" />
                    <ActionButton onClick={() => onRaise(raiseAmount)} disabled={!isMyTurn || raiseAmount < minRaise || raiseAmount > chips} icon={<ArrowUpCircle className="h-6 w-6" />} label="레이즈" color="flex-shrink-0 bg-purple-600/80 enabled:hover:bg-purple-600 w-24" />
                </div>
            </div>
        </div>
    );
};

export default PlayerController;
