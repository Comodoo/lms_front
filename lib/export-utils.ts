import * as XLSX from 'xlsx';

export const exportReportData = async (
  format: 'pdf' | 'excel' | 'csv',
  data: any[],
  title: string,
  filename: string,
  cols?: any[]
) => {
  if (format === 'excel' || format === 'csv') {
    const ws = XLSX.utils.json_to_sheet(data);
    if (cols) ws['!cols'] = cols;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
    XLSX.writeFile(wb, `${filename}.${format === 'csv' ? 'csv' : 'xlsx'}`, { 
      bookType: format === 'csv' ? 'csv' : 'xlsx' 
    });
  } else if (format === 'pdf') {
    const jsPDFModule = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    const jsPDF = jsPDFModule.default;
    const autoTable = autoTableModule.default;
    
    const doc = new jsPDF();
    doc.text(title, 14, 15);
    
    if (data.length > 0) {
      const head = [Object.keys(data[0])];
      const body = data.map(Object.values);
      
      autoTable(doc, {
        head,
        body,
        startY: 20,
        theme: 'grid',
        styles: { fontSize: 8 }
      });
    } else {
      doc.text("No data available", 14, 25);
    }
    
    doc.save(`${filename}.pdf`);
  }
};
