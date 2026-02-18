import { useState, useCallback, useEffect, useRef } from 'react';
import { webrtcService } from '@/services/webrtc';
import { socketService } from '@/services/socket';

interface CallState {
  isCalling: boolean;
  isReceiving: boolean;
  isInCall: boolean;
  callId: string | null;
  callerId?: string;
  callerName?: string;
  receiverId?: string;
  receiverName?: string;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  isMuted: boolean;
  callDuration: number;
}

export function useWebRTC(_socket: unknown, userId: string | undefined) {
  const [callState, setCallState] = useState<CallState>({
    isCalling: false,
    isReceiving: false,
    isInCall: false,
    callId: null,
    isMuted: false,
    callDuration: 0,
  });
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Setup WebRTC callbacks
    webrtcService.setCallbacks({
      onStream: (stream) => {
        setCallState((prev) => ({ ...prev, localStream: stream }));
      },
      onRemoteStream: (stream) => {
        setCallState((prev) => ({ ...prev, remoteStream: stream, isInCall: true }));
        // Start call duration timer
        durationIntervalRef.current = setInterval(() => {
          setCallState((prev) => ({ ...prev, callDuration: prev.callDuration + 1 }));
        }, 1000);
      },
      onCallEnded: () => {
        resetCallState();
      },
      onError: (error) => {
        console.error('WebRTC error:', error);
        resetCallState();
      },
    });

    // Listen for incoming calls
    const socket = (socketService as unknown as { socket: { on: (event: string, callback: (data: unknown) => void) => void } }).socket;
    if (socket) {
      socket.on('incoming_call', (data: unknown) => {
        const callData = data as { callId: string; callerId: string; callerName: string };
        setCallState((prev) => ({
          ...prev,
          isReceiving: true,
          callId: callData.callId,
          callerId: callData.callerId,
          callerName: callData.callerName,
        }));
      });

      socket.on('call_initiated', (data: unknown) => {
        const callData = data as { callId: string; receiverId: string };
        setCallState((prev) => ({
          ...prev,
          isCalling: true,
          callId: callData.callId,
          receiverId: callData.receiverId,
        }));
      });

      socket.on('call_accepted', (data: unknown) => {
        const callData = data as { callId: string };
        setCallState((prev) => ({
          ...prev,
          isCalling: false,
          isInCall: true,
          callId: callData.callId,
        }));
      });

      socket.on('call_rejected', () => {
        resetCallState();
      });

      socket.on('call_ended', () => {
        resetCallState();
      });
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [userId]);

  const resetCallState = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setCallState({
      isCalling: false,
      isReceiving: false,
      isInCall: false,
      callId: null,
      isMuted: false,
      callDuration: 0,
    });
  };

  const startCall = useCallback(async (receiverId: string, receiverName: string) => {
    try {
      setCallState((prev) => ({ ...prev, receiverId, receiverName }));
      await webrtcService.startCall(receiverId, receiverName);
    } catch (error) {
      console.error('Error starting call:', error);
      resetCallState();
    }
  }, []);

  const acceptCall = useCallback(async () => {
    try {
      const callId = webrtcService.getCurrentCallId();
      if (callId) {
        await webrtcService.acceptCall(callId);
      }
    } catch (error) {
      console.error('Error accepting call:', error);
      resetCallState();
    }
  }, []);

  const rejectCall = useCallback(() => {
    const callId = webrtcService.getCurrentCallId();
    if (callId) {
      webrtcService.rejectCall(callId);
    }
    resetCallState();
  }, []);

  const endCall = useCallback(() => {
    webrtcService.endCall();
    resetCallState();
  }, []);

  const toggleMute = useCallback(() => {
    const isMuted = webrtcService.toggleMute();
    setCallState((prev) => ({ ...prev, isMuted }));
  }, []);

  return {
    callState,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
  };
}
