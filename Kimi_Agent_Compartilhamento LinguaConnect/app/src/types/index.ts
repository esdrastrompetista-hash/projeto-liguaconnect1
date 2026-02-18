export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'masculino' | 'feminino' | 'outro';
  country: string;
  nativeLanguage: string;
  learningLanguages: { language: string; level: string }[];
  bio: string;
  avatarUrl?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'audio';
  createdAt: Date;
  isRead?: boolean;
}

export interface Conversation {
  id: string;
  userOneId: string;
  userTwoId: string;
  createdAt: Date;
  lastMessage?: Message;
  otherUser?: UserProfile;
  unreadCount?: number;
}

export interface CallState {
  isCalling: boolean;
  isReceiving: boolean;
  callerId?: string;
  callerName?: string;
  receiverId?: string;
  peerConnection?: RTCPeerConnection;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
}

export interface FilterOptions {
  nativeLanguage: string;
  learningLanguage: string;
  gender: string;
  minAge: number;
  maxAge: number;
}
