// types/game.ts 또는 types/socket.ts (선택 사항)

/**
 * @description 게임 스냅샷 내의 플레이어 정보를 나타내는 타입입니다.
 */
export type SnapPlayer = {
    /**
     * @description 플레이어의 고유 ID (MongoDB의 _id와 연결될 수 있습니다).
     */
    id: string;
    /**
     * @description 플레이어의 표시 이름 (닉네임).
     */
    name: string;
    /**
     * @description 플레이어가 현재 보유하고 있는 칩의 총량입니다.
     */
    chips: number;
    /**
     * @description 현재 라운드에서 플레이어가 베팅한 칩의 양입니다.
     */
    bet: number;
    /**
     * @description 플레이어의 현재 게임 상태입니다.
     * - 'active': 현재 라운드에 참여 중인 플레이어
     * - 'folded': 현재 라운드에서 폴드한 플레이어
     * - 'all-in': 모든 칩을 베팅한 플레이어
     */
    status: 'active' | 'folded' | 'all-in';
    /**
     * @description (선택 사항) 플레이어의 턴 남은 시간 (초 단위).
     */
    timer: number;
    /**
     * @description (선택 사항) 플레이어의 현재 블라인드 역할 ('SB': 스몰 블라인드, 'BB': 빅 블라인드).
     */
    blind?: 'SB' | 'BB';
    /**
     * @description 플레이어의 홀 카드 (개별적으로 보유한 카드). 쇼다운 전에는 다른 플레이어에게는 `null`로 표시될 수 있습니다.
     */
    hole: (string | null)[];
};

/**
 * @description 게임의 현재 상태를 나타내는 전체 스냅샷 타입입니다.
 */
export type Snapshot = {
    /**
     * @description 현재 게임 라운드의 페이즈 (단계)입니다.
     * - 'waiting': 플레이어 대기 중
     * - 'preflop': 프리플랍 베팅 라운드
     * - 'flop': 플랍 카드 오픈 및 베팅 라운드
     * - 'turn': 턴 카드 오픈 및 베팅 라운드
     * - 'river': 리버 카드 오픈 및 베팅 라운드
     * - 'showdown': 승패 결정 및 카드 공개 단계
     */
    phase: 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
    /**
     * @description 테이블에 공개된 커뮤니티 카드들입니다.
     */
    community: string[];
    /**
     * @description 현재 팟에 모인 총 칩의 양입니다.
     */
    pot: number;
    /**
     * @description 현재 딜러 버튼을 가진 플레이어의 배열 인덱스 또는 위치입니다.
     */
    dealerPos: number;
    /**
     * @description 현재 진행 중인 핸드(게임 라운드)의 번호입니다.
     */
    handNumber: number;
    /**
     * @description 현재 턴인 플레이어의 고유 ID입니다.
     */
    currentId: string;
    /**
     * @description 게임에 참여한 모든 플레이어의 스냅샷 정보 배열입니다.
     */
    players: SnapPlayer[];
};

/**
 * @description 채팅 메시지를 나타내는 타입입니다.
 */
export type Message = {
    /**
     * @description 메시지의 고유 ID.
     */
    id: string;
    /**
     * @description 메시지를 보낸 사람의 이름 (닉네임).
     */
    sender: string;
    /**
     * @description 메시지 내용입니다.
     */
    text: string;
    /**
     * @description 메시지가 전송된 타임스탬프 (밀리초).
     */
    timestamp: number;
};