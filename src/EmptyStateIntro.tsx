import React, { useState } from 'react';
import { FiPlus, FiChevronDown } from 'react-icons/fi';
import {
  RiShoppingBag3Line,
  RiImageAddLine,
  RiGroupLine,
  RiExchangeDollarLine,
  RiShareForwardLine,
  RiFileList2Line,
  RiCheckLine,
  RiLightbulbFlashLine,
} from 'react-icons/ri';

interface EmptyStateIntroProps {
  onCreateProduct: () => void;
}

export default function EmptyStateIntro({ onCreateProduct }: EmptyStateIntroProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const features = [
    {
      id: 'create',
      icon: <RiShoppingBag3Line className="w-6 h-6 text-gray-600" />,
      title: 'Create Products',
      description: 'Build your product catalog with images and details',
      details: 'Add product names, subtitles, pricing, categories, and images. Each product stores all the information you need to track and manage your inventory.',
    },
    {
      id: 'organize',
      icon: <RiImageAddLine className="w-6 h-6 text-gray-600" />,
      title: 'Organize & Manage',
      description: 'Keep your products organized and easily accessible',
      details: 'Drag to reorder products, categorize them, and mark stock as IN or OUT for wholesale and resell channels. Bulk edit multiple items at once to save time.',
    },
    {
      id: 'share',
      icon: <RiShareForwardLine className="w-6 h-6 text-gray-600" />,
      title: 'Share Product Images',
      description: 'Render and share professional product previews',
      details: 'Generate beautiful product images with your custom pricing, colors, and branding. Share rendered images with customers, retailers, and wholesalers through any channel.',
    },
    {
      id: 'collaborate',
      icon: <RiExchangeDollarLine className="w-6 h-6 text-gray-600" />,
      title: 'Wholesale & Resell',
      description: 'Manage different pricing for different channels',
      details: 'Create separate wholesale and resell pricing. Toggle stock status independently for each channel (IN or OUT). Organize products for wholesale distribution and resale.',
    },
    {
      id: 'backup',
      icon: <RiFileList2Line className="w-6 h-6 text-gray-600" />,
      title: 'Backup & Export',
      description: 'Protect your data with backups and exports',
      details: 'Create JSON backups of your complete product catalog. Export product data to CSV for analysis or import into other systems. Restore from backups anytime.',
    },
  ];

  const useCases = [
    {
      title: 'E-commerce Sellers',
      description: 'Manage product listings efficiently',
      benefits: ['Bulk editing', 'Professional images', 'Easy sharing'],
    },
    {
      title: 'Wholesale Distributors',
      description: 'Manage wholesale and resell separately',
      benefits: ['Two-tier pricing', 'Stock status tracking', 'Quick sharing'],
    },
    {
      title: 'Retail Businesses',
      description: 'Professional product management',
      benefits: ['Custom branding', 'Category organization', 'Mobile-friendly'],
    },
    {
      title: 'Small Businesses',
      description: 'Simple yet powerful inventory management',
      benefits: ['Easy to use', 'No setup required', 'Works offline'],
    },
  ];

  return (
    <div className="w-full max-w-xl mx-auto px-3 py-6">
      {/* Welcome Section */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F4b59de728c4149beae05f37141fcdb10%2Ff76700758c784ae1b7f01d6405d61f53?format=webp&width=800"
            alt="CatShare"
            className="w-14 h-14 rounded shadow"
          />
        </div>
        <h1 className="text-xl font-bold text-gray-600 mb-2">Welcome to CatShare</h1>
        <p className="text-sm text-gray-500 mb-1">
          Create, organize, and share your product catalog
        </p>
        <p className="text-xs text-gray-400">
          Professional product management for wholesale and resale businesses
        </p>
      </div>

      {/* Key Features Section */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-600 mb-4 flex items-center gap-2">
          <RiLightbulbFlashLine className="w-5 h-5 text-gray-700" />
          Key Features
        </h2>

        <div className="space-y-2">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow transition-shadow overflow-hidden"
            >
              <button
                onClick={() => toggleSection(feature.id)}
                className="w-full p-3 flex items-start gap-2 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="mt-0.5 shrink-0">{feature.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-gray-700">{feature.title}</h3>
                  <p className="text-xs text-gray-500">{feature.description}</p>
                </div>
                <FiChevronDown
                  className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                    expandedSection === feature.id ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              {expandedSection === feature.id && (
                <div className="px-3 pb-3 pt-2 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-700">{feature.details}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Diagram */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-600 mb-4">How It Works</h2>

        <div className="bg-gray-100 rounded-lg p-5 border border-gray-300">
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-500 text-gray-100 flex items-center justify-center font-bold text-sm shrink-0">
                  1
                </div>
                <div className="w-0.5 h-10 bg-gray-400 my-1" />
              </div>
              <div className="pt-0.5">
                <h3 className="font-semibold text-sm text-gray-700">Create Products</h3>
                <p className="text-xs text-gray-500">
                  Click the '+' button to add products with images, names, pricing, and details
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-500 text-gray-100 flex items-center justify-center font-bold text-sm shrink-0">
                  2
                </div>
                <div className="w-0.5 h-10 bg-gray-400 my-1" />
              </div>
              <div className="pt-0.5">
                <h3 className="font-semibold text-sm text-gray-700">Organize & Render</h3>
                <p className="text-xs text-gray-500">
                  Organize with categories, mark stock status, and render products as professional images
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-500 text-gray-100 flex items-center justify-center font-bold text-sm shrink-0">
                  3
                </div>
              </div>
              <div className="pt-0.5">
                <h3 className="font-semibold text-sm text-gray-700">Share & Manage</h3>
                <p className="text-xs text-gray-500">
                  Share images with customers, backup your data, and manage inventory
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-600 mb-4">Perfect For</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-300 p-3 hover:shadow transition-shadow"
            >
              <h3 className="font-semibold text-sm text-gray-700 mb-1">{useCase.title}</h3>
              <p className="text-xs text-gray-500 mb-2">{useCase.description}</p>
              <div className="space-y-1">
                {useCase.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <RiCheckLine className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Checklist */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-600 mb-4">What You Can Do</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            'Create unlimited products',
            'Upload product images',
            'Set wholesale & resell prices',
            'Mark stock IN or OUT',
            'Drag to reorder products',
            'Bulk edit items',
            'Render product images',
            'Backup with JSON',
            'Organize with categories',
            'Search products quickly',
            'Share rendered images',
            'Export as CSV',
          ].map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-gray-600">
              <RiCheckLine className="w-4 h-4 text-gray-600 shrink-0" />
              <span className="text-xs">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-600 rounded-lg p-6 text-center text-gray-50 mb-6">
        <h2 className="text-lg font-bold mb-2">Ready to Get Started?</h2>
        <p className="mb-4 text-xs text-gray-300">
          Create your first product in just a few seconds
        </p>
        <button
          onClick={onCreateProduct}
          className="inline-flex items-center gap-2 bg-gray-300 text-gray-700 font-semibold px-6 py-2 rounded-full hover:bg-gray-200 transition-colors shadow hover:shadow-md text-sm"
        >
          <FiPlus size={18} />
          Create Your First Product
        </button>
      </div>

      {/* Tips */}
      <div className="bg-gray-200 border border-gray-400 rounded-lg p-3 text-xs text-gray-700">
        <p className="font-semibold mb-1">💡 Pro Tip:</p>
        <p>
          Access the full tutorial anytime from the menu. Learn about bulk editing, JSON backups, image rendering, CSV export, and category management to maximize your productivity!
        </p>
      </div>
    </div>
  );
}
