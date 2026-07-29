import { Response } from "express";
import ExcelJS from "exceljs";

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export const exportToExcel = async (res: Response, data: any[], columns: ExportColumn[], filename: string) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Report");

  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 20,
  }));

  data.forEach((row) => {
    worksheet.addRow(row);
  });

  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF136F63" },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
};

export const exportToPdf = async (res: Response, title: string, data: any[], columns: ExportColumn[], filename: string) => {
  const { jsPDF } = await import("jspdf");
  await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setTextColor(19, 111, 99);
  doc.text(title, pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: "center" });

  const tableColumns = columns.map((col) => ({ header: col.header, dataKey: col.key }));
  const tableRows = data.map((row) => {
    const r: Record<string, any> = {};
    columns.forEach((col) => {
      r[col.key] = row[col.key] !== undefined ? String(row[col.key]) : "";
    });
    return r;
  });

  (doc as any).autoTable({
    columns: tableColumns,
    body: tableRows,
    startY: 35,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [19, 111, 99], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  res.send(pdfBuffer);
};
