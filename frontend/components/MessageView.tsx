import React, { useState, useEffect, useRef } from 'react';

const MessageView = ({ thread, messages, loading, currentUserId, onSendMessage, onBlock, onReport }) => {
    const [content, setContent] = useState('');
    const [showActions, setShowActions] = useState(false);
    const messagesEndRef = useRef(null);
    const actionsMenuRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Close actions menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // FIX: Corrected typo from actionsMenu_current to actionsMenuRef.current
            if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
                setShowActions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [actionsMenuRef]);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (content.trim()) {
            onSendMessage(content);
            setContent('');
        }
    };

    if (!thread) {
        return (
            <main className="message-view">
                <div className="no-thread-selected">
                    <p>Select a conversation to start chatting,<br/> or start a new one!</p>
                </div>
            </main>
        );
    }
    
    const otherParticipant = thread.participants.find(p => p.user.id !== currentUserId);

    return (
        <main className="message-view">
            <header className="message-view-header">
                <span>Chatting with <strong>{otherParticipant ? otherParticipant.user.anonymousTag : '...'}</strong></span>
                <div className="actions-menu-container" ref={actionsMenuRef}>
                    <button className="actions-btn" onClick={() => setShowActions(!showActions)}>⋮</button>
                    {showActions && (
                        <div className="actions-dropdown">
                            <button onClick={() => { onBlock(otherParticipant.user.anonymousTag); setShowActions(false); }}>Block User</button>
                            <button onClick={() => { onReport(otherParticipant.user.anonymousTag); setShowActions(false); }}>Report User</button>
                        </div>
                    )}
                </div>
            </header>
            <div className="message-list">
                {loading && <p>Loading messages...</p>}
                {!loading && messages.map(msg => (
                    <div 
                        key={msg.id} 
                        className={`message-wrapper ${msg.senderId === currentUserId ? 'sent-wrapper' : 'received-wrapper'}`}
                    >
                        <div className={`message ${msg.senderId === currentUserId ? 'sent' : 'received'}`}>
                            <span className="sender-tag">{msg.sender.anonymousTag}</span>
                            {msg.content}
                        </div>
                         {msg.senderId === currentUserId && msg.readAt && (
                            <span className="read-receipt">✓ Seen</span>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form className="new-message-form" onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    placeholder="Type your message..." 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <button type="submit" disabled={!content.trim()}>Send</button>
            </form>
        </main>
    );
};

export default MessageView;