import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import { io } from 'socket.io-client';
import ThreadList from './ThreadList.tsx';
import MessageView from './MessageView.tsx';
import NewMessageModal from './NewMessageModal.tsx';
import SettingsModal from './SettingsModal.tsx';
import ReportModal from './ReportModal.tsx';
import type { Thread, Message } from '../types/chat';

const getThreadSlug = (thread: Thread | null | undefined): string =>
  (thread?.slug ?? thread?.id ?? '').toString();

const Chat = () => {
  const navigate = useNavigate();
  const { threadId: threadSlug } = useParams<{ threadId?: string }>();
  const { user, logout } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [userToReport, setUserToReport] = useState(null);

  // Fetch initial threads
  const fetchThreads = useCallback(async () => {
    try {
      setLoadingThreads(true);
      const fetchedThreads = await api.getThreads();
      setThreads(fetchedThreads);
    } catch (err) {
      setError('Could not load conversations.');
      if (err.message.includes('401')) logout();
    } finally {
      setLoadingThreads(false);
    }
  }, [logout]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handleSelectThread = useCallback(async (thread: Thread, options: { skipNavigation?: boolean } = {}) => {
    if (!thread || !user) return;

    const slug = getThreadSlug(thread);
    if (!options.skipNavigation) {
      navigate(`/threads/${slug}`, { replace: false });
    }

    if (activeThread?.id === thread.id) {
      return;
    }

    setActiveThread(thread);
    setMessages([]);
    setError('');
    setLoadingMessages(true);
    try {
      const fetchedMessages = await api.getMessagesForThread(thread.id) as Message[];
      setMessages(fetchedMessages);
      // Mark incoming messages as read
      fetchedMessages.forEach(msg => {
          if (msg.receiverId === user.id && !msg.readAt) {
              api.markMessageAsRead(msg.id).catch(console.error);
          }
      });
    } catch (err) {
      setError('Could not load messages.');
    } finally {
      setLoadingMessages(false);
    }
  }, [activeThread?.id, navigate, user]);

  // WebSocket connection - establish once and keep alive
  useEffect(() => {
    const tokens = JSON.parse(localStorage.getItem('tokens'));
    if (!tokens) return;

    const socket = io('http://localhost:3001', {
      auth: {
        token: tokens.accessToken,
      },
      transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server via', socket.io.engine.transport.name);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket server:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
    });

    socket.on('newMessage', (newMessage: Message) => {
      console.log('Received newMessage event:', newMessage);
      
      // Update messages if this message belongs to the currently active thread
      setMessages(prev => {
        // Check if we're viewing the thread this message belongs to
        const isActiveThread = prev.length > 0 && prev[0].threadId === newMessage.threadId;
        if (isActiveThread || prev.some(m => m.threadId === newMessage.threadId)) {
          // Avoid duplicates
          if (prev.some(m => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        }
        return prev;
      });

      // Update thread list
      setThreads(prev => {
        const threadIndex = prev.findIndex(t => t.id === newMessage.threadId);
        if (threadIndex > -1) {
          const updatedThread = { 
            ...prev[threadIndex], 
            lastMessage: newMessage.content, 
            lastMessageAt: newMessage.createdAt 
          };
          const otherThreads = prev.filter(t => t.id !== newMessage.threadId);
          return [updatedThread, ...otherThreads];
        } else {
          // New thread created, refetch
          fetchThreads();
          return prev;
        }
      });
    });

    socket.on('messageRead', ({ messageId, threadId, readAt }) => {
      console.log('Received messageRead event:', { messageId, threadId, readAt });
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, readAt } : msg
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchThreads]);

  useEffect(() => {
    if (!threadSlug) {
      setActiveThread(null);
      setMessages([]);
      return;
    }

    if (threads.length === 0) return;

    const matchedThread = threads.find(thread => getThreadSlug(thread) === threadSlug);
    if (matchedThread) {
      if (!activeThread || activeThread.id !== matchedThread.id) {
        handleSelectThread(matchedThread, { skipNavigation: true });
      }
    } else if (!loadingThreads) {
      setActiveThread(null);
      setMessages([]);
      navigate('/threads', { replace: true });
    }
  }, [threadSlug, threads, activeThread, handleSelectThread, navigate, loadingThreads]);

  const handleSendMessage = async (content) => {
    if (!activeThread) return;
    const otherParticipant = activeThread.participants.find(p => p.user && p.user.id !== user.id);
    if (!otherParticipant) {
        setError("Could not find the recipient. Please select a conversation again.");
        return;
    }
    if (!otherParticipant.user || !otherParticipant.user.anonymousTag) {
        setError("Recipient information is incomplete. Please refresh the page.");
        return;
    }
    if (!content || !content.trim()) {
        setError("Message cannot be empty.");
        return;
    }
    try {
        await api.sendMessage(otherParticipant.user.anonymousTag, content);
        setError(''); // Clear error on success
    } catch (err) {
        setError("Failed to send message.");
        console.error("Send message error:", err);
    }
  };

  const handleStartNewConversation = async (receiverTag, content) => {
    try {
        await api.sendMessage(receiverTag, content);
        setIsNewMessageModalOpen(false);
        fetchThreads();
    } catch (err) {
        return err.message;
    }
  };

  const handleBlockUser = async (userToBlockTag) => {
      const otherParticipant = activeThread?.participants.find(p => p.user?.anonymousTag === userToBlockTag);

      if (window.confirm(`Are you sure you want to block ${userToBlockTag}? You will no longer be able to message each other.`)) {
          try {
              await api.blockUser(userToBlockTag);
              alert(`${userToBlockTag} has been blocked.`);
              
              if (otherParticipant) {
                  setThreads(prevThreads => prevThreads.filter(thread => 
                      !thread.participants.some(p => p.id === otherParticipant.id)
                  ));
              }

              setActiveThread(null); // Deselect thread after blocking
              navigate('/threads', { replace: true });
          } catch(err) {
              setError(err.message);
          }
      }
  }
  
  const handleReportUser = (userToReportTag) => {
      setUserToReport(userToReportTag);
      setIsReportModalOpen(true);
  }

  const submitReport = async (reason) => {
      try {
          await api.reportUser(userToReport, reason);
          alert("Report submitted successfully. Thank you.");
          setIsReportModalOpen(false);
          setUserToReport(null);
      } catch (err) {
          return err.message;
      }
  }

  return (
    <>
      <div className="chat-container">
        <header className="chat-header">
          <div className="user-profile">
            <h2>Mom's Safe Haven</h2>
            <span>Your anonymous tag: <strong>{user.anonymousTag}</strong></span>
          </div>
          <div>
            <button onClick={() => setIsSettingsModalOpen(true)} className="settings-btn">Settings</button>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </header>
        <div className="chat-body">
          <ThreadList 
            threads={threads}
            loading={loadingThreads}
            onSelectThread={handleSelectThread}
            activeThreadId={activeThread?.id}
            currentUserTag={user.anonymousTag}
            onNewMessage={() => setIsNewMessageModalOpen(true)}
          />
          <MessageView 
            thread={activeThread}
            messages={messages}
            loading={loadingMessages}
            currentUserId={user.id}
            onSendMessage={handleSendMessage}
            onBlock={handleBlockUser}
            onReport={handleReportUser}
          />
        </div>
        {error && <p className="error" style={{padding: '1rem', margin: 0, borderRadius: '0 0 8px 8px'}}>{error}</p>}
      </div>
      {isNewMessageModalOpen && <NewMessageModal onClose={() => setIsNewMessageModalOpen(false)} onSend={handleStartNewConversation} />}
      {isSettingsModalOpen && <SettingsModal onClose={() => setIsSettingsModalOpen(false)} />}
      {isReportModalOpen && <ReportModal userTag={userToReport} onClose={() => setIsReportModalOpen(false)} onSubmit={submitReport}/>}
    </>
  );
};

export default Chat;
