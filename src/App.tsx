import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { MedicationsView } from './components/medications/MedicationsView';
import { ScannerView } from './components/scanner/ScannerView';
import { OCRView } from './components/ocr/OCRView';
import { GesturesView } from './components/gestures/GesturesView';
import { AssistantView } from './components/assistant/AssistantView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { AuthScreen } from './components/auth/AuthScreen';
import { MobileBottomDock } from './components/layout/MobileBottomDock';
import { reminderService } from './services/reminderService';
import { CheckCircle2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    isAuthenticated,
    activePage,
    toastMessage,
    medications,
    addNotification,
    showToast,
    voiceEnabled,
  } = useApp();

  // Browser-based local medication reminder service lifecycle
  React.useEffect(() => {
    if (!isAuthenticated) return;

    // Start background local scheduler and return cleanup function
    const cleanup = reminderService.startScheduler(
      () => medications,
      () => ({
        enabled: true,
        enableSound: true,
        enableVoice: voiceEnabled,
        onTrigger: (payload) => {
          addNotification({
            title: `Medication Due: ${payload.medicineName}`,
            message: `${payload.medicineName} ${payload.dosage} scheduled now (${payload.rule}).`,
            type: 'reminder',
          });
          showToast(`Reminder: Time to take ${payload.medicineName} (${payload.dosage})`);
        },
      }),
      30000 // checks cadence
    );

    return () => {
      cleanup();
    };
  }, [isAuthenticated, medications, voiceEnabled, addNotification, showToast]);

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#080D19] text-[#F8FAFC] flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top persistent navigation bar */}
      <Navbar />

      {/* Main Workspace Frame */}
      <main className="flex-1 pb-24 md:pb-16">
        {activePage === 'dashboard' && <DashboardView />}
        {activePage === 'medications' && <MedicationsView />}
        {activePage === 'scanner' && <ScannerView />}
        {activePage === 'ocr' && <OCRView />}
        {activePage === 'gestures' && <GesturesView />}
        {activePage === 'assistant' && <AssistantView />}
        {activePage === 'reports' && <ReportsView />}
        {activePage === 'settings' && <SettingsView />}
      </main>

      {/* Native Mobile Bottom Navigation Dock (< md screens) */}
      <MobileBottomDock />

      {/* Toast Notification popup matching bottom right of video frame 00:35 */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#172338] border-2 border-emerald-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Success</div>
            <div className="text-[11px] text-slate-300">{toastMessage}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
