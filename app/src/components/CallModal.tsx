import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CallModalProps {
  isOpen: boolean;
  isCalling: boolean;
  isReceiving: boolean;
  isInCall: boolean;
  callerName?: string;
  receiverName?: string;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
}

export function CallModal({
  isOpen,
  isCalling,
  isReceiving,
  isInCall,
  callerName,
  receiverName,
  onAccept,
  onReject,
  onEnd,
  onToggleMute
}: CallModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isInCall]);

  useEffect(() => {
    if (!isOpen) {
      setCallDuration(0);
      setIsMuted(false);
    }
  }, [isOpen]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    onToggleMute();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-b from-violet-900 to-purple-900 rounded-3xl p-8 w-full max-w-md mx-4 text-center"
        >
          {/* Avatar */}
          <div className="relative mb-6">
            <motion.div
              animate={isCalling ? {
                scale: [1, 1.1, 1],
                opacity: [1, 0.8, 1]
              } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center"
            >
              <span className="text-3xl font-bold text-white">
                {getInitials(isCalling ? receiverName : callerName)}
              </span>
            </motion.div>

            {/* Ripple effect when calling */}
            {isCalling && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.3, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-violet-500/30"
                />
                <motion.div
                  animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.3, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                  className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-violet-500/30"
                />
              </>
            )}
          </div>

          {/* Name */}
          <h2 className="text-2xl font-bold text-white mb-2">
            {isCalling ? receiverName : callerName}
          </h2>

          {/* Status */}
          <p className="text-violet-200 mb-8">
            {isInCall ? formatDuration(callDuration) :
             isCalling ? 'Chamando...' : 
             isReceiving ? 'Está te ligando...' : 
             'Conectando...'}
          </p>

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-6">
            {isInCall && (
              <Button
                variant="outline"
                size="icon"
                className={`w-14 h-14 rounded-full border-0 ${
                  isMuted 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                onClick={handleToggleMute}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>
            )}

            {/* Accept / End Call */}
            {isReceiving ? (
              <>
                <Button
                  size="icon"
                  className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={onAccept}
                >
                  <Phone className="w-8 h-8" />
                </Button>
                <Button
                  size="icon"
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white"
                  onClick={onReject}
                >
                  <PhoneOff className="w-8 h-8" />
                </Button>
              </>
            ) : (
              <Button
                size="icon"
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white"
                onClick={isInCall ? onEnd : onReject}
              >
                <PhoneOff className="w-8 h-8" />
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
