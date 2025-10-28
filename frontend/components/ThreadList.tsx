import React from 'react';
import type { Thread } from '../types/chat';

interface ThreadListProps {
  threads: Thread[];
  loading: boolean;
  onSelectThread: (thread: Thread) => void;
  activeThreadId: string | null | undefined;
  currentUserTag: string;
  onNewMessage: () => void;
}

const ThreadList: React.FC<ThreadListProps> = ({ threads, loading, onSelectThread, activeThreadId, currentUserTag, onNewMessage }) => (
  <aside className="thread-list">
    <div className="thread-list-header">
      <h3>Conversations</h3>
      <button className="new-message-btn" title="New Message" onClick={onNewMessage}>+</button>
    </div>
    <ul>
      {loading && <p style={{padding: '1rem', color: '#888'}}>Loading...</p>}
      {!loading && threads.length === 0 && <p style={{padding: '1rem', color: '#888'}}>No conversations yet.</p>}
      {!loading && threads.map((thread) => {
        const otherParticipant = thread.participants.find(p => p.user && p.user.anonymousTag !== currentUserTag);
        const displayTag = otherParticipant?.user?.anonymousTag ?? otherParticipant?.anonymousTag ?? 'Unknown User';
        return (
          <li
            key={thread.id}
            className={thread.id === activeThreadId ? 'active' : ''}
            onClick={() => onSelectThread(thread)}
          >
            <div className="thread-info">
              <span className="thread-participant">
                {displayTag}
              </span>
              <p className="thread-last-message">{thread.lastMessage}</p>
            </div>
          </li>
        );
      })}
    </ul>
  </aside>
);

export default ThreadList;