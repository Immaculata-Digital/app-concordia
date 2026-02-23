import React from 'react';

const BrainIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = 'currentColor' }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Main Large Sparkle */}
            <path
                d="M12 2C12 2 13 9 20 12C13 15 12 22 12 22C12 22 11 15 4 12C11 9 12 2 12 2Z"
                fill={color}
                fillOpacity="0.25"
                stroke={color}
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Smaller Top Right */}
            <path
                d="M18 4C18 4 18.5 6.5 21 7.5C18.5 8.5 18 11 18 11C18 11 17.5 8.5 15 7.5C17.5 6.5 18 4 18 4Z"
                fill={color}
            />
            {/* Smallest Bottom Left */}
            <path
                d="M6 15C6 15 6.3 17 8 18C6.3 19 6 21 6 21C6 21 5.7 19 4 18C5.7 17 6 15 6 15Z"
                fill={color}
            />
        </svg>
    );
};

export default BrainIcon;
