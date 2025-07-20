import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
}

// 아래와 같이 'export' 키워드를 'const' 앞에 붙여서 이름 있는 내보내기로 만듭니다.
export const Button = ({ children, ...props }: ButtonProps) => {
    return (
        <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            {...props}
        >
            {children}
        </button>
    );
};
