import React from "react";
import { useToast } from "../context/ToastContext";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <FiAlertCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <FiAlertCircle className="w-5 h-5 text-yellow-500" />;
      case "info":
      default:
        return <FiInfo className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "info":
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-800";
      case "error":
        return "text-red-800";
      case "warning":
        return "text-yellow-800";
      case "info":
      default:
        return "text-blue-800";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[200] space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${getBgColor(
            toast.type
          )} shadow-lg animate-fadeIn`}
        >
          <div>{getIcon(toast.type)}</div>
          <div className={`flex-1 ${getTextColor(toast.type)} text-sm`}>
            {toast.message}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className={`p-1 hover:bg-black/10 rounded transition ${getTextColor(
              toast.type
            )}`}
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
