import React, { useState } from 'react';

const NewMessageModal = ({ onClose, onSend }) => {
    const [receiverTag, setReceiverTag] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!receiverTag.trim() || !content.trim()) {
            setError('Please fill out all fields.');
            return;
        }
        setError('');
        setLoading(true);
        const errorMessage = await onSend(receiverTag, content);
        if (errorMessage) {
            setError(errorMessage);
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>New Message</h2>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                {error && <p className="error">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="receiverTag">Recipient's Anonymous Tag</label>
                        <input
                            id="receiverTag"
                            type="text"
                            value={receiverTag}
                            onChange={(e) => setReceiverTag(e.target.value)}
                            placeholder="e.g., Mom#1234"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="messageContent">Your Message</label>
                        <textarea
                            id="messageContent"
                            rows={4}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                        ></textarea>
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Message'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default NewMessageModal;
