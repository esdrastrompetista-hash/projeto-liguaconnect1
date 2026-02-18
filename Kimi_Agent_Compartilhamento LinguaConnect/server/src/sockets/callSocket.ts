import { Server, Socket } from 'socket.io';
import { db } from '../config/database';
import { calls, users } from '../config/schema';
import { eq } from 'drizzle-orm';

// Mapa de chamadas ativas
const activeCalls = new Map<string, {
  callerId: string;
  receiverId: string;
  callerSocketId: string;
  receiverSocketId?: string;
  status: 'ringing' | 'accepted' | 'rejected' | 'ended';
  startedAt?: Date;
}>();

// Mapa de usuários online (compartilhado com chatSocket)
const onlineUsers = new Map<string, string>();

export const setupCallSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    
    // Registrar usuário online
    socket.on('register_user', (userId: string) => {
      onlineUsers.set(userId, socket.id);
      socket.data.userId = userId;
    });

    // Iniciar chamada
    socket.on('call_user', async (data: {
      receiverId: string;
      callerName: string;
    }) => {
      try {
        const callerId = socket.data.userId;
        if (!callerId) {
          socket.emit('call_error', { error: 'Não autenticado' });
          return;
        }

        const { receiverId, callerName } = data;

        // Verificar se receptor está online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (!receiverSocketId) {
          socket.emit('call_error', { error: 'Usuário offline' });
          return;
        }

        // Criar registro da chamada no banco
        const [callRecord] = await db.insert(calls).values({
          callerId,
          receiverId,
          status: 'ringing',
        }).returning();

        // Registrar chamada ativa
        activeCalls.set(callRecord.id, {
          callerId,
          receiverId,
          callerSocketId: socket.id,
          receiverSocketId,
          status: 'ringing',
        });

        // Notificar receptor
        io.to(receiverSocketId).emit('incoming_call', {
          callId: callRecord.id,
          callerId,
          callerName,
        });

        // Notificar chamador que está chamando
        socket.emit('call_initiated', {
          callId: callRecord.id,
          receiverId,
        });

        console.log(`Call initiated: ${callRecord.id} from ${callerId} to ${receiverId}`);
      } catch (error) {
        console.error('Error initiating call:', error);
        socket.emit('call_error', { error: 'Erro ao iniciar chamada' });
      }
    });

    // Aceitar chamada
    socket.on('accept_call', async (data: { callId: string }) => {
      try {
        const receiverId = socket.data.userId;
        const call = activeCalls.get(data.callId);

        if (!call || call.receiverId !== receiverId) {
          socket.emit('call_error', { error: 'Chamada não encontrada' });
          return;
        }

        // Atualizar status
        call.status = 'accepted';
        call.receiverSocketId = socket.id;
        call.startedAt = new Date();

        // Atualizar no banco
        await db.update(calls)
          .set({ status: 'accepted', startedAt: new Date() })
          .where(eq(calls.id, data.callId));

        // Notificar chamador
        io.to(call.callerSocketId).emit('call_accepted', {
          callId: data.callId,
          receiverId,
        });

        // Notificar receptor
        socket.emit('call_accepted', {
          callId: data.callId,
          callerId: call.callerId,
        });

        console.log(`Call accepted: ${data.callId}`);
      } catch (error) {
        console.error('Error accepting call:', error);
        socket.emit('call_error', { error: 'Erro ao aceitar chamada' });
      }
    });

    // Rejeitar chamada
    socket.on('reject_call', async (data: { callId: string }) => {
      try {
        const userId = socket.data.userId;
        const call = activeCalls.get(data.callId);

        if (!call) return;

        // Atualizar no banco
        await db.update(calls)
          .set({ status: 'rejected', endedAt: new Date() })
          .where(eq(calls.id, data.callId));

        // Notificar chamador
        io.to(call.callerSocketId).emit('call_rejected', {
          callId: data.callId,
          by: userId,
        });

        // Remover chamada ativa
        activeCalls.delete(data.callId);

        console.log(`Call rejected: ${data.callId}`);
      } catch (error) {
        console.error('Error rejecting call:', error);
      }
    });

    // Encerrar chamada
    socket.on('end_call', async (data: { callId: string }) => {
      try {
        const call = activeCalls.get(data.callId);

        if (!call) return;

        // Atualizar no banco
        await db.update(calls)
          .set({ status: 'ended', endedAt: new Date() })
          .where(eq(calls.id, data.callId));

        // Notificar ambos os usuários
        io.to(call.callerSocketId).emit('call_ended', {
          callId: data.callId,
        });

        if (call.receiverSocketId) {
          io.to(call.receiverSocketId).emit('call_ended', {
            callId: data.callId,
          });
        }

        // Remover chamada ativa
        activeCalls.delete(data.callId);

        console.log(`Call ended: ${data.callId}`);
      } catch (error) {
        console.error('Error ending call:', error);
      }
    });

    // WebRTC Signaling - Offer
    socket.on('webrtc_offer', (data: {
      callId: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      const call = activeCalls.get(data.callId);
      if (!call) return;

      const targetSocketId = socket.id === call.callerSocketId 
        ? call.receiverSocketId 
        : call.callerSocketId;

      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc_offer', {
          callId: data.callId,
          offer: data.offer,
        });
      }
    });

    // WebRTC Signaling - Answer
    socket.on('webrtc_answer', (data: {
      callId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      const call = activeCalls.get(data.callId);
      if (!call) return;

      const targetSocketId = socket.id === call.callerSocketId 
        ? call.receiverSocketId 
        : call.callerSocketId;

      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc_answer', {
          callId: data.callId,
          answer: data.answer,
        });
      }
    });

    // WebRTC Signaling - ICE Candidate
    socket.on('webrtc_ice_candidate', (data: {
      callId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const call = activeCalls.get(data.callId);
      if (!call) return;

      const targetSocketId = socket.id === call.callerSocketId 
        ? call.receiverSocketId 
        : call.callerSocketId;

      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc_ice_candidate', {
          callId: data.callId,
          candidate: data.candidate,
        });
      }
    });

    // Desconexão
    socket.on('disconnect', () => {
      const userId = socket.data.userId;
      if (userId) {
        onlineUsers.delete(userId);

        // Encerrar chamadas ativas do usuário
        activeCalls.forEach(async (call, callId) => {
          if (call.callerId === userId || call.receiverId === userId) {
            // Notificar outro usuário
            const otherSocketId = call.callerId === userId 
              ? call.receiverSocketId 
              : call.callerSocketId;

            if (otherSocketId) {
              io.to(otherSocketId).emit('call_ended', { callId });
            }

            // Atualizar no banco
            await db.update(calls)
              .set({ status: 'ended', endedAt: new Date() })
              .where(eq(calls.id, callId));

            activeCalls.delete(callId);
          }
        });
      }
    });
  });
};
