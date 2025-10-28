import React, { useState } from 'react';

const ReportModal = ({ userTag, onClose, onSubmit }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) {
            setError('Please provide a reason for the report.');
            return;
        }
        setError('');
        setLoading(true);
        const errorMessage = await onSubmit(reason);
        if (errorMessage) {
            setError(errorMessage);
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Report {userTag}</h2>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                {error && <p className="error">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="reportReason">Reason for Report</label>
                        <p className="form-hint">If this report is about specific messages, please describe them below.</p>
                        <textarea
                            id="reportReason"
                            rows={5}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Please describe why you are reporting this user..."
                            required
                        ></textarea>
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Report'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;
