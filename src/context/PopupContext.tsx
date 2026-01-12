import React, { createContext, useContext, useState, useCallback } from "react";

export type PopupType = "success" | "error";

export interface Popup {
  id: string;
  message: string;
  type: PopupType;
  duration?: number;
}

interface PopupContextType {
  popups: Popup[];
  showPopup: (message: string, type: PopupType, duration?: number) => void;
  removePopup: (id: string) => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const PopupProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [popups, setPopups] = useState<Popup[]>([]);

  const showPopup = useCallback(
    (message: string, type: PopupType, duration = 3000) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newPopup: Popup = { id, message, type, duration };

      setPopups((prev) => [...prev, newPopup]);

      if (duration > 0) {
        setTimeout(() => {
          removePopup(id);
        }, duration);
      }
    },
    []
  );

  const removePopup = useCallback((id: string) => {
    setPopups((prev) => prev.filter((popup) => popup.id !== id));
  }, []);

  return (
    <PopupContext.Provider value={{ popups, showPopup, removePopup }}>
      {children}
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("usePopup must be used within PopupProvider");
  }
  return context;
};
