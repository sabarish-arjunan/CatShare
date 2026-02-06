import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdArrowBack,
  MdAutoAwesome,
  MdCloud,
  MdLightbulb,
  MdSecurity,
  MdSpeed,
  MdLocalShipping,
  MdCategory,
  MdImage,
  MdEdit,
  MdDownload,
  MdShoppingBag,
} from "react-icons/md";

export default function Website() {
  const navigate = useNavigate();
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  const features = [
    {
      id: "smart-catalog",
      icon: <MdAutoAwesome className="w-8 h-8" />,
      title: "Smart Catalog Management",
      description:
        "Organize your products into multiple catalogs with custom fields. Create different catalogs for retail, wholesale, resell, or any business model.",
      details:
        "Manage unlimited products with custom fields. Auto-generate product images with watermarks. Drag-and-drop interface for easy organization.",
    },
    {
      id: "image-rendering",
      icon: <MdImage className="w-8 h-8" />,
      title: "Advanced Image Rendering",
      description:
        "Automatically render product images as PNG files with customizable watermarks for sharing with customers.",
      details:
        "Batch render all product images at once. Add custom watermarks with text and positioning options. Render in high quality for professional presentations.",
    },
    {
      id: "backup-sync",
      icon: <MdCloud className="w-8 h-8" />,
      title: "Backup & Restore",
      description:
        "Never lose your data. Create complete backups of all products and catalogs and restore them instantly.",
      details:
        "One-click backup and download. Restore from any backup file. Includes all product images and catalog settings. Version-controlled backup format.",
    },
    {
      id: "bulk-editing",
      icon: <MdEdit className="w-8 h-8" />,
      title: "Bulk Editing",
      description:
        "Update multiple products at once. Edit fields, categories, prices, and more for your entire catalog.",
      details:
        "Select multiple products and edit together. Update prices and categories in bulk. Maintain consistency across your catalog.",
    },
    {
      id: "multi-channel",
      icon: <MdShoppingBag className="w-8 h-8" />,
      title: "Multi-Channel Support",
      description:
        "Manage retail, wholesale, and resell catalogs from a single platform with different pricing and terms.",
      details:
        "Create separate catalogs for different business models. Custom fields for each catalog type. Seamless switching between channels.",
    },
    {
      id: "fast-performance",
      icon: <MdSpeed className="w-8 h-8" />,
      title: "Lightning Fast Performance",
      description:
        "Optimized for speed with background image rendering. Works offline with instant syncing when online.",
      details:
        "Background rendering service keeps your app responsive. Offline-first architecture. Automatic sync with cloud storage.",
    },
    {
      id: "media-library",
      icon: <MdImage className="w-8 h-8" />,
      title: "Media Library",
      description:
        "Organize and manage all your product images in one centralized library with search and preview.",
      details:
        "Upload and organize images easily. Search by product name or category. Preview images before using them.",
    },
    {
      id: "security",
      icon: <MdSecurity className="w-8 h-8" />,
      title: "Secure & Private",
      description:
        "Your data is yours. All information is stored locally with optional cloud backup for peace of mind.",
      details:
        "End-to-end encrypted backups. Local-first storage architecture. Privacy-focused design. No tracking or analytics.",
    },
  ];

  const timeline = [
    {
      year: "2024 Q1",
      title: "Genesis - CatShare Launched",
      description:
        "CatShare was born to solve the problem of managing product catalogs for small businesses and entrepreneurs. The first version featured basic catalog management and image rendering.",
      highlight: true,
    },
    {
      year: "2024 Q2",
      title: "Smart Features",
      description:
        "Added bulk editing capabilities, multiple catalog support, and advanced watermark customization to make managing larger catalogs easier.",
      highlight: false,
    },
    {
      year: "2024 Q3",
      title: "Multi-Channel Growth",
      description:
        "Introduced retail, wholesale, and resell catalog support allowing businesses to manage multiple sales channels from one app.",
      highlight: false,
    },
    {
      year: "2024 Q4",
      title: "Cloud Integration & Backup",
      description:
        "Implemented robust backup and restore functionality with version control. Added cloud synchronization for peace of mind.",
      highlight: false,
    },
    {
      year: "2025 - Present",
      title: "Continuous Innovation",
      description:
        "Building on community feedback with regular updates, performance improvements, and new features to stay at the cutting edge of catalog management.",
      highlight: false,
    },
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      {/* Header with Back Button */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
          >
            <MdArrowBack className="w-6 h-6" />
            <span className="font-medium">Back</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">CatShare</h1>
          <div className="w-16" />
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 text-center bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            Welcome to CatShare
          </h2>
          <p className="text-xl mb-8 opacity-90">
            The ultimate catalog management platform for modern business owners
          </p>
          <p className="text-lg opacity-80">
            Manage your products, render stunning images, and streamline your
            business operations—all in one beautiful app.
          </p>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-12 px-4 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">∞</div>
            <p className="text-gray-700 font-medium">Unlimited Products</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">Multiple</div>
            <p className="text-gray-700 font-medium">Catalogs & Channels</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
            <p className="text-gray-700 font-medium">Your Data, Locally Stored</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Powerful Features
          </h3>
          <p className="text-center text-gray-600 text-lg mb-12">
            Everything you need to manage your business catalog
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div
                key={feature.id}
                onClick={() =>
                  setExpandedFeature(
                    expandedFeature === feature.id ? null : feature.id
                  )
                }
                className={`bg-white rounded-xl shadow-md hover:shadow-lg transition cursor-pointer overflow-hidden border-2 ${
                  expandedFeature === feature.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-transparent hover:border-blue-200"
                }`}
              >
                <div className="p-6">
                  <div className="text-blue-600 mb-4">{feature.icon}</div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 mb-4">{feature.description}</p>

                  {expandedFeature === feature.id && (
                    <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded mt-4 text-sm text-gray-800">
                      {feature.details}
                    </div>
                  )}

                  <div className="text-blue-600 text-sm font-medium mt-4">
                    {expandedFeature === feature.id ? "Click to collapse" : "Click to learn more"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-gray-50 border-y border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-4xl font-bold text-center text-gray-900 mb-12">
            How CatShare Works
          </h3>

          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Create Your Catalogs
                </h4>
                <p className="text-gray-600">
                  Set up different catalogs for different business models (retail, wholesale, resell). Define custom fields that matter to your business.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Add Your Products
                </h4>
                <p className="text-gray-600">
                  Import or manually add products with images, descriptions, prices, and custom fields. Use bulk editing to manage large inventories.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Render & Share
                </h4>
                <p className="text-gray-600">
                  Render product images with your custom watermark. Download or share your catalog images instantly with customers.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Backup & Scale
                </h4>
                <p className="text-gray-600">
                  Backup your complete catalog at any time. Restore instantly if needed. Scale your business without worrying about data loss.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline - History Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Our Journey
          </h3>
          <p className="text-center text-gray-600 text-lg mb-12">
            From concept to your favorite catalog management tool
          </p>

          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-600" />

            {/* Timeline Items */}
            <div className="space-y-12">
              {timeline.map((event, index) => (
                <div
                  key={index}
                  className={`relative md:flex items-center ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Timeline Dot */}
                  <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center">
                    <div
                      className={`w-4 h-4 rounded-full border-4 ${
                        event.highlight
                          ? "bg-blue-600 border-white shadow-lg"
                          : "bg-white border-blue-400"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className={`w-full md:w-1/2 ${index % 2 === 0 ? "md:pr-12" : "md:pl-12"}`}>
                    <div
                      className={`p-6 rounded-lg border-2 ${
                        event.highlight
                          ? "bg-blue-100 border-blue-500 shadow-md"
                          : "bg-white border-gray-200 hover:border-blue-300"
                      } transition`}
                    >
                      <div className="text-sm font-bold text-blue-600 uppercase tracking-wide">
                        {event.year}
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mt-2 mb-2">
                        {event.title}
                      </h4>
                      <p className="text-gray-600">{event.description}</p>
                      {event.highlight && (
                        <div className="mt-3 text-sm text-blue-700 font-semibold">
                          ⭐ Major milestone
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-16 px-4 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose CatShare?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4 items-start">
              <div className="w-6 h-6 text-green-500 flex-shrink-0 mt-1">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Easy to Use</h4>
                <p className="text-gray-600 text-sm">
                  Intuitive interface designed for busy business owners
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-6 h-6 text-green-500 flex-shrink-0 mt-1">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Privacy First</h4>
                <p className="text-gray-600 text-sm">
                  Your data stays with you, encrypted and secure
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-6 h-6 text-green-500 flex-shrink-0 mt-1">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Always Accessible</h4>
                <p className="text-gray-600 text-sm">
                  Works offline and syncs automatically when online
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-6 h-6 text-green-500 flex-shrink-0 mt-1">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Constantly Improving</h4>
                <p className="text-gray-600 text-sm">
                  Regular updates with new features based on user feedback
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-6 h-6 text-green-500 flex-shrink-0 mt-1">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Free & Open</h4>
                <p className="text-gray-600 text-sm">
                  No hidden costs, no subscriptions, no tracking
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-6 h-6 text-green-500 flex-shrink-0 mt-1">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Cross Platform</h4>
                <p className="text-gray-600 text-sm">
                  Works on web, iOS, and Android seamlessly
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold mb-6">
            Ready to Transform Your Business?
          </h3>
          <p className="text-lg mb-8 opacity-90">
            Start managing your catalog like a pro today
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition shadow-lg"
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="mb-4">
            Made with ❤️ by the CatShare team for business owners everywhere
          </p>
          <p className="text-sm">
            © 2024 CatShare. All rights reserved. | Created by BazelWings
          </p>
        </div>
      </footer>
    </div>
  );
}
