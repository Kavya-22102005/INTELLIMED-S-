import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PageId } from '../../types';
import {
  Activity,
  Bell,
  Search,
  LogOut,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activePage,
    setActivePage,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    logout,
    userName,
    userRole,
    currentUserId,
    switchUserAccount,
    caregivers,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navItems: { id: PageId; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'medications', label: 'Medications' },
    { id: 'scanner', label: 'AI Scanner' },
    { id: 'ocr', label: 'OCR' },
    { id: 'gestures', label: 'Gestures' },
    { id: 'assistant', label: 'Assistant' },
    { id: 'reports', label: 'Reports' },
    { id: 'settings', label: 'Settings' },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B1220]/95 backdrop-blur-md border-b border-[#1E2D4A] px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand identity */}
        <button
          onClick={() => setActivePage('dashboard')}
          className="flex items-center gap-2.5 sm:gap-3 text-left focus:outline-none group cursor-pointer min-w-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-cyan-400 group-hover:bg-blue-600/40 transition-colors shadow-lg shadow-blue-500/10 shrink-0">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5 truncate">
              IntelliMed
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
            </div>
            <div className="text-[9px] sm:text-[10px] font-semibold tracking-widest text-slate-400 uppercase truncate">
              Smart Medicine Monitoring
            </div>
          </div>
        </button>

        {/* Central Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#111B2D]/80 border border-[#1E2D4A] p-1 rounded-xl">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-[#172338]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right tools: Search, Notifications, Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Search */}
          <div className="relative hidden xl:block w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111B2D] border border-[#1E2D4A] text-xs text-white rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
            />
          </div>

          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-[#111B2D] border border-[#1E2D4A] text-slate-300 hover:text-white hover:bg-[#172338] transition-colors cursor-pointer"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#0B1220]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#111B2D] border border-[#1E2D4A] rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-[#1E2D4A]">
                  <h4 className="text-sm font-semibold text-white">Notifications</h4>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="mt-2 divide-y divide-[#1E2D4A] max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`py-2.5 px-1.5 flex items-start gap-2.5 cursor-pointer rounded-lg hover:bg-[#172338] transition-colors ${
                          !n.read ? 'bg-blue-950/20' : ''
                        }`}
                      >
                        <div className="mt-0.5">
                          {n.type === 'reminder' && (
                            <Activity className="w-4 h-4 text-cyan-400" />
                          )}
                          {n.type === 'warning' && (
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                          )}
                          {n.type === 'success' && (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          )}
                          {n.type === 'alert' && (
                            <Info className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-white">{n.title}</p>
                          <p className="text-[11px] text-slate-300 leading-snug">{n.message}</p>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            {n.timestamp}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Account Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#111B2D] border border-[#1E2D4A] hover:border-cyan-500/50 text-slate-200 hover:text-white transition-all cursor-pointer"
              title="Active user session and account switcher"
            >
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] ${
                  userRole === 'Patient'
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                    : 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                }`}
              >
                {userName.charAt(0)}
              </div>
              <div className="hidden lg:flex flex-col text-left leading-none">
                <span className="text-xs font-semibold text-white max-w-[110px] truncate">
                  {userName.split('(')[0].trim()}
                </span>
                <span className="text-[10px] text-cyan-400 font-medium">{userRole}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-[#111B2D] border border-[#1E2D4A] rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="pb-2 border-b border-[#1E2D4A]">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Authenticated Session
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Test two-way messaging between Patient & Caregivers
                  </p>
                </div>

                <div className="mt-2 space-y-1">
                  {/* Option 1: Patient */}
                  <button
                    type="button"
                    onClick={() => {
                      switchUserAccount('patient');
                      setShowUserDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      userRole === 'Patient'
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                        : 'text-slate-300 hover:bg-[#172338]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold text-[10px]">
                        P
                      </div>
                      <div>
                        <div className="font-semibold text-white">Rajesh Kumar</div>
                        <div className="text-[10px] text-slate-400">Assigned Patient</div>
                      </div>
                    </div>
                    {userRole === 'Patient' && (
                      <span className="text-[10px] bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </button>

                  {/* Caregiver options */}
                  {caregivers.map((cg) => {
                    const isSelected = currentUserId === cg.id;
                    return (
                      <button
                        key={cg.id}
                        type="button"
                        onClick={() => {
                          switchUserAccount('caregiver', cg.id);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                            : 'text-slate-300 hover:bg-[#172338]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-[10px]">
                            {cg.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white truncate max-w-[140px]">
                              {cg.name}
                            </div>
                            <div className="text-[10px] text-cyan-400">
                              {cg.role} • {cg.shiftTiming}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar with smooth swipe and indicator */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pt-2 mt-2 border-t border-[#1E2D4A] scrollbar-none pb-0.5">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap font-medium transition-colors shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white bg-[#111B2D]/60'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
