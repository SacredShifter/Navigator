/**
 * Data Export Button - User Data Portability Control
 *
 * Provides UI for exporting user data in multiple formats.
 * Supports GDPR/CCPA data portability requirements.
 */

import { useState } from 'react';
import { dataExportService } from '../services/roe/DataExportService';
import { Download, FileText, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react';

interface DataExportButtonProps {
  userId: string;
  className?: string;
}

export function DataExportButton({ userId, className = '' }: DataExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  async function handleExport(format: 'pdf' | 'json' | 'csv') {
    try {
      setIsExporting(true);
      setShowMenu(false);

      const blob = await dataExportService.exportUserData(userId, {
        format,
        includeMetrics: true,
        includeBranches: true,
        includeEvents: true,
        includeFeedback: true,
        timeRange: 'all'
      });

      const filename = dataExportService.getExportFilename(format, userId);
      dataExportService.downloadExport(blob, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg text-white font-medium transition-colors"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Export Data
          </>
        )}
      </button>

      {showMenu && !isExporting && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
            <div className="p-2 border-b border-slate-700">
              <div className="text-xs text-slate-400 px-2 py-1">Choose Format</div>
            </div>
            <div className="p-2 space-y-1">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors text-left"
              >
                <FileText className="w-4 h-4 text-red-400" />
                <div>
                  <div className="text-sm font-medium text-white">PDF Report</div>
                  <div className="text-xs text-slate-400">Formatted summary with tables</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('json')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors text-left"
              >
                <FileJson className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-sm font-medium text-white">JSON Data</div>
                  <div className="text-xs text-slate-400">Complete data export</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-400" />
                <div>
                  <div className="text-sm font-medium text-white">CSV Spreadsheet</div>
                  <div className="text-xs text-slate-400">Branch data for analysis</div>
                </div>
              </button>
            </div>

            <div className="p-2 border-t border-slate-700 bg-slate-900/50">
              <p className="text-xs text-slate-400 px-2">
                Your data, your rights. Export anytime.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
