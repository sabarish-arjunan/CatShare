import jsPDF from "jspdf";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";

interface ProductWithImage {
  id: string | number;
  name: string;
  image?: string; // base64 image data
  price?: string | number;
  priceUnit?: string;
  bgColor?: string;
  fontColor?: string;
  field1?: string;
  field2?: string;
  field3?: string;
  field4?: string;
  field5?: string;
  field6?: string;
  field7?: string;
  field8?: string;
  field9?: string;
  field10?: string;
  field1Unit?: string;
  field2Unit?: string;
  field3Unit?: string;
  field4Unit?: string;
  field5Unit?: string;
  field6Unit?: string;
  field7Unit?: string;
  field8Unit?: string;
  field9Unit?: string;
  field10Unit?: string;
  [key: string]: any;
}

interface PDFGenerationOptions {
  products: ProductWithImage[];
  catalogueName?: string;
  currencySymbol?: string;
  fieldLabels?: { [key: string]: string };
}

/**
 * Generate a PDF with selected product images and details
 * @param options PDF generation options
 * @returns Promise<Blob> The generated PDF as a blob
 */
export async function generateProductPDF(
  options: PDFGenerationOptions
): Promise<Blob> {
  const {
    products,
    catalogueName = "Product Catalogue",
    currencySymbol = "₹",
    fieldLabels = {},
  } = options;

  // Create PDF document with landscape orientation for better image layout
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;

  let currentY = margin;

  // Add title
  pdf.setFontSize(18);
  pdf.setTextColor(40, 40, 40);
  pdf.text(catalogueName, margin, currentY);
  currentY += 12;

  // Add date
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  const dateStr = new Date().toLocaleDateString();
  pdf.text(`Generated on: ${dateStr}`, margin, currentY);
  currentY += 8;

  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // Process each product
  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    // Check if we need a new page
    if (currentY > pageHeight - 80) {
      pdf.addPage();
      currentY = margin;
    }

    // Product name
    pdf.setFontSize(14);
    pdf.setTextColor(40, 40, 40);
    pdf.text(`${i + 1}. ${product.name || "Unnamed Product"}`, margin, currentY);
    currentY += 8;

    // Add image if available
    const imageHeight = 60;
    const imageWidth = 50;

    if (product.image) {
      try {
        pdf.addImage(
          product.image,
          "JPEG",
          margin,
          currentY,
          imageWidth,
          imageHeight
        );
      } catch (e) {
        console.warn(`Failed to add image for product ${product.id}:`, e);
      }
    }

    // Add product details on the right side of image
    const detailsX = margin + imageWidth + 5;
    const detailsMaxWidth = contentWidth - imageWidth - 5;

    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);

    let detailsY = currentY;

    // Add field details
    const fieldKeys = [
      "field1",
      "field2",
      "field3",
      "field4",
      "field5",
      "field6",
      "field7",
      "field8",
      "field9",
      "field10",
    ];

    for (const fieldKey of fieldKeys) {
      if (product[fieldKey]) {
        const label = fieldLabels[fieldKey] || fieldKey;
        const unit = product[`${fieldKey}Unit`] || "";
        const value = product[fieldKey];
        const text = `${label}: ${value} ${unit}`.trim();

        // Split text if too long
        const textLines = pdf.splitTextToSize(text, detailsMaxWidth);
        pdf.text(textLines, detailsX, detailsY);
        detailsY += textLines.length * 4;
      }
    }

    // Add price
    if (product.price) {
      pdf.setFontSize(12);
      pdf.setTextColor(0, 100, 0);
      const priceUnit = product.priceUnit || "";
      const priceText = `Price: ${currencySymbol}${product.price} ${priceUnit}`.trim();
      pdf.text(priceText, detailsX, detailsY);
      detailsY += 6;
    }

    // Move to next product with some spacing
    currentY = Math.max(currentY + imageHeight, detailsY) + 10;

    // Add separator line
    pdf.setDrawColor(220, 220, 220);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 6;
  }

  // Return PDF as blob
  const pdfBlob = pdf.output("blob");
  return pdfBlob as Blob;
}

/**
 * Download PDF to user's device
 * @param blob The PDF blob
 * @param filename The filename for the PDF
 */
export function downloadPDF(blob: Blob, filename: string = "products.pdf") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Share PDF using native share or fallback to download
 * @param blob The PDF blob
 * @param filename The filename for the PDF
 * @param title The title for sharing
 */
export async function sharePDF(
  blob: Blob,
  filename: string = "products.pdf",
  title: string = "Share Products PDF"
) {
  try {
    // Try Capacitor Share first (for native mobile)
    const base64Data = await blobToBase64(blob);
    try {
      await Share.share({
        title: title,
        text: "Check out these products",
        files: [`data:application/pdf;base64,${base64Data}`],
        dialogTitle: title,
      });
      return true;
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.warn("Capacitor Share failed:", err);
      }
    }

    // Try using Web Share API if available
    if (navigator.share && navigator.canShare({ files: [new File([blob], filename, { type: "application/pdf" })] })) {
      await navigator.share({
        files: [new File([blob], filename, { type: "application/pdf" })],
        title: title,
      });
      return true;
    }
  } catch (err: any) {
    if (err.name !== "AbortError") {
      console.warn("Share API failed:", err);
    }
  }

  // Fallback to download
  downloadPDF(blob, filename);
  return false;
}

/**
 * Convert blob to base64 string
 * @param blob The blob to convert
 * @returns Promise<string> The base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
