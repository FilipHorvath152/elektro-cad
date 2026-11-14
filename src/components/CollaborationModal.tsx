import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Users,
  Copy,
  Check,
  QrCode,
  Laptop,
  Tablet,
  Smartphone,
  Download,
  Upload,
  X,
  Share2,
  Wifi,
  Sparkles,
  Shield,
  HardHat,
  Eye,
  FileCode,
} from 'lucide-react';
import { CollaboratorUser, UserRole, collabManager } from '../services/collaborationService';
import { ProjectData } from '../types/cad';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoomId: string;
  onJoinRoom: (newRoomId: string) => void;
  collaborators: CollaboratorUser[];
  projectData: ProjectData;
  onImportProject: (imported: ProjectData) => void;
}

export const CollaborationModal: React.FC<CollaborationModalProps> = ({
  isOpen,
  onClose,
  currentRoomId,
  onJoinRoom,
  collaborators,
  projectData,
  onImportProject,
}) => {
  const [copied, setCopied] = useState(false);
  const [inputRoomId, setInputRoomId] = useState(currentRoomId);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [userName, setUserName] = useState<string>(() => collabManager.getCurrentUser().name);
  const [userRole, setUserRole] = useState<UserRole>(() => collabManager.getCurrentUser().role);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${currentRoomId}`
    : `https://elektro-cad.vercel.app/?room=${currentRoomId}`;

  // Generate QR Code
  useEffect(() => {
    if (shareUrl) {
      QRCode.toDataURL(shareUrl, {
        width: 220,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR:', err));
    }
  }, [shareUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleSaveProfile = () => {
    collabManager.setCurrentUser({
      name: userName.trim() || 'Projektant',
      role: userRole,
    });
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(projectData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${projectData.name || 'elektro-projekt'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.floors) {
          onImportProject(json);
          onClose();
        } else {
          alert('Neplatný formát projektu Elektro CAD.');
        }
      } catch (err) {
        alert('Chyba pri čítaní súboru JSON.');
      }
    };
    reader.readAsText(file);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'Projektant':
        return <FileCode className="w-3.5 h-3.5 text-sky-400" />;
      case 'Revízny technik':
        return <Shield className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Elektromontér':
        return <HardHat className="w-3.5 h-3.5 text-amber-400" />;
      case 'Investor':
        return <Users className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Eye className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getDeviceIcon = (device: 'desktop' | 'tablet' | 'mobile') => {
    switch (device) {
      case 'tablet':
        return <Tablet className="w-3.5 h-3.5 text-purple-400" />;
      case 'mobile':
        return <Smartphone className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Laptop className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-sky-950/40 text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/25">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Spolupráca na projekte v reálnom čase
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  P2P WebRTC Live
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pracujte viacerí na jednom pôdoryse z počítača, tabletu aj mobilu na stavbe.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-6">
          {/* 1. Share URL & QR Code Card */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            {/* QR Code */}
            <div className="md:col-span-2 flex flex-col items-center justify-center gap-2 bg-white p-3 rounded-lg shadow-md text-slate-900">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR kód projektu" className="w-36 h-36 rounded" />
              ) : (
                <div className="w-36 h-36 bg-slate-200 animate-pulse rounded flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-slate-400" />
                </div>
              )}
              <span className="text-[11px] font-bold text-slate-700 text-center flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                Naskenujte mobilom / tabletom
              </span>
            </div>

            {/* Direct Link & Room Switcher */}
            <div className="md:col-span-3 flex flex-col justify-between gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Priamy odkaz pre kolegov
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono outline-none select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap shadow-sm ${
                      copied
                        ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                        : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Skopírované' : 'Kopírovať'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Po otvorení odkazu sa zariadenie okamžite pripojí k Vášmu plánu a synchronizuje zmeny.
                </p>
              </div>

              {/* Room ID switcher */}
              <div className="pt-2 border-t border-slate-800/80">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Kód miestnosti (Room ID)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputRoomId}
                    onChange={(e) => setInputRoomId(e.target.value)}
                    placeholder="napr. projekt-byt-1"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono outline-none focus:border-sky-500"
                  />
                  <button
                    onClick={() => {
                      if (inputRoomId.trim()) {
                        onJoinRoom(inputRoomId.trim());
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition whitespace-nowrap border border-slate-700"
                  >
                    Prepnúť miestnosť
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. My Profile in Team */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Môj profil a rola v tíme
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Moje meno / prezývka</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onBlur={handleSaveProfile}
                  placeholder="napr. Ing. Peter Kováč"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Moja rola v projekte</label>
                <select
                  value={userRole}
                  onChange={(e) => {
                    const r = e.target.value as UserRole;
                    setUserRole(r);
                    collabManager.setCurrentUser({ role: r });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-sky-500"
                >
                  <option value="Projektant">Projektant (CAD/BIM špecialista)</option>
                  <option value="Revízny technik">Revízny technik (Kontrola STN)</option>
                  <option value="Elektromontér">Elektromontér (Realizácia na stavbe)</option>
                  <option value="Investor">Investor / Klient</option>
                  <option value="Pozorovateľ">Pozorovateľ (Náhľad)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Connected Collaborators List */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                Pripojené zariadenia a kolegovia ({collaborators.length})
              </h3>
              <span className="text-[10px] text-slate-400">P2P Šifrované</span>
            </div>

            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800/80"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        {c.name}
                        {c.isSelf && (
                          <span className="text-[9px] bg-sky-950 text-sky-400 px-1.5 py-0.2 rounded font-semibold border border-sky-800/50">
                            Vy
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        {getRoleIcon(c.role)}
                        <span>{c.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                      {getDeviceIcon(c.deviceType)}
                      <span className="capitalize">{c.deviceType}</span>
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Aktívny" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Offline File Sharing (Export / Import JSON) */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              Súborové zálohovanie a zdieľanie
            </h3>
            <p className="text-[11px] text-slate-400">
              Pre prácu bez internetu si môžete celý projekt stiahnuť do súboru alebo ho nahrať na iné zariadenie.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleExportJson}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                Stiahnuť zálohu (.json)
              </button>
              <label className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition border border-slate-700 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                Nahrať projekt zo súboru
                <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Priame P2P spojenie bez ukladania na cudzí server (WebRTC DataChannel).
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            Zavrieť
          </button>
        </div>
      </div>
    </div>
  );
};
