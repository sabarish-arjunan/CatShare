import React from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack, MdStar } from "react-icons/md";

export default function ProInfo() {
  const navigate = useNavigate();

  const proFeatures = [
    { name: "Bulk Editor", description: "Edit multiple products at once with batch operations" },
    { name: "Watermark Customization", description: "Change watermark text and customize it for your brand" },
    { name: "Manage Categories", description: "Create, edit, and organize unlimited product categories" },
    { name: "Stock Control", description: "Toggle wholesale and resell stock IN/OUT status" },
  ];

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-b from-white to-gray-100 relative">
      {/* Status bar placeholder */}
      <div className="sticky top-0 h-[40px] bg-black z-50"></div>

      {/* Header */}
      <header className="sticky top-[40px] z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200 h-14 flex items-center gap-3 px-4 relative">
        <button
          onClick={() => navigate("/settings")}
          className="w-8 h-8 shrink-0 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded-md transition"
          aria-label="Back"
          title="Back to Settings"
        >
          <MdArrowBack size={24} />
        </button>
        <h1 className="text-xl font-bold flex-1 text-center">CatShare Pro</h1>
        <div className="w-8"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="space-y-6 max-w-2xl">
          {/* Header with emoji */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <MdStar className="text-yellow-500 text-2xl" />
            <h2 className="text-2xl font-bold text-gray-800">CatShare Pro</h2>
          </div>

          {/* Current Status */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-300 shadow-sm">
            <p className="text-sm text-green-900 mb-2">
              <span className="font-semibold">🎉 Special Offer:</span> Pro Features - Completely Free
            </p>
            <p className="text-xs text-green-800 leading-relaxed">
              You have unlimited access to all CatShare Pro features at no cost. Make the most of it while you can!
            </p>
          </div>

          {/* Coming Soon Notice */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2">⏰ Limited Time Offer</p>
            <p className="text-xs text-blue-800">
              You're getting Pro features for free during our beta phase. When CatShare Pro officially launches, these premium features will require a subscription. Enjoy everything now!
            </p>
          </div>

          {/* Pro Features */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MdStar className="text-yellow-500" />
              Pro Features (Available Now - Free!)
            </h3>
            <div className="space-y-3">
              {proFeatures.map((feature, idx) => (
                <div key={idx} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition">
                  <p className="text-sm font-medium text-gray-800">{feature.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Why Upgrade to Pro?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Edit bulk products at once to save time</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Full control over watermark and branding</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Unlimited categories for organizing products</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Advanced inventory management with stock control</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white">
            <p className="text-sm font-semibold mb-2">🚀 Make the Most of It</p>
            <p className="text-xs mb-4 opacity-90">
              Use all these Pro features now while they're free. We'll let you know when pricing takes effect, and you'll have plenty of notice!
            </p>
            <button
              onClick={() => navigate("/settings")}
              className="w-full px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition font-medium"
            >
              Back to Settings
            </button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-center">
            <span className="text-green-600 font-semibold block">✓ Free access to Pro features during beta</span>
            <span className="text-gray-500 block mt-1">Pricing model coming soon</span>
          </p>
        </div>
      </main>
    </div>
  );
}
