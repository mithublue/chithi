export interface ThreadParticipant {
  id: string;
  anonymousTag?: string;
  user?: {
    id: string;
    anonymousTag: string;
  };
}

export interface Thread {
  id: string;
  slug?: string;
  participants: ThreadParticipant[];
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
  sender: {
    id: string;
    anonymousTag: string;
  };
}
