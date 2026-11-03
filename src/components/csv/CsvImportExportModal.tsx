/**
 * BANDITRADES — CSV Import & Export Workflow
 * 4-Step institutional trade importer with column mapping, preview, and validation
 */

import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
  FileCheck,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';

interface CsvImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CsvImportExportModal: React.FC<CsvImportExportModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { accounts, selectedAccount } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [targetAccountId, setTargetAccountId] = useState(selectedAccount?.id || accounts[0]?.id || '');
  const [csvText, setCsvText] = useState('');
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState({
    date: 'Date',
    symbol: 'Symbol',
    direction: 'Type',
    size: 'Lots',
    openPrice: 'OpenPrice',
    closePrice: 'ClosePrice',
    netPnL: 'Profit',
    stopLoss: 'StopLoss'
  });
  const [isImporting, setIsImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  if (!isOpen) return null;

  // Step 1 -> Step 2: Parse raw CSV text
  const handleParseCsv = () => {
    if (!csvText.trim()) return;

    const lines = csvText.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      alert('CSV must contain at least a header row and one trade row.');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows = lines.slice(1).map(line =>
      line.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''))
    );

    setParsedHeaders(headers);
    setParsedRows(rows);

    // Auto-detect columns intelligently
    const mapping = { ...columnMapping };
    headers.forEach(h => {
      const lower = h.toLowerCase();
      if (lower.includes('date') || lower.includes('time')) mapping.date = h;
      if (lower.includes('symbol') || lower.includes('item') || lower.includes('market')) mapping.symbol = h;
      if (lower.includes('type') || lower.includes('action') || lower.includes('direction') || lower.includes('side')) mapping.direction = h;
      if (lower.includes('volume') || lower.includes('size') || lower.includes('lot') || lower.includes('qty')) mapping.size = h;
      if (lower.includes('open') && lower.includes('price')) mapping.openPrice = h;
      if (lower.includes('close') && lower.includes('price')) mapping.closePrice = h;
      if (lower.includes('pnl') || lower.includes('profit') || lower.includes('net')) mapping.netPnL = h;
      if (lower.includes('sl') || lower.includes('stop')) mapping.stopLoss = h;
    });

    setColumnMapping(mapping);
    setStep(2);
  };

  // Sample CSV Loader for Quick Exploration
  const handleLoadSampleCsv = () => {
    const sample = `Date,Symbol,Type,Lots,OpenPrice,ClosePrice,Profit,StopLoss
2026-10-31 14:15:00,US100F,BUY,2.0,20210.50,20355.00,2890.00,20150.00
2026-10-30 08:30:00,GBPUSD,SELL,4.0,1.29950,1.29420,2120.00,1.30200
2026-10-29 13:45:00,GOLD,BUY,1.5,2742.00,2758.50,2475.00,2734.00
2026-10-28 07:15:00,GBPJPY,BUY,2.0,197.400,196.850,-1100.00,196.850
2026-10-27 15:00:00,US30F,SELL,1.0,42280.0,42090.0,950.00,42380.0`;
    setCsvText(sample);
  };

  // Step 3 -> Step 4: Execute Import
  const handleExecuteImport = async () => {
    setIsImporting(true);
    try {
      const dateIdx = parsedHeaders.indexOf(columnMapping.date);
      const symIdx = parsedHeaders.indexOf(columnMapping.symbol);
      const dirIdx = parsedHeaders.indexOf(columnMapping.direction);
      const sizeIdx = parsedHeaders.indexOf(columnMapping.size);
      const openIdx = parsedHeaders.indexOf(columnMapping.openPrice);
      const closeIdx = parsedHeaders.indexOf(columnMapping.closePrice);
      const pnlIdx = parsedHeaders.indexOf(columnMapping.netPnL);
      const slIdx = parsedHeaders.indexOf(columnMapping.stopLoss);

      const mappedTrades = parsedRows.map(row => ({
        entryDate: dateIdx !== -1 ? row[dateIdx] : new Date().toISOString(),
        symbol: symIdx !== -1 ? row[symIdx] : 'US100',
        direction: dirIdx !== -1 ? row[dirIdx] : 'BUY',
        positionSize: sizeIdx !== -1 ? parseFloat(row[sizeIdx]) : 1.0,
        entryPrice: openIdx !== -1 ? parseFloat(row[openIdx]) : 0,
        exitPrice: closeIdx !== -1 ? parseFloat(row[closeIdx]) : 0,
        netPnL: pnlIdx !== -1 ? parseFloat(row[pnlIdx]) : 0,
        stopLoss: slIdx !== -1 ? parseFloat(row[slIdx]) : 0
      }));

      const res = await api.importCsvTrades(mappedTrades, targetAccountId);
      setImportedCount(res.importedCount);
      setStep(4);
    } catch (err) {
      console.error('CSV Import failed:', err);
      alert('Import failed. Please check your column mappings.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-[#222E42] bg-white dark:bg-[#131926] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-slate-200 dark:border-[#1C2638] bg-slate-50/50 dark:bg-[#0F141F]">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet size={18} className="text-[#00B2FE]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
              Broker CSV Import Engine (Tradovate · MT4/MT5 · NinjaTrader · cTrader)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Step Progress Tracker */}
        <div className="flex items-center justify-between px-8 py-3 border-b border-slate-100 dark:border-[#1C2638] bg-slate-50 dark:bg-[#0B0F17] text-xs font-mono">
          <span className={step >= 1 ? 'text-[#00B2FE] font-bold' : 'text-slate-400'}>1. Upload / Paste</span>
          <span>→</span>
          <span className={step >= 2 ? 'text-[#00B2FE] font-bold' : 'text-slate-400'}>2. Map Columns</span>
          <span>→</span>
          <span className={step >= 3 ? 'text-[#00B2FE] font-bold' : 'text-slate-400'}>3. Preview &amp; Validate</span>
          <span>→</span>
          <span className={step >= 4 ? 'text-[#00B2FE] font-bold' : 'text-slate-400'}>4. Complete</span>
        </div>

        {/* Body Content by Step */}
        <div className="p-6 space-y-5 flex-1 max-h-[70vh] overflow-y-auto text-xs">
          {/* STEP 1: Upload or Paste Raw CSV */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block font-bold text-slate-700 dark:text-[#F8FAFC] uppercase tracking-wider text-[11px]">
                  Target Trading Account
                </label>
                <button
                  type="button"
                  onClick={handleLoadSampleCsv}
                  className="text-xs text-[#00B2FE] font-semibold hover:underline"
                >
                  Load Sample Broker CSV
                </button>
              </div>

              <select
                value={targetAccountId}
                onChange={e => setTargetAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#1B222B] text-slate-900 dark:text-[#F4F6F8]"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (${acc.currentBalance.toLocaleString()})
                  </option>
                ))}
              </select>

              <div>
                <label className="block font-bold text-slate-700 dark:text-[#F4F6F8] uppercase tracking-wider text-[11px] mb-1">
                  Paste Raw CSV or Broker Export Content
                </label>
                <textarea
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                  rows={8}
                  placeholder={`Date,Symbol,Type,Lots,OpenPrice,ClosePrice,Profit,StopLoss\n2026-10-31 14:15,US100F,BUY,2.0,20210.5,20355.0,2890.0,20150.0`}
                  className="w-full px-3 py-2 rounded-xl font-mono text-[11px] border border-slate-200 dark:border-[#2E3845] bg-slate-50 dark:bg-[#151A20] text-slate-900 dark:text-[#F4F6F8] focus:border-[#00C781] focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParseCsv}
                  disabled={!csvText.trim()}
                  className="px-5 py-2 rounded-xl bg-[#00C781] hover:bg-[#00b072] text-[#0B0D10] font-bold text-xs transition-all disabled:opacity-50"
                >
                  Continue to Column Mapping →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Column Mapping */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-[#F4F6F8]">
                  Map CSV Columns to BANDIT Journal Fields
                </h4>
                <p className="text-slate-500 dark:text-[#AAB3BF] text-[11px]">
                  Detected {parsedRows.length} records. Align the headers from your broker file:
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {Object.keys(columnMapping).map(key => {
                  const fieldKey = key as keyof typeof columnMapping;
                  return (
                    <div key={fieldKey} className="p-3 rounded-xl border border-slate-100 dark:border-[#252D38] bg-slate-50/50 dark:bg-[#1B222B]">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#AAB3BF] mb-1">
                        {fieldKey}
                      </label>
                      <select
                        value={columnMapping[fieldKey]}
                        onChange={e =>
                          setColumnMapping({ ...columnMapping, [fieldKey]: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#2E3845] bg-white dark:bg-[#151A20] text-slate-900 dark:text-[#F4F6F8] font-mono text-xs"
                      >
                        {parsedHeaders.map(h => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-[#252D38]">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 font-semibold text-slate-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2 rounded-xl bg-[#00C781] hover:bg-[#00b072] text-[#0B0D10] font-bold transition-all"
                >
                  Preview Records →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Preview & Validate */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-[#F4F6F8]">
                  Validate &amp; Confirm Import
                </h4>
                <p className="text-slate-500 dark:text-[#AAB3BF] text-[11px]">
                  All symbols will be automatically resolved to the 5 canonical instruments (US100, US30, GBPUSD, GBPJPY, XAUUSD).
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#252D38]">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-slate-50 dark:bg-[#1B222B] text-slate-400 uppercase">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Symbol</th>
                      <th className="p-2">Side</th>
                      <th className="p-2">Lots</th>
                      <th className="p-2 text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#252D38]">
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-2 text-slate-500">{row[parsedHeaders.indexOf(columnMapping.date)]}</td>
                        <td className="p-2 font-bold">{row[parsedHeaders.indexOf(columnMapping.symbol)]}</td>
                        <td className="p-2">{row[parsedHeaders.indexOf(columnMapping.direction)]}</td>
                        <td className="p-2">{row[parsedHeaders.indexOf(columnMapping.size)]}</td>
                        <td className="p-2 text-right font-bold text-[#00C781]">
                          ${row[parsedHeaders.indexOf(columnMapping.netPnL)]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-[#252D38]">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 font-semibold text-slate-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isImporting}
                  className="px-5 py-2 rounded-xl bg-[#00C781] hover:bg-[#00b072] text-[#0B0D10] font-bold transition-all shadow-md disabled:opacity-50"
                >
                  {isImporting ? 'Processing...' : `Confirm & Import ${parsedRows.length} Trades`}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Success Summary */}
          {step === 4 && (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#00C781]/20 text-[#00C781] flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>

              <div>
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-[#F4F6F8]">
                  Import Successfully Processed
                </h4>
                <p className="text-xs text-slate-500 dark:text-[#AAB3BF] mt-1">
                  {importedCount} trades were normalized, graded, and integrated into your private account ledger.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-[#00C781] hover:bg-[#00b072] text-[#0B0D10] font-bold text-xs transition-all shadow-md"
              >
                Return to Journal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
