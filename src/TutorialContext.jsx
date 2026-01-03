import React, { createContext, useState, useCallback } from "react";

export const TutorialContext = createContext();

const TUTORIAL_STEPS = [
  {
    id: "welcome",
    title: "Welcome to Catalogue Manager!",
    description: "Let's create your first product together. I'll guide you through each step.",
    action: "Click the '+' button below to start creating a product",
    target: "create-product-button",
    requiresAction: "click",
  },
  {
    id: "product-name",
    title: "Product Name",
    description: "Enter your product name here. This is what customers will see.",
    action: "Type a product name",
    target: "form-product-name",
    requiresAction: "input",
  },
  {
    id: "product-subtitle",
    title: "Product Subtitle",
    description: "Add a subtitle or short description of your product.",
    action: "Type a subtitle (optional)",
    target: "form-product-subtitle",
    requiresAction: "input",
  },
  {
    id: "product-image",
    title: "Upload Product Image",
    description: "Upload a clear image of your product. You'll be able to crop and adjust it.",
    action: "Click to upload an image",
    target: "form-product-image",
    requiresAction: "upload",
  },
  {
    id: "product-category",
    title: "Product Category",
    description: "Select one or more categories to organize your product. These help customers find your items.",
    action: "Select at least one category",
    target: "form-product-category",
    requiresAction: "select",
  },
  {
    id: "product-package",
    title: "Package Info",
    description: "Describe how your product is packaged (e.g., '10 pieces per box', 'Single item').",
    action: "Enter package information",
    target: "form-product-package",
    requiresAction: "input",
  },
  {
    id: "product-age",
    title: "Age Group",
    description: "Specify the age group this product is suitable for, if applicable.",
    action: "Enter age group info",
    target: "form-product-age",
    requiresAction: "input",
  },
  {
    id: "wholesale-price",
    title: "Wholesale Price",
    description: "Set the wholesale price for bulk buyers. This is the cost per unit for larger orders.",
    action: "Enter the wholesale price",
    target: "form-wholesale-price",
    requiresAction: "input",
  },
  {
    id: "wholesale-unit",
    title: "Wholesale Unit",
    description: "Specify the unit (e.g., '/ piece', '/ dozen', '/ carton') for wholesale pricing.",
    action: "Select or type the unit",
    target: "form-wholesale-unit",
    requiresAction: "input",
  },
  {
    id: "resell-price",
    title: "Resell Price",
    description: "Set the retail price for individual customers. This is usually higher than wholesale.",
    action: "Enter the resell price",
    target: "form-resell-price",
    requiresAction: "input",
  },
  {
    id: "resell-unit",
    title: "Resell Unit",
    description: "Specify the unit for retail pricing (e.g., '/ piece', '/ set').",
    action: "Select or type the unit",
    target: "form-resell-unit",
    requiresAction: "input",
  },
  {
    id: "stock-status",
    title: "Stock Status",
    description: "Mark whether this product is in stock or out of stock for both wholesale and retail.",
    action: "Set stock status for both channels",
    target: "form-stock-status",
    requiresAction: "toggle",
  },
  {
    id: "finish",
    title: "Product Created!",
    description: "Great! Your product has been saved. You can now create more products or manage your catalogue.",
    action: "Click 'Back' to see your new product in the list",
    target: null,
    requiresAction: "navigate",
  },
];

export function TutorialProvider({ children }) {
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedActions, setCompletedActions] = useState(new Set());

  const currentStep = TUTORIAL_STEPS[currentStepIndex];

  const startTutorial = useCallback(() => {
    setIsTutorialActive(true);
    setCurrentStepIndex(0);
    setCompletedActions(new Set());
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setCompletedActions(new Set());
    }
  }, [currentStepIndex]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setCompletedActions(new Set());
    }
  }, [currentStepIndex]);

  const completeTutorial = useCallback(() => {
    setIsTutorialActive(false);
    setCurrentStepIndex(0);
    setCompletedActions(new Set());
  }, []);

  const markActionComplete = useCallback((actionId) => {
    setCompletedActions((prev) => new Set([...prev, actionId]));
  }, []);

  const checkActionComplete = useCallback(() => {
    if (!currentStep || !currentStep.requiresAction) return true;
    return completedActions.has(currentStep.requiresAction);
  }, [currentStep, completedActions]);

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
        markActionComplete,
        checkActionComplete,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}
