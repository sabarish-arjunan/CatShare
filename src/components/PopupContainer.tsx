import React from "react";
import { usePopup } from "../context/PopupContext";
import { FiCheckCircle, FiAlertCircle, FiX } from "react-icons/fi";

export const PopupContainer: React.FC = () => {
  const { popups, removePopup } = usePopup();

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <FiCheckCircle className="w-6 h-6 text-green-500" />;
      case "error":
        return <FiAlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return null;
    }
  };

  const getTitleColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-800";
      case "error":
        return "text-red-800";
      default:
        return "text-gray-800";
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-700";
      case "error":
        return "text-red-700";
      default:
        return "text-gray-600";
    }
  };

  const getButtonColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-600 hover:bg-green-700 text-white";
      case "error":
        return "bg-red-600 hover:bg-red-700 text-white";
      default:
        return "bg-blue-600 hover:bg-blue-700 text-white";
    }
  };

  return (
    <>
      {popups.map((popup) => (
        <div
          key={popup.id}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={() => removePopup(popup.id)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              {getIcon(popup.type)}
            </div>
            <h2 className={`text-lg font-semibold mb-3 ${getTitleColor(popup.type)}`}>
              {popup.type === "success" ? "Success!" : "Error"}
            </h2>
            <p className={`text-sm mb-6 ${getMessageColor(popup.type)}`}>
              {popup.message}
            </p>
            <div className="flex justify-center gap-4">
              <button
                className={`px-6 py-2 rounded-full transition ${getButtonColor(popup.type)}`}
                onClick={() => removePopup(popup.id)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
