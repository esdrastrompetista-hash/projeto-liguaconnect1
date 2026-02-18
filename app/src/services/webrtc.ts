import { socketService } from './socket';

interface CallCallbacks {
  onStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onCallEnded?: () => void;
  onError?: (error: Error) => void;
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentCallId: string | null = null;
  private callbacks: CallCallbacks = {};
  private iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  constructor() {
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    const socket = (socketService as unknown as { socket: { on: (event: string, callback: (data: unknown) => void) => void } }).socket;
    if (!socket) return;

    socket.on('incoming_call', (data: unknown) => {
      const callData = data as { callId: string; callerId: string; callerName: string };
      this.currentCallId = callData.callId;
    });

    socket.on('call_accepted', (data: unknown) => {
      const callData = data as { callId: string };
      if (this.currentCallId === callData.callId && this.peerConnection) {
        // Create and send offer
        this.createAndSendOffer(callData.callId);
      }
    });

    socket.on('webrtc_offer', async (data: unknown) => {
      const offerData = data as { callId: string; offer: RTCSessionDescriptionInit };
      if (!this.peerConnection) {
        await this.createPeerConnection(offerData.callId);
      }

      await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(offerData.offer));
      const answer = await this.peerConnection?.createAnswer();
      await this.peerConnection?.setLocalDescription(answer);

      const s = (socketService as unknown as { socket: { emit: (event: string, data: unknown) => void } }).socket;
      s?.emit('webrtc_answer', { callId: offerData.callId, answer });
    });

    socket.on('webrtc_answer', async (data: unknown) => {
      const answerData = data as { callId: string; answer: RTCSessionDescriptionInit };
      await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(answerData.answer));
    });

    socket.on('webrtc_ice_candidate', async (data: unknown) => {
      const candidateData = data as { callId: string; candidate: RTCIceCandidateInit };
      await this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidateData.candidate));
    });

    socket.on('call_ended', () => {
      this.endCall();
    });

    socket.on('call_rejected', () => {
      this.endCall();
    });
  }

  private async createAndSendOffer(callId: string): Promise<void> {
    const offer = await this.peerConnection?.createOffer();
    await this.peerConnection?.setLocalDescription(offer);

    const socket = (socketService as unknown as { socket: { emit: (event: string, data: unknown) => void } }).socket;
    socket?.emit('webrtc_offer', { callId, offer });
  }

  private async createPeerConnection(callId: string): Promise<void> {
    this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });
    this.currentCallId = callId;

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.callbacks.onRemoteStream?.(this.remoteStream);
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = (socketService as unknown as { socket: { emit: (event: string, data: unknown) => void } }).socket;
        socket?.emit('webrtc_ice_candidate', {
          callId,
          candidate: event.candidate,
        });
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection?.connectionState === 'disconnected' ||
          this.peerConnection?.connectionState === 'failed') {
        this.endCall();
      }
    };
  }

  async startCall(receiverId: string, callerName: string): Promise<void> {
    try {
      // Get local stream
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.callbacks.onStream?.(this.localStream);

      // Create peer connection
      await this.createPeerConnection('');

      // Emit call event
      const socket = (socketService as unknown as { socket: { emit: (event: string, data: unknown) => void } }).socket;
      socket?.emit('call_user', { receiverId, callerName });
    } catch (error) {
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  async acceptCall(callId: string): Promise<void> {
    try {
      // Get local stream
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.callbacks.onStream?.(this.localStream);

      // Create peer connection (non-initiator)
      await this.createPeerConnection(callId);

      // Emit accept event
      const socket = (socketService as unknown as { socket: { emit: (event: string, data: unknown) => void } }).socket;
      socket?.emit('accept_call', { callId });
    } catch (error) {
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  rejectCall(callId: string): void {
    const socket = (socketService as unknown as { socket: { emit: (event: string, data: unknown) => void } }).socket;
    socket?.emit('reject_call', { callId });
    this.endCall();
  }

  endCall(): void {
    if (this.currentCallId) {
      const socket = (socketService as unknown as { socket: { emit: (event: string, data: unknown) => void } }).socket;
      socket?.emit('end_call', { callId: this.currentCallId });
    }

    // Stop all tracks
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.remoteStream?.getTracks().forEach((track) => track.stop());

    // Close peer connection
    this.peerConnection?.close();

    // Reset state
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.currentCallId = null;

    this.callbacks.onCallEnded?.();
  }

  toggleMute(): boolean {
    const audioTrack = this.localStream?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return !audioTrack.enabled;
    }
    return false;
  }

  setCallbacks(callbacks: CallCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getCurrentCallId(): string | null {
    return this.currentCallId;
  }
}

export const webrtcService = new WebRTCService();
