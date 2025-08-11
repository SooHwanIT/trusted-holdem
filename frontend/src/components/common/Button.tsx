import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
}

// 1. 아웃라인(Outline) 스타일 버튼
export const Button = ({ children, ...props }: ButtonProps) => {
    return (
        <button
            className="rounded-md border border-indigo-600 bg-transparent px-4 py-2 text-indigo-600 transition-colors hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            {...props}
        >
            {children}
        </button>
    );
};
