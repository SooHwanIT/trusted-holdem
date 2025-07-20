import { Link } from 'react-router-dom';
import { FaFingerprint, FaUsers, FaLaptop } from 'react-icons/fa';

export const HomePage = () => {
    return (
        // 전체 페이지 컨테이너: 은은한 그라데이션 배경
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center justify-center p-4">

            {/* 1. 히어로 섹션 */}
            <header className="relative z-10 text-center py-20 px-4 md:px-8 max-w-4xl">
                <h1 className="text-6xl md:text-8xl font-bold mb-4 tracking-tight">
                    Trusted Hold'em
                </h1>
                <p className="text-xl md:text-2xl font-light mb-12">
                    투명한 기술로 완성한, 당신의 진정한 승리
                </p>

                {/* 버튼 그룹 */}
                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <Link
                        to="/lobby"
                        className="flex items-center justify-center px-8 py-4 bg-purple-600 rounded-full text-lg font-semibold shadow-lg transition-transform hover:scale-105 hover:bg-purple-700"
                    >
                        지금 바로 플레이
                    </Link>
                    <Link
                        to="/login"
                        className="flex items-center justify-center px-8 py-4 bg-transparent border-2 border-gray-500 rounded-full text-lg font-semibold transition-colors hover:bg-gray-700"
                    >
                        로그인
                    </Link>
                </div>
            </header>

            {/* 2. 핵심 가치 섹션 */}
            <section className="relative z-10 w-full max-w-5xl py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center px-4">
                    <div className="flex flex-col items-center">
                        <div className="text-5xl text-blue-400 mb-4">
                            <FaFingerprint />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">절대적 공정성</h3>
                        <p className="text-gray-400 max-w-xs">
                            블록체인 기반의 검증 가능한 카드 셔플로 조작 없는 게임을 경험하세요.
                        </p>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="text-5xl text-purple-400 mb-4">
                            <FaUsers />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">활기찬 커뮤니티</h3>
                        <p className="text-gray-400 max-w-xs">
                            전 세계 플레이어들과 실시간으로 경쟁하며 포커 실력을 향상시키세요.
                        </p>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="text-5xl text-green-400 mb-4">
                            <FaLaptop />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">언제 어디서든</h3>
                        <p className="text-gray-400 max-w-xs">
                            모든 기기에서 최적화된 환경으로 언제든 접속해 게임을 즐길 수 있습니다.
                        </p>
                    </div>
                </div>
            </section>

            {/* 3. 푸터 */}
            <footer className="w-full text-center text-gray-500 py-8 text-sm mt-auto">
                <p>&copy; 2025 Trusted Hold'em. All rights reserved.</p>
            </footer>
        </div>
    );
};
