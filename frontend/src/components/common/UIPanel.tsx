import React, { FC, ReactNode } from 'react';

interface UIPanelProps {
    children: ReactNode;
    className?: string; // 위치 및 크기 조정을 위한 클래스
}

const UIPanel: FC<UIPanelProps> = ({ children, className }) => {
    return (
        <div className={`flex flex-col rounded-2xl border border-white/10 bg-black/20 shadow-2xl backdrop-blur-xl p-4 ${className}`}>
            {children}
        </div>
    );
};

export default UIPanel;
