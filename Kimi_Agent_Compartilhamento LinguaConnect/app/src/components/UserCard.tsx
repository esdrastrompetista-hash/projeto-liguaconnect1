import type { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, User, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserCardProps {
  user: UserProfile;
  onStartChat: (user: UserProfile) => void;
  index?: number;
}

export function UserCard({ user, onStartChat, index = 0 }: UserCardProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'nativo':
        return 'bg-slate-800 text-white';
      case 'iniciante':
        return 'bg-emerald-100 text-emerald-700';
      case 'intermediário':
        return 'bg-amber-100 text-amber-700';
      case 'avançado':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
        {/* Header with gradient */}
        <div className="h-24 bg-gradient-to-r from-violet-500 to-fuchsia-400 relative">
          {/* Avatar */}
          <div className="absolute -bottom-8 left-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-white text-xl font-semibold border-4 border-white">
                {getInitials(user.name)}
              </div>
              {user.isOnline && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-10 pb-4 px-4">
          {/* Name and Info */}
          <h3 className="font-semibold text-lg text-slate-900">{user.name}</h3>
          <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {user.age} anos
            </span>
            {user.gender && (
              <span>• {user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
            <MapPin className="w-3 h-3" />
            {user.country}
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-sm text-slate-600 mt-2 line-clamp-2">{user.bio}</p>
          )}

          {/* Native Language */}
          <div className="mt-3">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Idioma Nativo</p>
            <Badge className={`${getLevelColor('Nativo')} border-0`}>
              {user.nativeLanguage} • Nativo
            </Badge>
          </div>

          {/* Learning Languages */}
          <div className="mt-2">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Aprendendo</p>
            <div className="flex flex-wrap gap-1">
              {user.learningLanguages.map((lang, idx) => (
                <Badge key={idx} className={`${getLevelColor(lang.level)} border-0`}>
                  {lang.language} • {lang.level}
                </Badge>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <Button 
            className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white"
            onClick={() => onStartChat(user)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Iniciar Conversa
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
