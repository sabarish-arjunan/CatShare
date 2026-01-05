import React, { createContext, useState, useCallback } from "react";

export const TutorialContext = createContext();

const TUTORIAL_STEPS = [
  {
    id: "welcome",
    title: "Welcome to Catalogue Manager! 👋",
    description: "Let me show you the key features that will help you manage your product catalogue effectively.",
    action: "Next to begin the tour",
    target: null,
    requiresAction: "auto",
  },
  {
    id: "create-product",
    title: "Create Products 📝",
    description: "Click the '+' button at the bottom right to add a new product to your catalogue. Set name, pricing, stock status, and more.",
    action: "Notice the blue + button",
    target: "create-product-button",
    requiresAction: "auto",
  },
  {
    id: "products-tab",
    title: "Products Tab 📋",
    description: "This tab shows all your products in a list view. You can search, sort, drag to reorder, and see edit/delete/stock buttons for each product.",
    action: "Look at the Products tab",
    target: "tab-products",
    requiresAction: "auto",
  },
  {
    id: "edit-product",
    title: "Edit Products ✏️",
    description: "Each product has an edit icon. Click it to modify the product details, pricing, images, and categories.",
    action: "See the edit icon on each product",
    target: "product-edit-icon",
    requiresAction: "auto",
  },
  {
    id: "wholesale-tab",
    title: "Wholesale Tab 🏢",
    description: "Switch to Wholesale to see your products with wholesale pricing. This is for bulk buyers. You can filter by stock status and category here.",
    action: "See the Wholesale tab at the bottom",
    target: "tab-wholesale",
    requiresAction: "auto",
  },
  {
    id: "filter-search",
    title: "Filter & Search 🔍",
    description: "Use the search icon to find products by name. Use the filter icon to show/hide products by stock status (In/Out) and category.",
    action: "Look for the filter and search icons",
    target: "wholesale-filter-icon",
    requiresAction: "auto",
  },
  {
    id: "resell-tab",
    title: "Resell Tab 🛍️",
    description: "This tab shows the same products with retail pricing. Useful to show individual customers different prices than wholesale buyers.",
    action: "See the Resell tab",
    target: "tab-resell",
    requiresAction: "auto",
  },
  {
    id: "stock-status",
    title: "Stock In/Out Buttons 📦",
    description: "Below each product in Products tab, you see 'WS In/Out' and 'RS In/Out' buttons. WS = Wholesale, RS = Resell. Toggle these to mark inventory status.",
    action: "Look at the stock buttons",
    target: "stock-buttons",
    requiresAction: "auto",
  },
  {
    id: "shelf-explained",
    title: "The Shelf 🗑️",
    description: "When you delete a product, it doesn't disappear - it goes to the Shelf. This is like a trash bin where you can restore products or permanently delete them. It's a safety feature!",
    action: "See Shelf in the side menu",
    target: "shelf-menu-item",
    requiresAction: "auto",
  },
  {
    id: "rearrange",
    title: "Rearrange Products 🔄",
    description: "In the Products tab, you can drag products to rearrange their order. This affects how they appear in Wholesale and Resell views.",
    action: "Notice you can drag products",
    target: "product-list",
    requiresAction: "auto",
  },
  {
    id: "rendering-intro",
    title: "Rendering - The Powerful Feature ⭐",
    description: "This is the MOST IMPORTANT feature! Use 'Render PNGs' to automatically generate professional product images with pricing, names, and details overlaid. Perfect for sharing with customers!",
    action: "This feature is in the side menu",
    target: "render-png-button",
    requiresAction: "auto",
  },
  {
    id: "rendering-details",
    title: "How Rendering Works 🎯",
    description: "When you click 'Render PNGs', the app processes ALL products at once and creates beautiful PNG images with your pricing, product info, and custom colors. Use these for presentations, emails, and catalogs!",
    action: "This saves hours of manual work",
    target: null,
    requiresAction: "auto",
  },
  {
    id: "bulk-editor",
    title: "Bulk Editor ⚡",
    description: "Need to update many products at once? Use Bulk Editor from the menu. Change prices, stock status, categories, and more for multiple products in one go. Saves tons of time!",
    action: "Great for large-scale updates",
    target: "bulk-editor-menu-item",
    requiresAction: "auto",
  },
  {
    id: "manage-categories",
    title: "Manage Categories 🏷️",
    description: "Create and organize your product categories. You can add, edit, delete, and reorder categories. Assign multiple categories to products for better organization.",
    action: "Available in the side menu",
    target: "manage-categories-menu-item",
    requiresAction: "auto",
  },
  {
    id: "backup-restore",
    title: "Backup & Restore 💾",
    description: "Back up your entire catalogue including all products and images as a ZIP file. Restore anytime to recover your data. Do this regularly to protect your work!",
    action: "Found in the side menu",
    target: "backup-menu-item",
    requiresAction: "auto",
  },
  {
    id: "complete",
    title: "You're Ready! 🎉",
    description: "You now understand the main features: Products, Wholesale/Resell pricing, Stock management, Rendering, Bulk editing, and Data protection. Start exploring!",
    action: "Click Done to exit the tour",
    target: null,
    requiresAction: "auto",
  },
];

export function TutorialProvider({ children }) {
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = TUTORIAL_STEPS[currentStepIndex];

  const startTutorial = useCallback(() => {
    setIsTutorialActive(true);
    setCurrentStepIndex(0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  }, [currentStepIndex]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  const completeTutorial = useCallback(() => {
    setIsTutorialActive(false);
    setCurrentStepIndex(0);
  }, []);

  return (
    <TutorialContext.Provider
      value={{
        isTutorialActive,
        currentStep,
        currentStepIndex,
        totalSteps: TUTORIAL_STEPS.length,
        allSteps: TUTORIAL_STEPS,
        startTutorial,
        nextStep,
        prevStep,
        completeTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}
