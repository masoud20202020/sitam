
export function downloadCSV(data: Array<Record<string, unknown>>, filename: string) {
  if (!data || !data.length) {
    alert('داده‌ای برای خروجی وجود ندارد.');
    return;
  }

  // Extract headers
  const headers = Object.keys(data[0]);
  
  // Create CSV content with BOM for Excel UTF-8 compatibility
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle strings with commas or newlines
        if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Add BOM for correct Persian character display in Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
