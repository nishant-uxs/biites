import { WebSocketServer, WebSocket } from 'ws';
import type { Server, IncomingMessage } from 'http';
import type { IStorage } from './storage';

interface AuthenticatedClient {
  ws: WebSocket;
  userId: string;
  role: string;
  outletId?: string;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, AuthenticatedClient> = new Map();
  private storage: IStorage | null = null;
  private sessionParser: any = null;

  initialize(server: Server, storage: IStorage, sessionParser: any) {
    this.storage = storage;
    this.sessionParser = sessionParser;
    
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      verifyClient: async ({ req }, callback) => {
        await this.verifySession(req, callback);
      }
    });

    this.wss.on('connection', async (ws: WebSocket, req: any) => {
      const user = req.user;
      const dbUser = req.dbUser;
      
      if (!user || !dbUser) {
        ws.close(1008, 'Unauthorized');
        return;
      }

      const clientId = `${user.id}-${Date.now()}`;
      const client: AuthenticatedClient = {
        ws,
        userId: user.id,
        role: dbUser.role
      };

      if (dbUser.role === 'outlet_owner') {
        const outlet = await this.storage!.getOutletByOwnerId(dbUser.id);
        if (outlet) {
          client.outletId = outlet.id;
        }
      }

      this.clients.set(clientId, client);
      console.log(`[WebSocket] Client connected: ${user.id} (${dbUser.role}${client.outletId ? `, outlet: ${client.outletId}` : ''})`);

      ws.send(JSON.stringify({ 
        type: 'connected',
        userId: user.id,
        role: dbUser.role,
        outletId: client.outletId
      }));

      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      }, 30000);

      ws.on('pong', () => {
        console.log(`[WebSocket] Pong from ${clientId}`);
      });

      ws.on('close', () => {
        clearInterval(heartbeat);
        this.clients.delete(clientId);
        console.log(`[WebSocket] Client disconnected: ${clientId}`);
      });

      ws.on('error', (error) => {
        console.error(`[WebSocket] Error for client ${clientId}:`, error);
        clearInterval(heartbeat);
      });
    });

    console.log('[WebSocket] Server initialized with session-based auth');
  }

  private verifySession(req: IncomingMessage, callback: (result: boolean, code?: number, message?: string) => void) {
    this.sessionParser(req, {}, () => {
      const session = (req as any).session;
      if (!session || !session.passport || !session.passport.user) {
        callback(false, 401, 'Unauthorized');
        return;
      }

      (req as any).user = session.passport.user;
      (req as any).dbUser = session.passport.user;
      callback(true);
    });
  }

  notifyNewOrder(outletId: string, order: any) {
    let notified = 0;
    
    for (const [clientId, client] of this.clients.entries()) {
      if (
        client.role === 'outlet_owner' && 
        client.outletId === outletId &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        client.ws.send(JSON.stringify({
          type: 'new_order',
          order
        }));
        notified++;
      }
    }
    
    console.log(`[WebSocket] Notified ${notified} outlet owner(s) about new order for outlet ${outletId}`);
  }

  notifyOrderStatusUpdate(userId: string, orderId: string, status: string) {
    for (const [clientId, client] of this.clients.entries()) {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: 'order_status_update',
          orderId,
          status
        }));
        console.log(`[WebSocket] Notified user ${userId} about order ${orderId} status: ${status}`);
      }
    }
  }
}

export const wsService = new WebSocketService();
