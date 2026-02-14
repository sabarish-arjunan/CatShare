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
 * This bypasses jsPDF's lack of built-in UTF-8 support for standard fonts.
 */
function renderTextToImage(text: string, fontSize: number = 40, color: string = "#166534"): { dataUrl: string; width: number; height: number } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return { dataUrl: "", width: 0, height: 0 };
  
  const font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.font = font;
  const metrics = ctx.measureText(text);
  
  // Use a high-DPI scaling for sharpness
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
 * Generate a PDF with selected product images and details
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
  const primaryColor = [59, 130, 246]; // #3b82f6
  const slate800 = [30, 41, 59];
  const slate500 = [100, 116, 139];

  /**
   * Add header to current page
   */
  const addHeader = (doc: jsPDF, title: string) => {
    // Top accent bar
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 28, "F");

    // Decorative circle in header
    doc.setFillColor(255, 255, 255);
    doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
    doc.circle(pageWidth - 20, 10, 30, "F");
    doc.setGState(new (doc as any).GState({ opacity: 1.0 }));

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, "bold");
    doc.setFontSize(22);
    doc.text(title.toUpperCase(), margin, 18);

    // Date
    doc.setFont(undefined, "normal");
    doc.setFontSize(9);
    const dateStr = new Date().toLocaleDateString("en-US", { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    doc.text(`CATALOGUE GENERATED: ${dateStr.toUpperCase()}`, margin, 23);
  };

  /**
   * Add footer to current page
   */
  const addFooter = (doc: jsPDF, pageNum: number) => {
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("POWERED BY CATSHARE • WWW.CATSHARE.APP", margin, pageHeight - 10);
    
    const pageStr = `PAGE ${pageNum}`;
    doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 10);
  };

  addHeader(pdf, catalogueName);

  let currentY = 38;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    // Page break check
    if (currentY > pageHeight - 80) {
      pdf.addPage();
      addHeader(pdf, catalogueName);
      currentY = 38;
    }

    // --- Product Card Layout ---
    const cardHeight = 70; // Base height, will adjust
    const cardMargin = 4;
    
    // Subtle background for the card
    pdf.setFillColor(248, 250, 252); // Slate-50
    (pdf as any).roundedRect(margin, currentY, contentWidth, cardHeight, 3, 3, "F");
    
    // Card border
    pdf.setDrawColor(226, 232, 240); // Slate-200
    pdf.setLineWidth(0.3);
    (pdf as any).roundedRect(margin, currentY, contentWidth, cardHeight, 3, 3, "S");

    // Product Header within card
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin + 0.5, currentY + 0.5, contentWidth - 1, 10, "F");
    pdf.line(margin, currentY + 10, pageWidth - margin, currentY + 10);
    
    pdf.setFontSize(12);
    pdf.setFont(undefined, "bold");
    pdf.setTextColor(slate800[0], slate800[1], slate800[2]);
    pdf.text(`${i + 1}. ${product.name || "Unnamed Product"}`, margin + 5, currentY + 7);

    let innerY = currentY + 15;

    // --- Image ---
    let imageWidth = 45;
    let imageHeight = 45;

    if (product.image) {
      try {
        const imgDimensions = await getImageDimensions(product.image);
        const aspectRatio = imgDimensions.width / imgDimensions.height;
        imageHeight = imageWidth / aspectRatio;
        
        if (imageHeight > 50) {
          imageHeight = 50;
          imageWidth = imageHeight * aspectRatio;
        }

        // Image background/border
        pdf.setFillColor(255, 255, 255);
        pdf.rect(margin + 5, innerY, imageWidth, imageHeight, "F");
        
        pdf.addImage(product.image, "JPEG", margin + 5, innerY, imageWidth, imageHeight);
      } catch (e) {
        console.warn("Image failed", e);
      }
    }

    // --- Details ---
    const detailsX = margin + imageWidth + 12;
    const detailsMaxWidth = contentWidth - imageWidth - 18;
    
    const fieldKeys = ["field1", "field2", "field3", "field4", "field5", "field6", "field7", "field8", "field9", "field10"];
    const activeFields = fieldKeys.filter(f => product[f]);
    const useColumns = activeFields.length > 5;

    // Calculate details vertical center
    let totalDetailsHeight = (useColumns ? Math.ceil(activeFields.length / 2) : activeFields.length) * 6;
    if (product.price) totalDetailsHeight += 12;
    
    let detailsY = innerY;
    if (totalDetailsHeight < imageHeight) {
      detailsY = innerY + (imageHeight - totalDetailsHeight) / 2;
    }

    // Fields
    pdf.setFontSize(8);
    for (let idx = 0; idx < activeFields.length; idx++) {
      const fieldKey = activeFields[idx];
      const label = fieldLabels[fieldKey] || fieldKey;
      const val = product[fieldKey];
      const unit = product[`${fieldKey}Unit`] || "";

      const isCol2 = useColumns && idx >= Math.ceil(activeFields.length / 2);
      const fX = isCol2 ? detailsX + detailsMaxWidth / 2 + 4 : detailsX;
      const fY = detailsY + (isCol2 ? idx - Math.ceil(activeFields.length / 2) : idx) * 6;

      pdf.setFont(undefined, "bold");
      pdf.setTextColor(slate500[0], slate500[1], slate500[2]);
      pdf.text(`${label.toUpperCase()}:`, fX, fY);

      pdf.setFont(undefined, "normal");
      pdf.setTextColor(slate800[0], slate800[1], slate800[2]);
      const lWidth = pdf.getTextWidth(`${label.toUpperCase()}: `);
      pdf.text(`${val}${unit && unit !== "None" ? " " + unit : ""}`, fX + lWidth, fY);
    }

    // Price
    if (product.price) {
      const pRows = useColumns ? Math.ceil(activeFields.length / 2) : activeFields.length;
      const priceY = detailsY + (activeFields.length > 0 ? pRows * 6 + 5 : 0);
      
      const pUnit = product.priceUnit || "";
      const pText = `${currencySymbol}${product.price}${pUnit ? " " + pUnit : ""}`.trim();
      
      // Render price via Canvas for perfect symbol support
      const priceImage = renderTextToImage(pText, 48, "#1d4ed8"); // Brand blue for price
      
      // Convert canvas width to mm (approx 1px = 0.264583mm at 96dpi, but we use a scale factor)
      // We'll just use a fixed height and proportional width
      const imgH = 8;
      const imgW = (priceImage.width / priceImage.height) * imgH;
      
      pdf.addImage(priceImage.dataUrl, "PNG", detailsX - 2, priceY, imgW, imgH);
    }

    currentY += Math.max(cardHeight, imageHeight + 25) + 6;
  }

  // Finalize footers
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
