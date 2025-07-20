// src/hooks/usePokerLayout.ts
import { useEffect, useState } from 'react';
import { calcPokerLayout, Layout } from '../utils/pokerLayout';

export const usePokerLayout = (
    slotW: number,
    ar = 1.4,
    k = 0.15,
) => {
    const [layout, setLayout] = useState<Layout>(() =>
        calcPokerLayout({ vw: window.innerWidth, vh: window.innerHeight, slotW, AR: ar, k })
    );

    useEffect(() => {
        const onResize = () =>
            setLayout(calcPokerLayout({
                vw: window.innerWidth,
                vh: window.innerHeight,
                slotW,
                AR: ar,
                k,
            }));
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [slotW, ar, k]);

    return layout;
};
