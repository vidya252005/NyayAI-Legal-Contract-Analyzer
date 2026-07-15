import { useState } from 'react';

export function useContractExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportFile = async (
    format: 'pdf' | 'txt', 
    fileNameBase: string, 
    content: any
  ) => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/contracts/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, fileNameBase, content }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileNameBase}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return { exportFile, isExporting };
}
