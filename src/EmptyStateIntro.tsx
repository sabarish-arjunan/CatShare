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
  RiArrowDownLine,
  RiLighbulbFlashLine,
} from 'react-icons/ri';

export default function EmptyStateIntro({ onCreateProduct }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const features = [
    {
      id: 'create',
      icon: <RiShoppingBag3Line className="w-8 h-8 text-blue-600" />,
      title: 'Create Products',
      description: 'Build your product catalog with detailed information',
      details: 'Add product names, descriptions, pricing, categories, and high-quality images. Each product can have multiple variants and custom fields for your specific needs.',
    },
    {
      id: 'organize',
      icon: <RiImageAddLine className="w-8 h-8 text-purple-600" />,
      title: 'Organize & Manage',
      description: 'Keep your inventory organized and up-to-date',
      details: 'Drag to reorder products, categorize them, set stock levels, and manage wholesale vs. resell pricing. Bulk edit multiple items at once to save time.',
    },
    {
      id: 'share',
      icon: <RiShareForwardLine className="w-8 h-8 text-pink-600" />,
      title: 'Share with Customers',
      description: 'Export and share your catalog in multiple formats',
      details: 'Generate beautiful HTML previews, PDF catalogs, or image galleries. Share links with customers, retailers, or wholesalers across multiple channels.',
    },
    {
      id: 'collaborate',
      icon: <RiGroupLine className="w-8 h-8 text-green-600" />,
      title: 'Wholesale & Resell',
      description: 'Manage different pricing tiers for different channels',
      details: 'Create separate wholesale and resell pricing. Track inventory separately for each channel. Set stock status independently for wholesale and resale.',
    },
    {
      id: 'backup',
      icon: <RiFileList2Line className="w-8 h-8 text-orange-600" />,
      title: 'Backup & Restore',
      description: 'Never lose your data with automatic backups',
      details: 'Create backups of your entire catalog. Restore from previous versions anytime. Export your data in JSON format for safekeeping.',
    },
  ];

  const useCases = [
    {
      title: 'E-commerce Sellers',
      description: 'Manage multiple product listings across platforms',
      benefits: ['Multi-channel support', 'Bulk editing', 'Easy sharing'],
    },
    {
      title: 'Wholesale Distributors',
      description: 'Track wholesale and resell pricing separately',
      benefits: ['Two-tier pricing', 'Inventory tracking', 'Quick sharing'],
    },
    {
      title: 'Retail Businesses',
      description: 'Create beautiful catalogs for your customers',
      benefits: ['Professional previews', 'Mobile-friendly', 'Print-ready exports'],
    },
    {
      title: 'Small Businesses',
      description: 'Simple yet powerful inventory management',
      benefits: ['Easy to use', 'No setup required', 'Free & offline'],
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F4b59de728c4149beae05f37141fcdb10%2Ff76700758c784ae1b7f01d6405d61f53?format=webp&width=800"
            alt="CatShare"
            className="w-20 h-20 rounded-lg shadow-md"
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome to CatShare</h1>
        <p className="text-lg text-gray-600 mb-2">
          Your all-in-one product catalog and inventory management solution
        </p>
        <p className="text-sm text-gray-500">
          Create, organize, and share your product listings with customers across multiple channels
        </p>
      </div>

      {/* Key Features Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <RiLighbulbFlashLine className="w-6 h-6 text-yellow-500" />
          Key Features
        </h2>

        <div className="space-y-3">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <button
                onClick={() => toggleSection(feature.id)}
                className="w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="mt-1 shrink-0">{feature.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
                <FiChevronDown
                  className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${
                    expandedSection === feature.id ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              {expandedSection === feature.id && (
                <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
                  <p className="text-sm text-gray-700">{feature.details}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Diagram */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                  1
                </div>
                <div className="w-1 h-12 bg-blue-300 my-2" />
              </div>
              <div className="pt-1">
                <h3 className="font-semibold text-gray-900">Create Products</h3>
                <p className="text-sm text-gray-600">
                  Click the blue '+' button to add your first product with name, price, image, and details
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold shrink-0">
                  2
                </div>
                <div className="w-1 h-12 bg-purple-300 my-2" />
              </div>
              <div className="pt-1">
                <h3 className="font-semibold text-gray-900">Organize & Manage</h3>
                <p className="text-sm text-gray-600">
                  Drag to reorder, set stock levels, and manage wholesale vs resell pricing
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-pink-600 text-white flex items-center justify-center font-bold shrink-0">
                  3
                </div>
              </div>
              <div className="pt-1">
                <h3 className="font-semibold text-gray-900">Share with Customers</h3>
                <p className="text-sm text-gray-600">
                  Export as HTML, PDF, or share links with your customers and retailers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases Grid */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Perfect For</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-900 mb-2">{useCase.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{useCase.description}</p>
              <div className="space-y-1">
                {useCase.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                    <RiCheckLine className="w-4 h-4 text-green-600 shrink-0" />
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Checklist */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">What You Can Do</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Create unlimited products',
            'Upload multiple images',
            'Set wholesale & resell prices',
            'Track inventory levels',
            'Drag to reorder products',
            'Bulk edit items',
            'Export as HTML/PDF',
            'Create backups',
            'Organize with categories',
            'Search products quickly',
            'Share with customers',
            'Works offline',
          ].map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-gray-700">
              <RiCheckLine className="w-5 h-5 text-green-600 shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white mb-8">
        <h2 className="text-2xl font-bold mb-3">Ready to Get Started?</h2>
        <p className="mb-6 text-blue-100">
          Create your first product in just a few seconds
        </p>
        <button
          onClick={onCreateProduct}
          className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-8 py-3 rounded-full hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl"
        >
          <FiPlus size={20} />
          Create Your First Product
        </button>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <p className="font-semibold mb-2">💡 Pro Tip:</p>
        <p>
          You can access the full tutorial anytime from the menu. Check out features like bulk editing, backup & restore, and multi-format exports to maximize your productivity!
        </p>
      </div>
    </div>
  );
}
