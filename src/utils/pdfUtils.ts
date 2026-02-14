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

  // Sanitize currency symbol for PDF (standard fonts don't support some symbols like ₹)
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
    // If it's still not supported and we have a custom symbol, we might just keep it
    // but at least we fixed the most common ones.
  }

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

    // Calculate image dimensions maintaining aspect ratio
    let imageWidth = 50;
    let imageHeight = 50;

    if (product.image) {
      try {
        // Get original image dimensions
        const imgDimensions = await getImageDimensions(product.image);
        const aspectRatio = imgDimensions.width / imgDimensions.height;

        // Set a max width of 50mm for the image
        imageWidth = 50;

        // Calculate height based on aspect ratio
        if (aspectRatio >= 1) {
          // Wider images (1:1, 3:2, etc.) - use full width
          imageHeight = imageWidth / aspectRatio;
        } else {
          // Taller images (3:4, etc.) - maintain proportion
          imageHeight = imageWidth / aspectRatio;
          // Cap max height at 70mm for page space
          if (imageHeight > 70) {
            imageHeight = 70;
            imageWidth = imageHeight * aspectRatio;
          }
        }

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
        // Fallback to default size if image fails
        imageWidth = 50;
        imageHeight = 50;
      }
    }

    // Add product details on the right side of image
    const detailsX = margin + imageWidth + 6;
    const detailsMaxWidth = contentWidth - imageWidth - 6;

    let detailsY = currentY;

    // Collect non-empty fields
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

    const activeFields = fieldKeys.filter(fieldKey => product[fieldKey]);

    // Calculate total details height for vertical centering
    const useColumns = activeFields.length > 4;
    let totalDetailsHeight = 0;
    if (activeFields.length > 0) {
      const fieldRows = useColumns ? Math.ceil(activeFields.length / 2) : activeFields.length;
      totalDetailsHeight += fieldRows * 4.5;
    }
    if (product.price) {
      if (activeFields.length > 0) totalDetailsHeight += 3; // Spacing before price
      totalDetailsHeight += 8; // Price section height
    }

    // Adjust detailsY for vertical centering relative to image
    if (totalDetailsHeight < imageHeight) {
      detailsY = currentY + (imageHeight - totalDetailsHeight) / 2;
    }

    // Add field details with professional layout
    if (activeFields.length > 0) {
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80);

      // Calculate column width for a 2-column layout if there are many fields
      const col1Width = useColumns ? detailsMaxWidth / 2 - 2 : detailsMaxWidth;
      const col2X = useColumns ? detailsX + detailsMaxWidth / 2 : detailsX;

      let col1Y = detailsY;
      let col2Y = detailsY;
      const startY = detailsY;

      for (let idx = 0; idx < activeFields.length; idx++) {
        const fieldKey = activeFields[idx];
        const label = fieldLabels[fieldKey] || fieldKey;
        const unit = product[`${fieldKey}Unit`] || "";
        const value = product[fieldKey];

        // Use 2 columns if many fields
        const currentX = useColumns && idx >= Math.ceil(activeFields.length / 2) ? col2X : detailsX;
        const currentMaxWidth = useColumns ? detailsMaxWidth / 2 - 3 : detailsMaxWidth;

        // Determine current Y based on which column
        let currentY_field = useColumns && idx >= Math.ceil(activeFields.length / 2) ? col2Y : col1Y;

        // Label in bold
        pdf.setFont(undefined, "bold");
        pdf.setTextColor(50, 50, 50);
        pdf.setFontSize(8);
        const labelText = `${label}:`;
        pdf.text(labelText, currentX, currentY_field);

        // Value on same line
        pdf.setFont(undefined, "normal");
        pdf.setTextColor(100, 100, 100);
        const valueText = `${value}${unit && unit !== "None" ? " " + unit : ""}`.trim();
        const labelWidth = pdf.getTextWidth(labelText) + 2;
        pdf.text(valueText, currentX + labelWidth, currentY_field);

        currentY_field += 4.5;

        // Update appropriate column Y
        if (useColumns && idx >= Math.ceil(activeFields.length / 2)) {
          col2Y = currentY_field;
        } else {
          col1Y = currentY_field;
        }
      }

      // Update detailsY to the maximum of both columns
      detailsY = useColumns ? Math.max(col1Y, col2Y) : col1Y;
      detailsY += 3; // Add spacing before price
    }

    // Add price section
    if (product.price) {
      // Price value
      const priceUnit = product.priceUnit || "";
      const priceText = `${safeCurrencySymbol}${product.price}${priceUnit ? " " + priceUnit : ""}`.trim();
      pdf.setFontSize(12);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(0, 100, 0);
      pdf.text(priceText, detailsX, detailsY + 3);

      detailsY += 8;
    }

    // Move to next product with some spacing
    currentY = Math.max(currentY + imageHeight, detailsY) + 8;

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
