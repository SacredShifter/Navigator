/**
 * Data Export Service - User Data Portability
 *
 * Enables users to export their complete ROE data in multiple formats:
 * - PDF reports with visualizations
 * - JSON data dumps for portability
 * - CSV exports for analysis
 *
 * Supports GDPR/CCPA data portability rights.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../../lib/supabase';

interface ExportOptions {
  format: 'pdf' | 'json' | 'csv';
  includeMetrics: boolean;
  includeBranches: boolean;
  includeEvents: boolean;
  includeFeedback: boolean;
  timeRange?: 'all' | '30d' | '90d' | '1y';
}

interface UserDataExport {
  exportDate: string;
  userId: string;
  summary: {
    totalBranches: number;
    avgRI: number;
    timespan: string;
  };
  branches?: any[];
  events?: any[];
  feedback?: any[];
  fields?: any[];
}

export class DataExportService {
  /**
   * Export user data in specified format
   */
  async exportUserData(
    userId: string,
    options: Partial<ExportOptions> = {}
  ): Promise<Blob> {
    const opts: ExportOptions = {
      format: 'pdf',
      includeMetrics: true,
      includeBranches: true,
      includeEvents: true,
      includeFeedback: true,
      timeRange: 'all',
      ...options
    };

    const data = await this.gatherUserData(userId, opts);

    switch (opts.format) {
      case 'pdf':
        return this.generatePDF(data);
      case 'json':
        return this.generateJSON(data);
      case 'csv':
        return this.generateCSV(data);
      default:
        throw new Error(`Unsupported export format: ${opts.format}`);
    }
  }

  /**
   * Generate comprehensive PDF report
   */
  private async generatePDF(data: UserDataExport): Promise<Blob> {
    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.text('Sacred Shifter - ROE Data Export', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.text(`Export Date: ${new Date(data.exportDate).toLocaleDateString()}`, 20, yPos);
    yPos += 5;
    doc.text(`User ID: ${data.userId}`, 20, yPos);
    yPos += 15;

    // Summary Section
    doc.setFontSize(14);
    doc.text('Journey Summary', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.text(`Total Reality Branches: ${data.summary.totalBranches}`, 25, yPos);
    yPos += 6;
    doc.text(`Average Resonance Index: ${data.summary.avgRI.toFixed(3)}`, 25, yPos);
    yPos += 6;
    doc.text(`Timespan: ${data.summary.timespan}`, 25, yPos);
    yPos += 15;

    // Reality Branches Table
    if (data.branches && data.branches.length > 0) {
      doc.setFontSize(14);
      doc.text('Reality Branches', 20, yPos);
      yPos += 8;

      const branchRows = data.branches.map(b => [
        new Date(b.created_at).toLocaleDateString(),
        b.resonance_index.toFixed(3),
        b.emotion_state?.chemical_state || 'N/A',
        b.probability_field_id?.slice(0, 12) || 'None'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'RI', 'Emotion State', 'Field ID']],
        body: branchRows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Events Summary
    if (data.events && data.events.length > 0 && yPos < 270) {
      doc.setFontSize(14);
      doc.text('Recent Events', 20, yPos);
      yPos += 8;

      const eventRows = data.events.slice(0, 10).map(e => [
        new Date(e.created_at).toLocaleDateString(),
        e.event_type,
        e.module_id,
        e.resonance_index?.toFixed(2) || 'N/A'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Event Type', 'Module', 'RI']],
        body: eventRows,
        theme: 'striped',
        headStyles: { fillColor: [168, 85, 247] },
        styles: { fontSize: 8 }
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.text('Sacred Shifter - Reality Optimization Engine', 20, 285);
    doc.text('Your data, your journey, your growth.', 20, 290);

    return doc.output('blob');
  }

  /**
   * Generate JSON export
   */
  private generateJSON(data: UserDataExport): Blob {
    const jsonString = JSON.stringify(data, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  /**
   * Generate CSV export for branches
   */
  private generateCSV(data: UserDataExport): Blob {
    if (!data.branches || data.branches.length === 0) {
      return new Blob(['No data available'], { type: 'text/csv' });
    }

    const headers = [
      'Created At',
      'Resonance Index',
      'Emotion State',
      'Chemical State',
      'Regulation Level',
      'Profile ID',
      'Field ID'
    ];

    const rows = data.branches.map(b => [
      b.created_at,
      b.resonance_index,
      b.emotion_state?.chemical_state || '',
      b.emotion_state?.chemical_state || '',
      b.emotion_state?.regulation_level || '',
      b.belief_state?.profile_id || '',
      b.probability_field_id || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv' });
  }

  /**
   * Gather all user data based on options
   */
  private async gatherUserData(
    userId: string,
    options: ExportOptions
  ): Promise<UserDataExport> {
    const cutoffDate = this.getCutoffDate(options.timeRange);

    // Fetch branches
    const branches = options.includeBranches
      ? await this.fetchBranches(userId, cutoffDate)
      : [];

    // Fetch events
    const events = options.includeEvents
      ? await this.fetchEvents(userId, cutoffDate)
      : [];

    // Fetch feedback
    const feedback = options.includeFeedback
      ? await this.fetchFeedback(userId, cutoffDate)
      : [];

    // Fetch field data
    const fields = await this.fetchFields(userId);

    // Calculate summary
    const avgRI = branches.length > 0
      ? branches.reduce((sum, b) => sum + b.resonance_index, 0) / branches.length
      : 0;

    const timespan = branches.length > 0
      ? `${new Date(branches[0].created_at).toLocaleDateString()} - ${new Date(branches[branches.length - 1].created_at).toLocaleDateString()}`
      : 'No data';

    return {
      exportDate: new Date().toISOString(),
      userId,
      summary: {
        totalBranches: branches.length,
        avgRI,
        timespan
      },
      branches,
      events,
      feedback,
      fields
    };
  }

  private async fetchBranches(userId: string, cutoffDate: string) {
    const { data } = await supabase
      .from('reality_branches')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', cutoffDate)
      .order('created_at', { ascending: true });

    return data || [];
  }

  private async fetchEvents(userId: string, cutoffDate: string) {
    const { data } = await supabase
      .from('roe_horizon_events')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', cutoffDate)
      .order('created_at', { ascending: false })
      .limit(100);

    return data || [];
  }

  private async fetchFeedback(userId: string, cutoffDate: string) {
    const { data } = await supabase
      .from('value_fulfillment_log')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', cutoffDate)
      .order('created_at', { ascending: false });

    return data || [];
  }

  private async fetchFields(userId: string) {
    // Get fields user has interacted with
    const { data: branches } = await supabase
      .from('reality_branches')
      .select('probability_field_id')
      .eq('user_id', userId)
      .not('probability_field_id', 'is', null);

    if (!branches) return [];

    const fieldIds = [...new Set(branches.map(b => b.probability_field_id))];

    const { data: fields } = await supabase
      .from('probability_fields')
      .select('id, name, learning_weight')
      .in('id', fieldIds);

    return fields || [];
  }

  private getCutoffDate(timeRange?: string): string {
    const now = new Date();
    switch (timeRange) {
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(0).toISOString();
    }
  }

  /**
   * Download exported data as file
   */
  downloadExport(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Get appropriate filename for export
   */
  getExportFilename(format: string, userId: string): string {
    const date = new Date().toISOString().split('T')[0];
    const userIdShort = userId.slice(0, 8);
    return `sacred-shifter-export-${userIdShort}-${date}.${format}`;
  }
}

export const dataExportService = new DataExportService();
