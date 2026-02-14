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
 * Get dimensions of an image from base64 data
 * @param base64Image The base64 encoded image
 * @returns Promise<{width: number, height: number}> The image dimensions
 */
function getImageDimensions(base64Image: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
    img.src = base64Image;
  });
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

  // Sanitize currency symbol for PDF
  let safeCurrencySymbol = currencySymbol;
  const supportedSymbols = ["$", "€", "£", "¥", "A$", "C$", "S$", "HK$", "R", "Rs."];
  
  if (!supportedSymbols.includes(currencySymbol)) {
    if (currencySymbol === "₹") {
      safeCurrencySymbol = "Rs.";
    } else if (currencySymbol === "د.إ") {
      safeCurrencySymbol = "AED";
    } else if (currencySymbol === "฿") {
      safeCurrencySymbol = "THB";
    } else if (currencySymbol === "₫") {
      safeCurrencySymbol = "VND";
    }
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - 2 * margin;
  const primaryColor = [59, 130, 246]; // #3b82f6

  /**
   * Add header to current page
   */
  const addHeader = (doc: jsPDF, title: string) => {
    // Top bar
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 25, "F");

    // Title in header
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, "bold");
    doc.setFontSize(20);
    doc.text(title.toUpperCase(), margin, 16);

    // Subtitle / Date
    doc.setFont(undefined, "normal");
    doc.setFontSize(9);
    const dateStr = new Date().toLocaleDateString("en-US", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`CATALOGUE GENERATED ON: ${dateStr.toUpperCase()}`, margin, 21);
  };

  /**
   * Add footer to current page
   */
  const addFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont(undefined, "normal");
    
    // Left: Branding
    doc.text("POWERED BY CATSHARE", margin, pageHeight - 10);
    
    // Right: Page number
    const pageStr = `PAGE ${pageNum}`;
    const pageTextWidth = doc.getTextWidth(pageStr);
    doc.text(pageStr, pageWidth - margin - pageTextWidth, pageHeight - 10);
  };

  addHeader(pdf, catalogueName);

  let currentY = 35;

  // Process each product
  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    // Estimated height check for new page
    // (Header/Footer + Image + Spacing)
    if (currentY > pageHeight - 75) {
      pdf.addPage();
      addHeader(pdf, catalogueName);
      currentY = 35;
    }

    // --- Product Card Container ---
    const startOfCardY = currentY;
    
    // Product Header Strip
    pdf.setFillColor(248, 250, 252); // Very light slate background
    pdf.rect(margin, currentY, contentWidth, 10, "F");
    pdf.setDrawColor(226, 232, 240); // Slate-200 border
    pdf.line(margin, currentY, pageWidth - margin, currentY); // Top line
    pdf.line(margin, currentY + 10, pageWidth - margin, currentY + 10); // Bottom line
    
    // Product number and name
    pdf.setFontSize(12);
    pdf.setFont(undefined, "bold");
    pdf.setTextColor(30, 41, 59); // Slate-800
    pdf.text(`${i + 1}. ${product.name || "Unnamed Product"}`, margin + 3, currentY + 6.5);
    
    currentY += 14;

    // --- Image Section ---
    let imageWidth = 55;
    let imageHeight = 55;

    if (product.image) {
      try {
        const imgDimensions = await getImageDimensions(product.image);
        const aspectRatio = imgDimensions.width / imgDimensions.height;

        imageWidth = 55;
        imageHeight = imageWidth / aspectRatio;
        
        // Cap height to keep things on page
        if (imageHeight > 75) {
          imageHeight = 75;
          imageWidth = imageHeight * aspectRatio;
        }

        // Check again for page break after image size calculation
        if (currentY + imageHeight > pageHeight - 20) {
          pdf.addPage();
          addHeader(pdf, catalogueName);
          currentY = 35;
          
          // Re-draw product header on new page if it was split
          pdf.setFillColor(248, 250, 252);
          pdf.rect(margin, currentY, contentWidth, 10, "F");
          pdf.setDrawColor(226, 232, 240);
          pdf.line(margin, currentY, pageWidth - margin, currentY);
          pdf.line(margin, currentY + 10, pageWidth - margin, currentY + 10);
          pdf.setFont(undefined, "bold");
          pdf.setTextColor(30, 41, 59);
          pdf.text(`${i + 1}. ${product.name || "Unnamed Product"} (CONT.)`, margin + 3, currentY + 6.5);
          currentY += 14;
        }

        // Subtle image border/shadow effect
        pdf.setDrawColor(241, 245, 249);
        pdf.setLineWidth(0.2);
        pdf.rect(margin - 0.5, currentY - 0.5, imageWidth + 1, imageHeight + 1);

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
        imageWidth = 55;
        imageHeight = 55;
      }
    }

    // --- Details Section ---
    const detailsX = margin + imageWidth + 8;
    const detailsMaxWidth = contentWidth - imageWidth - 8;
    
    const fieldKeys = [
      "field1", "field2", "field3", "field4", "field5",
      "field6", "field7", "field8", "field9", "field10",
    ];

    const activeFields = fieldKeys.filter(fieldKey => product[fieldKey]);
    const useColumns = activeFields.length > 5;
    
    // Height calculation for centering
    let totalDetailsHeight = 0;
    if (activeFields.length > 0) {
      const fieldRows = useColumns ? Math.ceil(activeFields.length / 2) : activeFields.length;
      totalDetailsHeight += fieldRows * 6;
    }
    if (product.price) {
      totalDetailsHeight += (activeFields.length > 0 ? 6 : 0) + 10;
    }

    let detailsY = currentY;
    if (totalDetailsHeight < imageHeight) {
      detailsY = currentY + (imageHeight - totalDetailsHeight) / 2;
    }

    // Render Fields
    if (activeFields.length > 0) {
      const colWidth = useColumns ? detailsMaxWidth / 2 - 2 : detailsMaxWidth;
      
      for (let idx = 0; idx < activeFields.length; idx++) {
        const fieldKey = activeFields[idx];
        const label = fieldLabels[fieldKey] || fieldKey;
        const unit = product[`${fieldKey}Unit`] || "";
        const value = product[fieldKey];

        const isCol2 = useColumns && idx >= Math.ceil(activeFields.length / 2);
        const fieldX = isCol2 ? detailsX + colWidth + 4 : detailsX;
        const fieldY = detailsY + (isCol2 ? idx - Math.ceil(activeFields.length / 2) : idx) * 6;

        // Label
        pdf.setFontSize(8);
        pdf.setFont(undefined, "bold");
        pdf.setTextColor(100, 116, 139); // Slate-500
        pdf.text(`${label.toUpperCase()}:`, fieldX, fieldY);

        // Value
        pdf.setFont(undefined, "normal");
        pdf.setTextColor(30, 41, 59); // Slate-800
        const labelWidth = pdf.getTextWidth(`${label.toUpperCase()}: `);
        const valueText = `${value}${unit && unit !== "None" ? " " + unit : ""}`.trim();
        pdf.text(valueText, fieldX + labelWidth, fieldY);
      }
      
      const rows = useColumns ? Math.ceil(activeFields.length / 2) : activeFields.length;
      detailsY += rows * 6 + 4;
    }

    // Render Price
    if (product.price) {
      const priceUnit = product.priceUnit || "";
      const priceText = `${safeCurrencySymbol}${product.price}${priceUnit ? " " + priceUnit : ""}`.trim();
      
      // Price background accent
      pdf.setFillColor(240, 249, 255); // Light blue background
      pdf.rect(detailsX - 2, detailsY, detailsMaxWidth + 2, 10, "F");
      
      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.text(priceText, detailsX + 2, detailsY + 7);
      
      detailsY += 14;
    }

    // Update global Y
    currentY = Math.max(currentY + imageHeight, detailsY) + 15;
  }

  // Add footers to all pages
  const totalPages = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addFooter(pdf, i, totalPages);
  }

  return pdf.output("blob") as Blob;
}

/**
 * Download PDF to user's device
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
 */
export async function sharePDF(
  blob: Blob,
  filename: string = "products.pdf",
  title: string = "Share Products PDF"
) {
  try {
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
      if (err.name !== "AbortError") console.warn("Capacitor Share failed:", err);
    }

    if (navigator.share && navigator.canShare({ files: [new File([blob], filename, { type: "application/pdf" })] })) {
      await navigator.share({
        files: [new File([blob], filename, { type: "application/pdf" })],
        title: title,
      });
      return true;
    }
  } catch (err: any) {
    if (err.name !== "AbortError") console.warn("Share API failed:", err);
  }

  downloadPDF(blob, filename);
  return false;
}

/**
 * Convert blob to base64 string
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
