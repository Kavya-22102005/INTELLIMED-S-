import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PageId } from '../../types';
import {
  LayoutDashboard,
  Pill,
  Camera,
  Hand,
  Sparkles,
  TrendingUp,
  Settings,
  FileText,
  Menu,
  X,
  Package,
  AlertOctagon,
  Activity,
  Heart,
} from 'lucide-react';

export const MobileBottomDock: React.FC = () => {
  const { activePage, setActivePage } = useApp();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const primaryItems: { id: PageId; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'medications', label: 'Meds', icon: <Pill className="w-5 h-5" /> },
    { id: 'scanner', label: 'Scan', icon: <Camera className="w-5 h-5" /> },
    { id: 'gestures', label: 'Gestures', icon: <Hand className="w-5 h-5" /> },
  ];

  const moreItems: { id: PageId; label: string; description: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'assistant',
      label: 'AI Health Assistant',
      description: 'Voice diagnostic chat, symptom guidance, and advice',
      icon: <Sparkles className="w-5 h-5 text-pink-400" />,
      color: 'border-pink-500/30 bg-pink-500/10',
    },
    {
      id: 'ocr',
      label: 'Prescription & Label OCR',
      description: 'Extract bottle packaging, Rx text, and expiration dates',
      icon: <FileText className="w-5 h-5 text-cyan-400" />,
      color: 'border-cyan-500/30 bg-cyan-500/10',
    },
    {
      id: 'reports',
      label: 'Reports & Adherence',
      description: 'Longitudinal clinical metrics, exportable CSV ledger',
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/30 bg-emerald-500/10',
    },
    {
      id: 'settings',
      label: 'System & Caregiver Portal',
      description: 'Patient directory, full clinical CRUD, and security',
      icon: <Settings className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/30 bg-purple-500/10',
    },
  ];

  const isMoreActive = ['assistant', 'ocr', 'reports', 'settings'].includes(activePage);

  return (
    <>
      {/* Slide-up More Navigation Sheet */}
      {isMoreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-150">
          <div
            className="bg-[#0B1220] border-t border-[#1E2D4A] rounded-t-3xl p-5 shadow-2xl max-h-[80vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2D4A]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-cyan-400">
                  <Menu className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">All Application Services</h3>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-[#172338] border border-[#1E2D4A] transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {moreItems.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActivePage(item.id);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                      isActive
                        ? 'bg-[#172338] border-cyan-400 ring-1 ring-cyan-400/40'
                        : 'bg-[#111B2D] border-[#1E2D4A] hover:border-slate-500'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl border ${item.color} shrink-0`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 leading-snug line-clamp-1">
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B1220]/95 backdrop-blur-xl border-t border-[#1E2D4A] px-2 py-1.5 shadow-2xl safe-area-pb">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {primaryItems.map((item) => {
            const isActive = activePage === item.id;
            const isScanner = item.id === 'scanner';

            if (isScanner) {
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className="relative -top-3 flex flex-col items-center group cursor-pointer"
                  aria-label="Scan AI"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 ring-4 ring-cyan-500/30 scale-105'
                        : 'bg-blue-600 hover:bg-blue-500 ring-2 ring-[#0B1220]'
                    }`}
                  >
                    <Camera className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-[10px] font-bold mt-0.5 ${
                      isActive ? 'text-cyan-400' : 'text-slate-400'
                    }`}
                  >
                    Scan AI
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`flex-1 py-1 flex flex-col items-center justify-center rounded-xl transition-colors cursor-pointer min-h-[46px] ${
                  isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-label={item.label}
              >
                <div className="relative">
                  {item.icon}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1 font-medium ${
                    isActive ? 'font-bold text-white' : ''
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More Menu Button */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex-1 py-1 flex flex-col items-center justify-center rounded-xl transition-colors cursor-pointer min-h-[46px] ${
              isMoreActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="More navigation options"
          >
            <div className="relative">
              <Menu className="w-5 h-5" />
              {isMoreActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              )}
            </div>
            <span
              className={`text-[10px] mt-1 font-medium ${
                isMoreActive ? 'font-bold text-white' : ''
              }`}
            >
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};

