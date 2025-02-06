import Papa from 'papaparse';

export const csvService = {
  /**
   * Convert data to CSV string
   * @param data Array of objects to convert to CSV
   * @returns CSV string
   */
  convertToCSV<T extends Record<string, any>>(data: T[]): string {
    return Papa.unparse(data);
  },

  /**
   * Download data as CSV file
   * @param data Array of objects to download as CSV
   * @param filename Name of the CSV file
   */
  downloadAsCSV<T extends Record<string, any>>(data: T[], filename: string): void {
    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
