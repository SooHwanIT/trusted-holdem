// src/utils/pokerLayout.ts
export interface Coords { x: number; y: number }
export interface Layout {
    cardW: number; cardH: number;
    tableW: number; tableH: number;
    tableLeft: number; tableTop: number;
    slots: Coords[];          // 길이 10
}

interface Opt {
    vw: number; vh: number;
    slotW: number;            // PlayerSlot 고정 폭
    AR?: number;              // 카드 종횡비(기본 1.4)
    k?: number;               // 카드 스케일(기본 0.15)
}

export function calcPokerLayout ({
                                     vw, vh, slotW, AR = 1.4, k = 0.15,
                                 }: Opt): Layout {
    const cardW = Math.min(slotW, vw * k, vh / 5);
    const cardH = cardW * AR;

    const padX = cardW * 1.5;
    const padY = cardH * 1.5;

    const tableW = vw - padX * 2;
    const tableH = vh - padY * 2;
    const tableLeft = padX;
    const tableTop  = padY;

    const gapX = (tableW - cardW * 3) / 4;
    const gapY = (tableH - cardH * 2) / 3;
    const edge  = Math.min(gapX, gapY) / 2;

    const cx = (n: number) => tableLeft + gapX * n + cardW * (n - 0.5);
    const cy = (n: number) => tableTop  + gapY * n + cardH * (n - 0.5);

    const slots: Coords[] = [
        // top 3
        { x: cx(1), y: tableTop - edge - cardH * 0.5 },
        { x: cx(2), y: tableTop - edge - cardH * 0.5 },
        { x: cx(3), y: tableTop - edge - cardH * 0.5 },
        // bottom 3
        { x: cx(1), y: tableTop + tableH + edge + cardH * 0.5 },
        { x: cx(2), y: tableTop + tableH + edge + cardH * 0.5 },
        { x: cx(3), y: tableTop + tableH + edge + cardH * 0.5 },
        // left 2
        { x: tableLeft - edge - cardW * 0.5, y: cy(1) },
        { x: tableLeft - edge - cardW * 0.5, y: cy(2) },
        // right 2
        { x: tableLeft + tableW + edge + cardW * 0.5, y: cy(1) },
        { x: tableLeft + tableW + edge + cardW * 0.5, y: cy(2) },
    ];

    return { cardW, cardH, tableW, tableH, tableLeft, tableTop, slots };
}
