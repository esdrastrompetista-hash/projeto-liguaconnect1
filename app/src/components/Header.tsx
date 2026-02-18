import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Globe, User, LogOut, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  onFindPartner: () => void;
  onEditProfile: () => void;
}

export function Header({ onFindPartner, onEditProfile }: HeaderProps) {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold">LinguaConnect</h1>
          </motion.div>

          {/* Description - Desktop */}
          <motion.p 
            className="hidden lg:block text-white/80 text-sm max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Conecte-se com pessoas do mundo todo e pratique idiomas através de conversas reais por texto e áudio.
          </motion.p>

          {/* Actions */}
          {isAuthenticated && (
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Button
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={onFindPartner}
              >
                <Globe className="w-4 h-4 mr-2" />
                Encontrar Parceiro
              </Button>
              <Button
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={onEditProfile}
              >
                <User className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
              <Button
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </motion.div>
          )}
        </div>

        {/* User Info */}
        {isAuthenticated && user && (
          <motion.div 
            className="flex items-center gap-4 mt-4 pt-4 border-t border-white/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="text-sm">{user.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Chat em tempo real</span>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
}
