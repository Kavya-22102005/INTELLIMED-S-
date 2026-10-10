import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Medication, InventoryTransaction } from '../../types';
import { RefillStockModal } from '../modals/RefillStockModal';
import { EditStockModal } from '../modals/EditStockModal';
import {
  Package,
  PackagePlus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  History,
  Search,
  Filter,
  DollarSign,
  TrendingDown,
  Building2,
  Sliders,
  Bell,
  RefreshCw,
  Plus,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const MedicineInventoryView: React.FC = () => {
  const {
    medications,
    inventoryTransactions,
    activePatient,
    addNotification,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'low' | 'out' | 'expiring'>('all');
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');

  // Modals state
  const [refillModalMed, setRefillModalMed] = useState<Medication | null>(null);
  const [editStockModalMed, setEditStockModalMed] = useState<Medication | null>(null);

  // Compute stats across current medications
  const totalMeds = medications.length;
  const lowStockMeds = medications.filter((m) => {
    const threshold = m.reorderThreshold ?? 8;
    return m.inventory > 0 && m.inventory <= threshold;
  });
  const outOfStockMeds = medications.filter((m) => m.inventory === 0);

  // Filtered medication list
  const filteredMeds = medications.filter((med) => {
    const matchesSearch =
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.dosage.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const threshold = med.reorderThreshold ?? 8;
    if (filterMode === 'low') return med.inventory > 0 && med.inventory <= threshold;
    if (filterMode === 'out') return med.inventory === 0;
    if (filterMode === 'expiring') {
      if (!med.expiryDate) return false;
      const expiry = new Date(med.expiryDate).getTime();
      const in90Days = Date.now() + 90 * 24 * 60 * 60 * 1000;
      return expiry <= in90Days;
    }
    return true;
  });

  // Calculate runout date helper
  const calculateRunout = (med: Medication) => {
    const unitsPerDose = med.unitsPerDose ?? 1;
    const dailyDoses = med.dailyDosesCount ?? 1;
    const dailyConsumption = unitsPerDose * dailyDoses;

    if (dailyConsumption <= 0 || med.inventory <= 0) {
      return {
        daysRemaining: 0,
        runoutDateStr: med.inventory === 0 ? 'Out of Stock' : 'Indefinite',
        isCritical: med.inventory === 0,
        dailyConsumption,
      };
    }

    const daysRemaining = Math.floor(med.inventory / dailyConsumption);
    const runoutDate = new Date();
    runoutDate.setDate(runoutDate.getDate() + daysRemaining);
    const runoutDateStr = runoutDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const isCritical = daysRemaining <= 7;
    return { daysRemaining, runoutDateStr, isCritical, dailyConsumption };
  };

  // Trigger global refill review notifications
  const handleTriggerRefillAlerts = () => {
    let alertedCount = 0;
    medications.forEach((med) => {
      const threshold = med.reorderThreshold ?? 8;
      if (med.inventory <= threshold) {
        addNotification({
          title: med.inventory === 0 ? `Stock Depleted: ${med.name}` : `Refill Reminder: ${med.name}`,
          message:
            med.inventory === 0
              ? `${med.name} is completely exhausted (0 pills). Patient requires an emergency refill.`
              : `${med.name} has ${med.inventory} pills left (threshold: ${threshold}). Refill needed soon.`,
          type: 'warning',
        });
        alertedCount++;
      }
    });

    if (alertedCount > 0) {
      showToast(`Sent ${alertedCount} refill alert${alertedCount > 1 ? 's' : ''} to notification center`);
    } else {
      showToast('All medications are adequately stocked above threshold');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Inventory Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tracked */}
        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-4 shadow-lg flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white font-mono">{totalMeds}</div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Tracked Medicines
            </div>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div
          onClick={() => setFilterMode('low')}
          className={`bg-[#111B2D] border rounded-2xl p-4 shadow-lg flex items-center gap-3.5 cursor-pointer transition-all ${
            filterMode === 'low'
              ? 'border-amber-400 bg-amber-950/20 ring-1 ring-amber-400'
              : 'border-[#1E2D4A] hover:border-amber-500/40'
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-300 font-mono">
              {lowStockMeds.length}
            </div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Low Stock Items
            </div>
          </div>
        </div>

        {/* Out of Stock */}
        <div
          onClick={() => setFilterMode('out')}
          className={`bg-[#111B2D] border rounded-2xl p-4 shadow-lg flex items-center gap-3.5 cursor-pointer transition-all ${
            filterMode === 'out'
              ? 'border-red-400 bg-red-950/20 ring-1 ring-red-400'
              : 'border-[#1E2D4A] hover:border-red-500/40'
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-red-400 font-mono">
              {outOfStockMeds.length}
            </div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Out of Stock
            </div>
          </div>
        </div>

        {/* System Stock Health */}
        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-300">Inventory Status</div>
            <div className="text-base font-extrabold text-emerald-400 mt-0.5">
              {lowStockMeds.length + outOfStockMeds.length === 0 ? 'Fully Stocked' : 'Action Needed'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Patient: <strong className="text-white">{activePatient.name}</strong>
            </div>
          </div>
          <button
            onClick={handleTriggerRefillAlerts}
            className="p-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-cyan-300 transition-colors cursor-pointer"
            title="Check stock & trigger refill notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs: Medicine Inventory vs Inventory Transactions History */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2D4A] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-[#111B2D] text-slate-400 hover:text-white border border-[#1E2D4A]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Medication Stock & Refill Tracker ({medications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-[#111B2D] text-slate-400 hover:text-white border border-[#1E2D4A]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Inventory Transaction Logs ({inventoryTransactions.length})</span>
          </button>
        </div>

        {activeTab === 'inventory' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerRefillAlerts}
              className="px-3.5 py-1.5 bg-[#172338] hover:bg-[#1E2D4A] border border-[#1E2D4A] hover:border-slate-500 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Send Refill Reminders</span>
            </button>
          </div>
        )}
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Filter Pills & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:flex-wrap shrink-0">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-cyan-400 text-[#080D19] shadow-md shadow-cyan-400/20'
                    : 'bg-[#111B2D] border border-[#1E2D4A] text-slate-300 hover:text-white'
                }`}
              >
                All Medicines ({totalMeds})
              </button>

              <button
                onClick={() => setFilterMode('low')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterMode === 'low'
                    ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                    : 'bg-[#111B2D] border border-[#1E2D4A] text-amber-300 hover:bg-amber-950/30'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Low Stock ({lowStockMeds.length})</span>
              </button>

              <button
                onClick={() => setFilterMode('out')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterMode === 'out'
                    ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                    : 'bg-[#111B2D] border border-[#1E2D4A] text-red-300 hover:bg-red-950/30'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Out of Stock ({outOfStockMeds.length})</span>
              </button>

              <button
                onClick={() => setFilterMode('expiring')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterMode === 'expiring'
                    ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                    : 'bg-[#111B2D] border border-[#1E2D4A] text-purple-300 hover:bg-purple-950/30'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Expiring Soon (&lt;90d)</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111B2D] border border-[#1E2D4A] text-xs text-white rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Medicines Detailed Inventory Cards Grid */}
          {filteredMeds.length === 0 ? (
            <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-12 text-center">
              <Package className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-300">
                No medications match this inventory filter
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Adjust search query or switch back to "All Medicines".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMeds.map((med) => {
                const threshold = med.reorderThreshold ?? 8;
                const isOutOfStock = med.inventory === 0;
                const isLowStock = !isOutOfStock && med.inventory <= threshold;
                const runout = calculateRunout(med);
                const capacity = med.totalStock || 30;
                const percent = Math.min(100, Math.round((med.inventory / capacity) * 100));

                return (
                  <div
                    key={med.id}
                    className={`bg-[#111B2D] border rounded-2xl p-5 shadow-lg relative flex flex-col justify-between transition-all hover:border-slate-400 group ${
                      isOutOfStock
                        ? 'border-red-500/40 bg-gradient-to-b from-red-950/20 to-[#111B2D]'
                        : isLowStock
                        ? 'border-amber-500/40 bg-gradient-to-b from-amber-950/20 to-[#111B2D]'
                        : 'border-[#1E2D4A]'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${
                              isOutOfStock
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : isLowStock
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                              {med.name}
                            </h3>
                            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="font-semibold">{med.dosage}</span>
                              <span>•</span>
                              <span>{med.category}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 text-[11px] font-bold border border-red-500/40 animate-pulse">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/40">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              Adequate
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stock Level Progress Bar */}
                      <div className="mt-4 pt-3 border-t border-[#1E2D4A]">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-400">Current Stock</span>
                          <span className="font-mono font-bold text-white">
                            <span
                              className={
                                isOutOfStock
                                  ? 'text-red-400 font-extrabold'
                                  : isLowStock
                                  ? 'text-amber-300'
                                  : 'text-emerald-400'
                              }
                            >
                              {med.inventory}
                            </span>
                            <span className="text-slate-500"> / {capacity} pills ({percent}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#080D19] overflow-hidden">
                          <div
                            style={{ width: `${percent}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOutOfStock
                                ? 'bg-red-500'
                                : isLowStock
                                ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                                : 'bg-gradient-to-r from-blue-500 to-emerald-400'
                            }`}
                          ></div>
                        </div>
                      </div>

                      {/* Clinical Consumption Dynamics Grid */}
                      <div className="grid grid-cols-2 gap-3 mt-4 text-xs bg-[#080D19]/60 p-3 rounded-xl border border-[#1E2D4A]">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                            Dose & Frequency
                          </span>
                          <span className="font-bold text-slate-200">
                            {med.unitsPerDose ?? 1} pill • {med.dailyDosesCount ?? 1}x daily
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Burn: {runout.dailyConsumption} pills/day
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                            Reorder Threshold
                          </span>
                          <span className="font-bold text-amber-300 font-mono">
                            ≤ {threshold} units
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Alert trigger level
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                            Days Remaining
                          </span>
                          <span
                            className={`font-mono font-bold ${
                              runout.isCritical ? 'text-red-400' : 'text-cyan-400'
                            }`}
                          >
                            ~{runout.daysRemaining} days left
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                            Projected Run-Out
                          </span>
                          <span className="font-mono font-bold text-slate-200">
                            {runout.runoutDateStr}
                          </span>
                        </div>
                      </div>

                      {/* Expiry & Purchase Metadata */}
                      <div className="mt-3.5 space-y-1.5 text-xs text-slate-400">
                        {med.expiryDate && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              <span>Batch Expiry:</span>
                            </span>
                            <span className="font-mono text-slate-300 font-semibold">
                              {med.expiryDate}
                            </span>
                          </div>
                        )}

                        {med.lastRefillDate && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>Last Refilled:</span>
                            </span>
                            <span className="font-mono text-slate-300 font-semibold">
                              {med.lastRefillDate}
                            </span>
                          </div>
                        )}

                        {med.purchaseHistory && med.purchaseHistory.length > 0 && (
                          <div className="text-[11px] text-slate-500 truncate pt-1 border-t border-[#1E2D4A]/60">
                            Supplier: {med.purchaseHistory[0].supplierPharmacy || 'Authorized Pharmacy'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons: Record Refill & Edit Stock Rules */}
                    <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-[#1E2D4A]">
                      <button
                        onClick={() => setRefillModalMed(med)}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <PackagePlus className="w-3.5 h-3.5" />
                        <span>Record Refill</span>
                      </button>

                      <button
                        onClick={() => setEditStockModalMed(med)}
                        className="py-2.5 px-3 bg-[#172338] hover:bg-[#1E2D4A] border border-[#1E2D4A] hover:border-slate-400 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Edit Rules</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Inventory Transaction Logs Tab */
        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                <span>Audited Inventory Transaction Ledger</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Full chronological audit trail of doses consumed, refill batches received, and manual adjustments.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1E2D4A] text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Medication</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Change</th>
                  <th className="py-3 px-4">Stock Balance</th>
                  <th className="py-3 px-4">Details / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2D4A]/60">
                {inventoryTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No inventory transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  inventoryTransactions.map((tx) => {
                    const isPositive = tx.quantityChange > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-[#172338]/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-400">{tx.timestamp}</td>
                        <td className="py-3 px-4 font-bold text-white">{tx.medicineName}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.type === 'Stock Refill'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : tx.type === 'Dose Taken'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
                            {isPositive ? `+${tx.quantityChange}` : tx.quantityChange}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-200">
                          {tx.previousStock} → <strong className="text-white">{tx.newStock}</strong>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {tx.note || 'Regular ledger entry'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals for Refill & Edit Stock */}
      <RefillStockModal
        isOpen={!!refillModalMed}
        onClose={() => setRefillModalMed(null)}
        medication={refillModalMed}
      />

      <EditStockModal
        isOpen={!!editStockModalMed}
        onClose={() => setEditStockModalMed(null)}
        medication={editStockModalMed}
      />
    </div>
  );
};
