import { useTheme } from "../context/ThemeContext";
import ProductPreviewModal_Classic from "./ProductPreviewModal_Classic";
import ProductPreviewModal_Glass from "./ProductPreviewModal_Glass";

/**
 * ProductPreviewModal Router
 * Dynamically loads the correct theme-specific component based on current theme
 */
export default function ProductPreviewModal(props) {
  const { currentTheme } = useTheme();

  // Route to Glass theme if selected
  if (currentTheme.styles.layout === "glass") {
    return <ProductPreviewModal_Glass {...props} />;
  }

  // Default to Classic theme
  return <ProductPreviewModal_Classic {...props} />;
}
