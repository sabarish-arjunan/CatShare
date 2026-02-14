import { useTheme } from "../context/ThemeContext";
import CreateProduct_Classic from "./CreateProduct_Classic";
import CreateProduct_Glass from "./CreateProduct_Glass";

/**
 * CreateProduct Router
 * Dynamically loads the correct theme-specific component based on current theme
 */
export default function CreateProduct(props: any) {
  const { currentTheme } = useTheme();

  // Route to Glass theme if selected
  if (currentTheme.styles.layout === "glass") {
    return <CreateProduct_Glass {...props} />;
  }

  // Default to Classic theme
  return <CreateProduct_Classic {...props} />;
}
