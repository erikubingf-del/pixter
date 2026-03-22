import React from 'react';

export default function Logo({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 35.5C20 35.5 6 25.5 6 14.5C6 9 10.5 4.5 16 4.5C18.5 4.5 20 6 20 6C20 6 21.5 4.5 24 4.5C29.5 4.5 34 9 34 14.5C34 25.5 20 35.5 20 35.5Z" fill="url(#paint0_linear)" />
                <path d="M16 4.5C10.5 4.5 6 9 6 14.5C6 25.5 20 35.5 20 35.5C20 35.5 27 30.5 31 22.5C34.5 15.5 29.5 4.5 24 4.5C21.5 4.5 20 6 20 6C20 6 18.5 4.5 16 4.5Z" fill="url(#paint1_linear)" style={{ mixBlendMode: 'multiply' }} opacity="0.8" />
                <defs>
                    <linearGradient id="paint0_linear" x1="6" y1="4.5" x2="34" y2="35.5" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#00C9A7" />
                        <stop offset="1" stopColor="#6C5DD3" />
                    </linearGradient>
                    <linearGradient id="paint1_linear" x1="34" y1="4.5" x2="6" y2="35.5" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#5549B8" />
                        <stop offset="1" stopColor="#00A388" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>
            <span className="text-[1.35rem] font-bold text-[#111827] tracking-tight font-heading">
                AmoPagar
            </span>
        </div>
    );
}
