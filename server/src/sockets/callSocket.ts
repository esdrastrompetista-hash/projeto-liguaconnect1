import { Server, Socket } from 'socket.io';
import { db } from '../config/database';
import { calls } from '../config/schema';
import { eq } from 'drizzle-orm';

// WebRTC types for server (Node não tem tipos do browser)
type RTCSessionDescriptionInit = {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback';
  sdp?: string;
};

type RTCIceCandidateInit = {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
};
