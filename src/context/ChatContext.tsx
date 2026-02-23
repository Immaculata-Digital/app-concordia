import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface ChatContextType {
    isChatOpen: boolean;
    isMaximized: boolean;
    toggleChat: () => void;
    openChat: () => void;
    closeChat: () => void;
    toggleMaximized: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);

    const toggleChat = () => setIsChatOpen((prev) => !prev);
    const openChat = () => setIsChatOpen(true);
    const closeChat = () => setIsChatOpen(false);
    const toggleMaximized = () => setIsMaximized((prev) => !prev);

    return (
        <ChatContext.Provider value={{ isChatOpen, isMaximized, toggleChat, openChat, closeChat, toggleMaximized }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
