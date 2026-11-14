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
  Globe,
  ExternalLink,
  CheckCircle2,
  Layers,
  Zap,
  Info,
} from 'lucide-react';
import {
  CollaboratorUser,
  UserRole,
  collabManager,
  generateProjectShareUrl,
} from '../services/collaborationService';
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

type TabType = 'project_link' | 'live_collab' | 'vercel' | 'backup';

export const CollaborationModal: React.FC<CollaborationModalProps> = ({
  isOpen,
  onClose,
  currentRoomId,
  onJoinRoom,
  collaborators,
  projectData,
  onImportProject,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('project_link');
  const [copiedProjectLink, setCopiedProjectLink] = useState(false);
  const [copiedRoomLink, setCopiedRoomLink] = useState(false);
  const [inputRoomId, setInputRoomId] = useState(currentRoomId);
  const [userName, setUserName] = useState<string>(() => collabManager.getCurrentUser().name);
  const [userRole, setUserRole] = useState<UserRole>(() => collabManager.getCurrentUser().role);

  const [projectShareUrl, setProjectShareUrl] = useState<string>('');
  const [projectQrDataUrl, setProjectQrDataUrl] = useState<string>('');
  const [roomQrDataUrl, setRoomQrDataUrl] = useState<string>('');
  const [includeRoomSync, setIncludeRoomSync] = useState(true);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    rawBytes: number;
    compressedBytes: number;
    ratio: number;
  } | null>(null);

  // Pure room URL (P2P live room without initial project payload)
  const roomOnlyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${currentRoomId}`
    : `https://elektro-cad.vercel.app/?room=${currentRoomId}`;

  // Generate Compressed Project URL & QR Code
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsCompressing(true);

    const generateUrl = async () => {
      try {
        const rawJson = JSON.stringify(projectData);
        const rawBytes = new Blob([rawJson]).size;

        const url = await generateProjectShareUrl(
          projectData,
          includeRoomSync ? currentRoomId : undefined
        );

        if (!isMounted) return;
        setProjectShareUrl(url);

        const compressedBytes = url.length;
        const ratio = rawBytes > 0 ? Math.max(0, Math.round((1 - compressedBytes / rawBytes) * 100)) : 0;
        setCompressionStats({ rawBytes, compressedBytes, ratio });

        const qr = await QRCode.toDataURL(url, {
          width: 240,
          margin: 1.5,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        if (isMounted) setProjectQrDataUrl(qr);
      } catch (err) {
        console.error('Chyba pri generovaní zdieľacieho odkazu projektu:', err);
      } finally {
        if (isMounted) setIsCompressing(false);
      }
    };

    generateUrl();

    return () => {
      isMounted = false;
    };
  }, [isOpen, projectData, currentRoomId, includeRoomSync]);

  // Generate Room-only QR code
  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(roomOnlyUrl, {
      width: 220,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((qr) => setRoomQrDataUrl(qr))
      .catch((err) => console.error('Failed to generate room QR:', err));
  }, [isOpen, roomOnlyUrl]);

  if (!isOpen) return null;

  const handleCopyProjectLink = () => {
    if (projectShareUrl && navigator.clipboard) {
      navigator.clipboard.writeText(projectShareUrl);
      setCopiedProjectLink(true);
      setTimeout(() => setCopiedProjectLink(false), 2200);
    }
  };

  const handleCopyRoomLink = () => {
    if (roomOnlyUrl && navigator.clipboard) {
      navigator.clipboard.writeText(roomOnlyUrl);
      setCopiedRoomLink(true);
      setTimeout(() => setCopiedRoomLink(false), 2200);
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

  const totalWalls = projectData.floors.reduce((acc, f) => acc + f.walls.length, 0);
  const totalComponents = projectData.floors.reduce((acc, f) => acc + f.components.length, 0);
  const totalSwitchboards = projectData.floors.reduce((acc, f) => acc + f.switchboards.length, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl shadow-sky-950/40 text-slate-100 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/25">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Zdieľanie & Prístup pre kolegov
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Vercel & P2P Live
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Otvorte rozpracovaný projekt kolegovi na akomkoľvek počítači, mobile či tablete cez web.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center px-5 pt-3 border-b border-slate-800 bg-slate-950/30 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('project_link')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'project_link'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Odkaz s projektom (pre kolegu)
          </button>

          <button
            onClick={() => setActiveTab('live_collab')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'live_collab'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            Živá spolupráca ({collaborators.length})
          </button>

          <button
            onClick={() => setActiveTab('vercel')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'vercel'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            🚀 Vercel Integrácia
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'backup'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Záloha (.json)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 flex flex-col gap-5 overflow-y-auto">
          {/* TAB 1: ODKAZ S ROZPRACOVANÝM PROJEKTOM */}
          {activeTab === 'project_link' && (
            <div className="flex flex-col gap-4">
              <div className="bg-sky-950/30 border border-sky-800/50 p-4 rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-sky-300 text-sm mb-1">
                    Okamžitý prístup k rozpracovanému projektu bez inštalácie
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Tento odkaz nesie v sebe celý aktuálny stav Vášho pôdorysu (steny, zóny, zásuvky, vypínače, svetlá,
                    rozvádzač a káble). Kolega z iného zariadenia (mobil, tablet, notebook na stavbe) si ho iba otvorí
                    a projekt sa mu ihneď načíta.
                  </p>
                </div>
              </div>

              {/* Main Share Card: QR + Link */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                {/* QR Code */}
                <div className="md:col-span-2 flex flex-col items-center justify-center gap-2 bg-white p-3 rounded-xl shadow-md text-slate-900">
                  {projectQrDataUrl ? (
                    <img src={projectQrDataUrl} alt="QR kód s rozpracovaným projektom" className="w-44 h-44 rounded" />
                  ) : (
                    <div className="w-44 h-44 bg-slate-200 animate-pulse rounded flex items-center justify-center">
                      <QrCode className="w-10 h-10 text-slate-400" />
                    </div>
                  )}
                  <div className="text-[11px] font-bold text-slate-800 text-center flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                    Naskenujte mobilom / tabletom
                  </div>
                </div>

                {/* Direct Link & Options */}
                <div className="md:col-span-3 flex flex-col justify-between gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Odkaz na rozpracovaný projekt
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={projectShareUrl}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-200 font-mono outline-none select-all truncate"
                      />
                      <button
                        onClick={handleCopyProjectLink}
                        disabled={isCompressing || !projectShareUrl}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap shadow-md cursor-pointer ${
                          copiedProjectLink
                            ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                            : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20 active:scale-95'
                        }`}
                      >
                        {copiedProjectLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedProjectLink ? 'Skopírované!' : 'Kopírovať odkaz'}
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeRoomSync}
                          onChange={(e) => setIncludeRoomSync(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 cursor-pointer"
                        />
                        <span>Zahrnúť aj kód miestnosti ({currentRoomId}) pre živú P2P synchronizáciu</span>
                      </label>
                    </div>
                  </div>

                  {/* Project metadata pills */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap gap-2 text-[11px]">
                    <span className="px-2 py-1 rounded-md bg-slate-800/80 text-slate-300 font-medium">
                      Pôdorys: <strong className="text-white">{projectData.name}</strong>
                    </span>
                    <span className="px-2 py-1 rounded-md bg-slate-800/80 text-slate-300 font-medium">
                      Steny: <strong className="text-white">{totalWalls}</strong>
                    </span>
                    <span className="px-2 py-1 rounded-md bg-slate-800/80 text-slate-300 font-medium">
                      Komponenty: <strong className="text-white">{totalComponents}</strong>
                    </span>
                    <span className="px-2 py-1 rounded-md bg-slate-800/80 text-slate-300 font-medium">
                      Rozvádzače: <strong className="text-white">{totalSwitchboards}</strong>
                    </span>
                    {compressionStats && (
                      <span className="px-2 py-1 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-mono">
                        GZIP kompresia: -{compressionStats.ratio}% ({(compressionStats.compressedBytes / 1024).toFixed(1)} kB)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ŽIVÁ SPOLUPRÁCA (WebRTC P2P) */}
          {activeTab === 'live_collab' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="md:col-span-2 flex flex-col items-center justify-center gap-2 bg-white p-3 rounded-xl shadow-md text-slate-900">
                  {roomQrDataUrl ? (
                    <img src={roomQrDataUrl} alt="QR kód miestnosti" className="w-36 h-36 rounded" />
                  ) : (
                    <div className="w-36 h-36 bg-slate-200 animate-pulse rounded flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  <span className="text-[11px] font-bold text-slate-700 text-center flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                    Pripojiť sa do miestnosti
                  </span>
                </div>

                <div className="md:col-span-3 flex flex-col justify-between gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Odkaz na živú miestnosť
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={roomOnlyUrl}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono outline-none select-all"
                      />
                      <button
                        onClick={handleCopyRoomLink}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap shadow-sm cursor-pointer ${
                          copiedRoomLink
                            ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                            : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20 active:scale-95'
                        }`}
                      >
                        {copiedRoomLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedRoomLink ? 'Skopírované' : 'Kopírovať'}
                      </button>
                    </div>
                  </div>

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
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition whitespace-nowrap border border-slate-700 cursor-pointer"
                      >
                        Prepnúť
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* My Profile */}
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
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-sky-500 cursor-pointer"
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

              {/* Connected Collaborators */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    Pripojené zariadenia a kolegovia ({collaborators.length})
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">P2P WebRTC Šifrované</span>
                </div>

                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
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
            </div>
          )}

          {/* TAB 3: VERCEL INTEGRÁCIA */}
          {activeTab === 'vercel' && (
            <div className="flex flex-col gap-4">
              {/* Vercel Status Hero */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 rounded-xl border border-sky-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-black border border-slate-700 flex items-center justify-center text-white shadow-xl shrink-0">
                    <svg viewBox="0 0 1155 1000" className="w-6 h-6 fill-white">
                      <path d="m577.3 0 577.4 1000H0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Vercel Edge Cloud Deployment
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Pripravené na produkciu
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      Globálny cloud hosting optimalizovaný pre Vite SPA a okamžitý prístup kolegov z celého sveta.
                    </p>
                  </div>
                </div>

                <a
                  href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FFilipHorvath152%2Felektro-cad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-white/10 shrink-0 cursor-pointer active:scale-95"
                >
                  <span>Nasadiť na Vercel (1-Click)</span>
                  <ExternalLink className="w-4 h-4 text-slate-700" />
                </a>
              </div>

              {/* 3 Steps Guide for Colleagues */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                    <div className="w-6 h-6 rounded-full bg-sky-950 text-sky-400 border border-sky-700/50 flex items-center justify-center font-mono">
                      1
                    </div>
                    Git Push do Main
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Každá zmena pushnutá na GitHub do repozitára <code className="text-sky-300">FilipHorvath152/elektro-cad</code> automaticky spustí build a nasadenie na Verceli za cca 20-30 sekúnd.
                  </p>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <div className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/50 flex items-center justify-center font-mono">
                      2
                    </div>
                    Kolega otvorí URL
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Kolega získa webovú adresu (napr. <code className="text-emerald-300">elektro-cad.vercel.app</code>) a otvorí ju v akomkoľvek prehliadači na PC, iPhone, iPade či Androide bez inštalácie.
                  </p>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                    <div className="w-6 h-6 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-700/50 flex items-center justify-center font-mono">
                      3
                    </div>
                    Zdieľanie projektu
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Pošlete mu odkaz vygenerovaný na záložke <strong>"Odkaz s projektom"</strong> a kolegovi sa v aplikácii ihneď otvorí Váš rozpracovaný plán stien a káblov!
                  </p>
                </div>
              </div>

              {/* Vercel Configuration Specs */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Konfigurácia Vercel integrácie v repozitári (vercel.json)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Framework</div>
                    <div className="font-bold text-slate-200 mt-0.5">Vite SPA</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Build Command</div>
                    <div className="font-bold text-slate-200 mt-0.5 font-mono">npm run build</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Output Directory</div>
                    <div className="font-bold text-slate-200 mt-0.5 font-mono">dist/</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">SPA Rewrites</div>
                    <div className="font-bold text-emerald-400 mt-0.5">/* ➔ /index.html</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ZÁLOHOVANIE SÚBOROM */}
          {activeTab === 'backup' && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Share2 className="w-3.5 h-3.5 text-sky-400" />
                  Súborové zálohovanie a zdieľanie (.json)
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Pre prácu bez pripojenia na internet si môžete celý projekt stiahnuť do súboru alebo ho nahrať
                  na iné zariadenie (USB kľúč, email, firemné úložisko).
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={handleExportJson}
                    className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition border border-slate-700 cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4 text-sky-400" />
                    Stiahnuť zálohu projektu (.json)
                  </button>
                  <label className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition border border-slate-700 cursor-pointer active:scale-95">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    Nahrať projekt zo súboru
                    <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Vercel Edge CDN & WebRTC DataChannel (kryptograficky bezpečné spojenie)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Zavrieť
          </button>
        </div>
      </div>
    </div>
  );
};
