import { Floor, ProjectData } from '../types/cad';
import { joinRoom } from 'trystero';

export type UserRole = 'Projektant' | 'Revízny technik' | 'Elektromontér' | 'Investor' | 'Pozorovateľ';
export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export interface CollaboratorUser {
  id: string;
  name: string;
  role: UserRole;
  deviceType: DeviceType;
  color: string;
  cursor?: { x: number; y: number; floorId: string };
  joinedAt: number;
  isSelf?: boolean;
}

export interface CollabMessage {
  type: 'project_full' | 'project_request' | 'floor_update' | 'user_presence' | 'cursor_move';
  senderId: string;
  timestamp: number;
  project?: ProjectData;
  floor?: Floor;
  user?: CollaboratorUser;
  cursor?: { x: number; y: number; floorId: string };
}

const AVATAR_COLORS = [
  '#0284c7', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
];

export function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  const ua = navigator.userAgent.toLowerCase();
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua) || (isTouch && width >= 768 && width <= 1024)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android/i.test(ua) || width < 768) {
    return 'mobile';
  }
  return 'desktop';
}

export function getDefaultCollaborator(): CollaboratorUser {
  const deviceType = detectDeviceType();
  const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const storedName = typeof localStorage !== 'undefined' ? localStorage.getItem('elektro_cad_user_name') : null;
  const storedRole = typeof localStorage !== 'undefined' ? (localStorage.getItem('elektro_cad_user_role') as UserRole) : null;

  const defaultName = storedName || (
    deviceType === 'mobile'
      ? 'Kolega na stavbe (Mobil)'
      : deviceType === 'tablet'
      ? 'Kolega (Tablet)'
      : 'Projektant (Desktop)'
  );

  return {
    id: `user-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    name: defaultName,
    role: storedRole || (deviceType === 'desktop' ? 'Projektant' : 'Elektromontér'),
    deviceType,
    color: randomColor,
    joinedAt: Date.now(),
    isSelf: true,
  };
}

export class CollaborationManager {
  private room: any = null;
  private roomId: string = '';
  private currentUser: CollaboratorUser;
  private peers: Map<string, CollaboratorUser> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;

  // Actions
  private sendProjectFull: any = null;
  private sendProjectRequest: any = null;
  private sendFloorUpdate: any = null;
  private sendPresence: any = null;
  private sendCursor: any = null;

  // Callbacks
  private onProjectSyncCallback?: (data: ProjectData) => void;
  private onFloorSyncCallback?: (floor: Floor) => void;
  private onPeersChangeCallback?: (peers: CollaboratorUser[]) => void;
  private onRemoteCursorCallback?: (peerId: string, cursor: { x: number; y: number; floorId: string }, peer?: CollaboratorUser) => void;

  constructor(user?: CollaboratorUser) {
    this.currentUser = user || getDefaultCollaborator();
  }

  public getCurrentUser(): CollaboratorUser {
    return this.currentUser;
  }

  public setCurrentUser(updated: Partial<CollaboratorUser>) {
    this.currentUser = { ...this.currentUser, ...updated };
    if (typeof localStorage !== 'undefined') {
      if (this.currentUser.name) localStorage.setItem('elektro_cad_user_name', this.currentUser.name);
      if (this.currentUser.role) localStorage.setItem('elektro_cad_user_role', this.currentUser.role);
    }
    this.broadcastPresence();
  }

  public connect(
    roomId: string,
    callbacks: {
      onProjectSync: (data: ProjectData) => void;
      onFloorSync: (floor: Floor) => void;
      onPeersChange: (peers: CollaboratorUser[]) => void;
      onRemoteCursor: (peerId: string, cursor: { x: number; y: number; floorId: string }, peer?: CollaboratorUser) => void;
      getCurrentProject: () => ProjectData;
    }
  ) {
    this.disconnect();
    this.roomId = roomId.trim().toLowerCase();
    this.onProjectSyncCallback = callbacks.onProjectSync;
    this.onFloorSyncCallback = callbacks.onFloorSync;
    this.onPeersChangeCallback = callbacks.onPeersChange;
    this.onRemoteCursorCallback = callbacks.onRemoteCursor;

    // 1. Local BroadcastChannel for instant same-browser cross-tab sync
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(`elektro_cad_${this.roomId}`);
        this.broadcastChannel.onmessage = (event) => {
          const msg: CollabMessage = event.data;
          if (!msg || msg.senderId === this.currentUser.id) return;
          this.handleIncomingMessage(msg, 'local-tab', callbacks.getCurrentProject);
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported:', err);
      }
    }

    // 2. Global Peer-to-Peer WebRTC room using Trystero
    try {
      this.room = joinRoom({ appId: 'sk.elektrocad.p2p' }, this.roomId);

      // Setup actions
      const fullAction = this.room.makeAction('project_full');
      this.sendProjectFull = fullAction.send;
      fullAction.onReceive((data: ProjectData, peerId: string) => {
        this.handleIncomingMessage({ type: 'project_full', senderId: peerId, timestamp: Date.now(), project: data }, peerId, callbacks.getCurrentProject);
      });

      const reqAction = this.room.makeAction('project_req');
      this.sendProjectRequest = reqAction.send;
      reqAction.onReceive((_req: any, peerId: string) => {
        // Send full project to newly joined peer
        const current = callbacks.getCurrentProject();
        if (current && this.sendProjectFull) {
          this.sendProjectFull(current, peerId);
        }
      });

      const floorAction = this.room.makeAction('floor_upd');
      this.sendFloorUpdate = floorAction.send;
      floorAction.onReceive((floor: Floor, peerId: string) => {
        this.handleIncomingMessage({ type: 'floor_update', senderId: peerId, timestamp: Date.now(), floor }, peerId, callbacks.getCurrentProject);
      });

      const presenceAction = this.room.makeAction('presence');
      this.sendPresence = presenceAction.send;
      presenceAction.onReceive((user: CollaboratorUser, peerId: string) => {
        this.handleIncomingMessage({ type: 'user_presence', senderId: peerId, timestamp: Date.now(), user }, peerId, callbacks.getCurrentProject);
      });

      const cursorAction = this.room.makeAction('cursor');
      this.sendCursor = cursorAction.send;
      cursorAction.onReceive((cursor: { x: number; y: number; floorId: string }, peerId: string) => {
        this.handleIncomingMessage({ type: 'cursor_move', senderId: peerId, timestamp: Date.now(), cursor }, peerId, callbacks.getCurrentProject);
      });

      // Peer events
      this.room.onPeerJoin((peerId: string) => {
        // Announce myself to new peer
        if (this.sendPresence) {
          this.sendPresence(this.currentUser, peerId);
        }
        // Send current project to newly joined peer
        const current = callbacks.getCurrentProject();
        if (current && this.sendProjectFull) {
          this.sendProjectFull(current, peerId);
        }
      });

      this.room.onPeerLeave((peerId: string) => {
        this.peers.delete(peerId);
        this.notifyPeersChange();
      });

      // Announce myself to everyone
      setTimeout(() => {
        this.broadcastPresence();
        if (this.sendProjectRequest) {
          this.sendProjectRequest({ requestId: Date.now() });
        }
      }, 300);

    } catch (err) {
      console.error('Failed to initialize WebRTC room:', err);
    }

    this.notifyPeersChange();
  }

  private handleIncomingMessage(
    msg: CollabMessage,
    peerId: string,
    getCurrentProject: () => ProjectData
  ) {
    switch (msg.type) {
      case 'project_full':
        if (msg.project && this.onProjectSyncCallback) {
          this.onProjectSyncCallback(msg.project);
        }
        break;

      case 'project_request':
        const current = getCurrentProject();
        if (current && this.sendProjectFull) {
          this.sendProjectFull(current, peerId);
        }
        break;

      case 'floor_update':
        if (msg.floor && this.onFloorSyncCallback) {
          this.onFloorSyncCallback(msg.floor);
        }
        break;

      case 'user_presence':
        if (msg.user) {
          this.peers.set(peerId, { ...msg.user, id: peerId, isSelf: false });
          this.notifyPeersChange();
        }
        break;

      case 'cursor_move':
        if (msg.cursor && this.onRemoteCursorCallback) {
          const existingPeer = this.peers.get(peerId);
          if (existingPeer) {
            existingPeer.cursor = msg.cursor;
          }
          this.onRemoteCursorCallback(peerId, msg.cursor, existingPeer);
        }
        break;
    }
  }

  public broadcastProject(project: ProjectData) {
    if (this.sendProjectFull) {
      try {
        this.sendProjectFull(project);
      } catch (e) {
        console.warn('sendProjectFull error:', e);
      }
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'project_full',
        senderId: this.currentUser.id,
        timestamp: Date.now(),
        project,
      });
    }
  }

  public broadcastFloor(floor: Floor) {
    if (this.sendFloorUpdate) {
      try {
        this.sendFloorUpdate(floor);
      } catch (e) {
        console.warn('sendFloorUpdate error:', e);
      }
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'floor_update',
        senderId: this.currentUser.id,
        timestamp: Date.now(),
        floor,
      });
    }
  }

  public broadcastCursor(cursor: { x: number; y: number; floorId: string }) {
    if (this.sendCursor) {
      try {
        this.sendCursor(cursor);
      } catch (e) {
        // ignore fast mousemove errors
      }
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'cursor_move',
        senderId: this.currentUser.id,
        timestamp: Date.now(),
        cursor,
      });
    }
  }

  public broadcastPresence() {
    if (this.sendPresence) {
      try {
        this.sendPresence(this.currentUser);
      } catch (e) {
        console.warn('sendPresence error:', e);
      }
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'user_presence',
        senderId: this.currentUser.id,
        timestamp: Date.now(),
        user: this.currentUser,
      });
    }
    this.notifyPeersChange();
  }

  private notifyPeersChange() {
    if (this.onPeersChangeCallback) {
      const allPeers: CollaboratorUser[] = [
        { ...this.currentUser, isSelf: true },
        ...Array.from(this.peers.values()),
      ];
      this.onPeersChangeCallback(allPeers);
    }
  }

  public disconnect() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    if (this.room) {
      try {
        this.room.leave();
      } catch (e) {}
      this.room = null;
    }
    this.peers.clear();
    this.notifyPeersChange();
  }

  public getConnectedCount(): number {
    return this.peers.size + 1;
  }

  public getRoomId(): string {
    return this.roomId;
  }
}

// Global singleton instance
export const collabManager = new CollaborationManager();

/**
 * Komprimuje celý rozpracovaný projekt pomocou GZIP a kóduje do URL-safe reťazca.
 * Umožňuje kolegovi otvoriť odkaz na mobile, tablete či inom PC bez potreby servera alebo databázy.
 */
export async function compressProjectToUrlHash(project: ProjectData): Promise<string> {
  const jsonStr = JSON.stringify(project);
  const encoder = new TextEncoder();
  const inputData = encoder.encode(jsonStr);

  if (typeof CompressionStream !== 'undefined') {
    const stream = new Blob([inputData]).stream().pipeThrough(new CompressionStream('gzip'));
    const compressedResponse = new Response(stream);
    const buffer = await compressedResponse.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    let binary = '';
    const CHUNK_SIZE = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK_SIZE)));
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } else {
    return encodeURIComponent(jsonStr);
  }
}

/**
 * Dekomprimuje projekt z URL hash (#project=...).
 */
export async function decompressProjectFromUrlHash(hashStr: string): Promise<ProjectData | null> {
  try {
    let clean = hashStr.trim();
    if (clean.startsWith('#project=')) {
      clean = clean.substring('#project='.length);
    } else if (clean.startsWith('project=')) {
      clean = clean.substring('project='.length);
    } else if (clean.startsWith('#')) {
      clean = clean.substring(1);
    }
    if (!clean) return null;

    if (typeof DecompressionStream !== 'undefined') {
      let base64 = clean.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      const decompressedResponse = new Response(stream);
      const text = await decompressedResponse.text();
      return JSON.parse(text) as ProjectData;
    } else {
      const text = decodeURIComponent(clean);
      return JSON.parse(text) as ProjectData;
    }
  } catch (err) {
    console.error('Failed to decompress project from URL hash:', err);
    return null;
  }
}

/**
 * Vygeneruje kompletný odkaz obsahujúci stav rozpracovaného projektu (a voliteľne kód miestnosti).
 */
export async function generateProjectShareUrl(
  project: ProjectData,
  roomId?: string,
  customBaseUrl?: string
): Promise<string> {
  const hash = await compressProjectToUrlHash(project);
  const baseUrl = customBaseUrl || (typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : 'https://elektro-cad.vercel.app/');
  const roomParam = roomId ? `?room=${encodeURIComponent(roomId)}` : '';
  return `${baseUrl}${roomParam}#project=${hash}`;
}
