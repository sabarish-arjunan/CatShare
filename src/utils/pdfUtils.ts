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
 * Render text (especially currency symbols like ₹) to a high-resolution base64 image
 */
function renderTextToImage(text: string, fontSize: number = 40, color: string = "#1d4ed8"): { dataUrl: string; width: number; height: number } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return { dataUrl: "", width: 0, height: 0 };
  
  const font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.font = font;
  const metrics = ctx.measureText(text);
  
  const scale = 2;
  canvas.width = (metrics.width + 20) * scale;
  canvas.height = (fontSize * 1.5) * scale;
  
  ctx.scale(scale, scale);
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 10, (fontSize * 1.5) / 2);
  
  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: metrics.width + 20,
    height: fontSize * 1.5
  };
}

/**
 * Generate a PDF with a modern "Glass" theme
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

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - 2 * margin;
  
  // Theme Colors
  const accentBlue = [59, 130, 246]; // #3b82f6
  const textDark = [15, 23, 42]; // Slate-900
  const textMuted = [100, 116, 139]; // Slate-500

  /**
   * Draw the background for glassmorphism context
   */
  const drawGlassBackground = (doc: jsPDF) => {
    // Soft gradient-like blobs
    doc.setFillColor(240, 249, 255); // Sky-50
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    doc.setGState(new (doc as any).GState({ opacity: 0.15 }));
    
    // Abstract shapes in the background to show through the glass
    doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    doc.circle(pageWidth, 0, 80, "F");
    
    doc.setFillColor(147, 197, 253); // Blue-300
    doc.circle(0, pageHeight / 2, 60, "F");
    
    doc.setFillColor(191, 219, 254); // Blue-200
    doc.circle(pageWidth, pageHeight, 100, "F");
    
    doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
  };

  /**
   * Add modern header with glass effect
   */
  const addHeader = (doc: jsPDF, title: string) => {
    // Glass bar background
    doc.setFillColor(255, 255, 255);
    doc.setGState(new (doc as any).GState({ opacity: 0.7 }));
    doc.rect(0, 0, pageWidth, 30, "F");
    
    // Bottom border for glass bar
    doc.setGState(new (doc as any).GState({ opacity: 0.3 }));
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(0, 30, pageWidth, 30);
    doc.setGState(new (doc as any).GState({ opacity: 1.0 }));

    // Branding / Accent line
    doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    doc.rect(margin, 10, 2, 12, "F");

    // Title
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont(undefined, "bold");
    doc.setFontSize(22);
    doc.text(title, margin + 5, 18);

    // Date
    doc.setFont(undefined, "normal");
    doc.setFontSize(8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    const dateStr = new Date().toLocaleDateString("en-US", { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    doc.text(dateStr.toUpperCase(), margin + 5, 23);
  };

  /**
   * Add footer
   */
  const addFooter = (doc: jsPDF, pageNum: number) => {
    doc.setGState(new (doc as any).GState({ opacity: 0.5 }));
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`CATSHARE OFFICIAL CATALOGUE • PAGE ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: "center" });
    doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
  };

  drawGlassBackground(pdf);
  addHeader(pdf, catalogueName);

  let currentY = 40;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    // Check for page break
    if (currentY > pageHeight - 85) {
      pdf.addPage();
      drawGlassBackground(pdf);
      addHeader(pdf, catalogueName);
      currentY = 40;
    }

    // --- Glass Product Card ---
    const cardHeight = 72;
    
    // 1. Subtle card shadow (simulated)
    pdf.setGState(new (pdf as any).GState({ opacity: 0.03 }));
    pdf.setFillColor(0, 0, 0);
    (pdf as any).roundedRect(margin + 1, currentY + 1, contentWidth, cardHeight, 4, 4, "F");

    // 2. Glass Background
    pdf.setGState(new (pdf as any).GState({ opacity: 0.6 }));
    pdf.setFillColor(255, 255, 255);
    (pdf as any).roundedRect(margin, currentY, contentWidth, cardHeight, 4, 4, "F");

    // 3. Glass Highlight Border (Thin white)
    pdf.setGState(new (pdf as any).GState({ opacity: 0.8 }));
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.4);
    (pdf as any).roundedRect(margin, currentY, contentWidth, cardHeight, 4, 4, "S");

    // Reset state
    pdf.setGState(new (pdf as any).GState({ opacity: 1.0 }));

    // --- Content Layout ---
    let innerY = currentY + 8;
    
    // Product Name Header
    pdf.setFontSize(13);
    pdf.setFont(undefined, "bold");
    pdf.setTextColor(textDark[0], textDark[1], textDark[2]);
    pdf.text(product.name || "Unnamed Product", margin + 8, innerY);
    
    // Index badge (top right of card)
    pdf.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    pdf.setGState(new (doc as any).GState({ opacity: 0.1 }));
    (pdf as any).roundedRect(pageWidth - margin - 15, currentY + 4, 10, 6, 2, 2, "F");
    pdf.setGState(new (doc as any).GState({ opacity: 1.0 }));
    pdf.setFontSize(8);
    pdf.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    pdf.text(`#${i + 1}`, pageWidth - margin - 10, currentY + 8.5, { align: "center" });

    innerY += 8;

    // --- Image ---
    let imageWidth = 48;
    let imageHeight = 48;

    if (product.image) {
      try {
        const imgDimensions = await getImageDimensions(product.image);
        const aspectRatio = imgDimensions.width / imgDimensions.height;
        imageHeight = imageWidth / aspectRatio;
        
        if (imageHeight > 50) {
          imageHeight = 50;
          imageWidth = imageHeight * aspectRatio;
        }

        // Image container (slight white background for the image itself)
        pdf.setFillColor(255, 255, 255);
        pdf.rect(margin + 8, innerY, imageWidth, imageHeight, "F");
        
        pdf.addImage(product.image, "JPEG", margin + 8, innerY, imageWidth, imageHeight);
      } catch (e) {
        console.warn("Image failed", e);
      }
    }

    // --- Details ---
    const detailsX = margin + imageWidth + 16;
    const detailsMaxWidth = contentWidth - imageWidth - 24;
    
    const fieldKeys = ["field1", "field2", "field3", "field4", "field5", "field6", "field7", "field8", "field9", "field10"];
    const activeFields = fieldKeys.filter(f => product[f]);
    const useColumns = activeFields.length > 5;

    let detailsY = innerY;
    
    // Fields Grid
    pdf.setFontSize(8.5);
    for (let idx = 0; idx < activeFields.length; idx++) {
      const fieldKey = activeFields[idx];
      const label = fieldLabels[fieldKey] || fieldKey;
      const val = product[fieldKey];
      const unit = product[`${fieldKey}Unit`] || "";

      const isCol2 = useColumns && idx >= Math.ceil(activeFields.length / 2);
      const fX = isCol2 ? detailsX + detailsMaxWidth / 2 + 4 : detailsX;
      const fY = detailsY + (isCol2 ? idx - Math.ceil(activeFields.length / 2) : idx) * 6;

      pdf.setFont(undefined, "bold");
      pdf.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      pdf.text(label.toUpperCase(), fX, fY);

      pdf.setFont(undefined, "normal");
      pdf.setTextColor(textDark[0], textDark[1], textDark[2]);
      const lWidth = pdf.getTextWidth(label.toUpperCase()) + 3;
      pdf.text(`${val}${unit && unit !== "None" ? " " + unit : ""}`, fX + lWidth, fY);
    }

    // --- Price (Floating Glass Label Style) ---
    if (product.price) {
      const pRows = useColumns ? Math.ceil(activeFields.length / 2) : activeFields.length;
      const priceY = detailsY + (activeFields.length > 0 ? pRows * 6 + 6 : 0);
      
      const pUnit = product.priceUnit || "";
      const pText = `${currencySymbol}${product.price}${pUnit ? " " + pUnit : ""}`.trim();
      
      // Price background pill
      pdf.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
      pdf.setGState(new (pdf as any).GState({ opacity: 0.05 }));
      (pdf as any).roundedRect(detailsX - 2, priceY - 5, detailsMaxWidth, 10, 2, 2, "F");
      pdf.setGState(new (pdf as any).GState({ opacity: 1.0 }));

      // Render price via Canvas
      const priceImage = renderTextToImage(pText, 44, "#2563eb");
      const imgH = 7.5;
      const imgW = (priceImage.width / priceImage.height) * imgH;
      pdf.addImage(priceImage.dataUrl, "PNG", detailsX, priceY - 4, imgW, imgH);
    }

    currentY += Math.max(cardHeight, imageHeight + 24) + 8;
  }

  // Finalize Footers
  const pageCount = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    addFooter(pdf, i);
  }

  return pdf.output("blob") as Blob;
}

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

export async function sharePDF(blob: Blob, filename: string = "products.pdf", title: string = "Share Products PDF") {
  try {
    const base64Data = await blobToBase64(blob);
    try {
      await Share.share({
        title,
        text: "Product Catalogue",
        files: [`data:application/pdf;base64,${base64Data}`],
        dialogTitle: title,
      });
      return true;
    } catch (err: any) {
      if (err.name !== "AbortError") console.warn("Share failed", err);
    }
  } catch (err) {
    console.warn("Share logic failed", err);
  }
  downloadPDF(blob, filename);
  return false;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      resolve(res.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
