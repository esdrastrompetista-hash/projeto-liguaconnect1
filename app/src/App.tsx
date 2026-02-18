import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Header } from '@/components/Header';
import { UserCard } from '@/components/UserCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { Chat } from '@/components/Chat';
import { CallModal } from '@/components/CallModal';
import { ProfileModal } from '@/components/ProfileModal';
import { FindPartnerModal } from '@/components/FindPartnerModal';
import { LoginPage } from '@/components/LoginPage';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { usersApi } from '@/services/api';
import type { UserProfile, Message, FilterOptions } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

function AppContent() {
  const { user, isAuthenticated, login, loginWithGoogle, register, updateProfile } = useAuth();
  const socket = useSocket(user?.id);
  const webRTC = useWebRTC(socket, user?.id);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    nativeLanguage: 'todos',
    learningLanguage: 'todos',
    gender: 'todos',
    minAge: 13,
    maxAge: 80
  });

  const [activeChat, setActiveChat] = useState<UserProfile | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFindPartnerModalOpen, setIsFindPartnerModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Load users from API
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadUsers = async () => {
      try {
        const response = await usersApi.getUsers({ excludeMe: true });
        setUsers(response.data);
        setFilteredUsers(response.data);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    loadUsers();
  }, [isAuthenticated]);

  // Filter users based on search and filters
  useEffect(() => {
    let result = users;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(query) ||
        u.country.toLowerCase().includes(query) ||
        u.nativeLanguage.toLowerCase().includes(query)
      );
    }

    // Native language filter
    if (filters.nativeLanguage && filters.nativeLanguage !== 'todos') {
      result = result.filter(u => 
        u.nativeLanguage.toLowerCase().replace(/\s/g, '-') === filters.nativeLanguage
      );
    }

    // Learning language filter
    if (filters.learningLanguage && filters.learningLanguage !== 'todos') {
      result = result.filter(u => 
        u.learningLanguages?.some(lang => 
          lang.language.toLowerCase().replace(/\s/g, '-') === filters.learningLanguage
        )
      );
    }

    // Gender filter
    if (filters.gender && filters.gender !== 'todos') {
      result = result.filter(u => u.gender === filters.gender);
    }

    // Age filter
    result = result.filter(u => u.age >= filters.minAge && u.age <= filters.maxAge);

    setFilteredUsers(result);
  }, [users, searchQuery, filters]);

  // Handle start chat
  const handleStartChat = useCallback(async (targetUser: UserProfile) => {
    try {
      // Create or get conversation
      const conversationId = await socket.createConversation(targetUser.id);
      setCurrentConversationId(conversationId);

      // Load messages
      await socket.loadMessages(conversationId);

      // Join conversation room
      socket.joinConversation(conversationId);

      setActiveChat(targetUser);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  }, [socket]);

  // Handle chat messages
  const handleSendMessage = useCallback((content: string) => {
    if (!activeChat || !user || !currentConversationId) return;

    socket.sendMessage(currentConversationId, content, user.id);

    setChatMessages(prev => ({
      ...prev,
      [currentConversationId]: [
        ...(prev[currentConversationId] || []),
        {
          id: `msg-${Date.now()}`,
          conversationId: currentConversationId,
          senderId: user.id,
          content,
          type: 'text',
          createdAt: new Date(),
          isRead: true
        }
      ]
    }));
  }, [activeChat, user, currentConversationId, socket]);

  // Handle start call
  const handleStartCall = useCallback((targetUser: UserProfile) => {
    setIsCallModalOpen(true);
    webRTC.startCall(targetUser.id, targetUser.name);
  }, [webRTC]);

  // Handle find partner search
  const handleFindPartner = useCallback((searchFilters: {
    language: string;
    minAge: number;
    maxAge: number;
    gender: string;
  }) => {
    setFilters({
      nativeLanguage: 'todos',
      learningLanguage: searchFilters.language || 'todos',
      gender: searchFilters.gender,
      minAge: searchFilters.minAge,
      maxAge: searchFilters.maxAge
    });
  }, []);

  // Handle profile save
  const handleProfileSave = useCallback(async (profileData: Partial<UserProfile>) => {
    await updateProfile(profileData);
  }, [updateProfile]);

  // Listen for incoming calls
  useEffect(() => {
    if (webRTC.callState.isReceiving || webRTC.callState.isCalling || webRTC.callState.isInCall) {
      setIsCallModalOpen(true);
    }
  }, [webRTC.callState.isReceiving, webRTC.callState.isCalling, webRTC.callState.isInCall]);

  // Sync socket messages with local state
  useEffect(() => {
    if (currentConversationId && socket.messages.length > 0) {
      setChatMessages(prev => ({
        ...prev,
        [currentConversationId]: socket.messages
      }));
    }
  }, [socket.messages, currentConversationId]);

  if (!isAuthenticated) {
    return (
      <LoginPage 
        onLogin={login} 
        onGoogleLogin={loginWithGoogle}
        onRegister={register}
      />
    );
  }

  const currentMessages = currentConversationId ? chatMessages[currentConversationId] || [] : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header 
        onFindPartner={() => setIsFindPartnerModalOpen(true)}
        onEditProfile={() => setIsProfileModalOpen(true)}
      />

      <main className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar 
              filters={filters} 
              onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))} 
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Buscar por nome, país..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-white border-0 shadow-sm"
                />
              </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredUsers.map((u, index) => (
                  <UserCard
                    key={u.id}
                    user={u}
                    onStartChat={handleStartChat}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </div>

            {filteredUsers.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-slate-500">Nenhum usuário encontrado com esses filtros.</p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({
                      nativeLanguage: 'todos',
                      learningLanguage: 'todos',
                      gender: 'todos',
                      minAge: 13,
                      maxAge: 80
                    });
                  }}
                  className="text-violet-600 hover:underline mt-2"
                >
                  Limpar filtros
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Chat */}
      <AnimatePresence>
        {activeChat && user && (
          <Chat
            user={activeChat}
            currentUserId={user.id}
            onClose={() => {
              setActiveChat(null);
              if (currentConversationId) {
                socket.leaveConversation(currentConversationId);
              }
              setCurrentConversationId(null);
            }}
            onStartCall={handleStartCall}
            messages={currentMessages}
            onSendMessage={handleSendMessage}
            isTyping={currentConversationId ? socket.typingUsers[currentConversationId] : false}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onSave={handleProfileSave}
      />

      <FindPartnerModal
        isOpen={isFindPartnerModalOpen}
        onClose={() => setIsFindPartnerModalOpen(false)}
        onSearch={handleFindPartner}
      />

      <CallModal
        isOpen={isCallModalOpen}
        isCalling={webRTC.callState.isCalling}
        isReceiving={webRTC.callState.isReceiving}
        isInCall={webRTC.callState.isInCall}
        callerName={webRTC.callState.callerName}
        receiverName={webRTC.callState.receiverName}
        onAccept={() => {
          webRTC.acceptCall();
        }}
        onReject={() => {
          webRTC.rejectCall();
          setIsCallModalOpen(false);
        }}
        onEnd={() => {
          webRTC.endCall();
          setIsCallModalOpen(false);
        }}
        onToggleMute={webRTC.toggleMute}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
