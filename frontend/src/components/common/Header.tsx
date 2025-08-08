import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/Auth';

export default function Header() {
  const { user, logout, isLoading } = useAuth();
  
  // 로딩 중일 때
  if (isLoading) {
    return (
      <header
        className="
          fixed top-0 left-0 w-full z-50
          flex justify-center items-center
          px-6 py-4
          bg-black/10 backdrop-blur-xl
          border-b border-white/10
          shadow-lg
          text-white
        "
      >
        <span className="text-sm md:text-base font-semibold">
          로딩 중...
        </span>
      </header>
    );
  }

  // 로딩이 완료된 후
  return (
    <header
      className="
        fixed top-0 left-0 w-full z-50
        flex justify-between items-center
        px-6 py-4
        bg-black/10 backdrop-blur-xl
        border-b border-white/10
        shadow-lg
      "
    >
      {/* 왼쪽: 로고 (텍스트 색상 변경) */}
      <Link to="/" className="text-xl md:text-2xl font-bold text-white no-underline tracking-wide">
        POKER GAME
      </Link>

      {/* 오른쪽: 사용자 정보 또는 로그인/회원가입 버튼 */}
      {user ? (
        // 사용자가 로그인된 경우
        <div className="flex items-center gap-3 md:gap-4">
          
          {/* 사용자 닉네임 (텍스트 색상 변경) */}
          <span className="text-white text-sm md:text-base font-semibold">
            {user.nickname}
          </span>
          {/* 프로필 아바타 (배경색 변경) */}
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-700 flex justify-center items-center text-white font-semibold text-sm md:text-base flex-shrink-0">
            {user.nickname?.charAt(0)?.toUpperCase()}
          </div>
        </div>
      ) : (
        // 사용자가 로그인되지 않은 경우
        <div className="flex gap-2 md:gap-3">
          <Link
            to="/login"
            className="px-3 py-2 text-sm md:text-base cursor-pointer rounded-md border border-gray-400 bg-transparent text-white no-underline hover:bg-white/10 transition-colors"
          >
            로그인
          </Link>
          <Link
            to="/signup"
            className="px-3 py-2 text-sm md:text-base cursor-pointer rounded-md border border-gray-400 bg-transparent text-white no-underline hover:bg-white/10 transition-colors"
          >
            회원가입
          </Link>
        </div>
      )}
    </header>
  );
}