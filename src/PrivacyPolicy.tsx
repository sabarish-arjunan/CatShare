import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <FiArrowLeft size={24} className="text-gray-800 dark:text-gray-200" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            Privacy Policy
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 text-gray-800 dark:text-gray-200">
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Last Updated: January 8, 2024
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Privacy Policy
            </h2>
            <p className="mb-4">
              CatShare ("we," "our," or "us") is committed to protecting your privacy. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your information when you
              use our mobile application and web platform (the "Service").
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              1. Information We Collect
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  1.1 Information You Provide Directly
                </h4>
                <ul className="list-disc list-inside space-y-2">
                  <li>Product information (names, descriptions, prices, images)</li>
                  <li>Category and inventory data</li>
                  <li>Backup files and catalog exports</li>
                  <li>Contact information if you reach out to support</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  1.2 Automatically Collected Information
                </h4>
                <ul className="list-disc list-inside space-y-2">
                  <li>Device information (model, OS, browser type)</li>
                  <li>Usage data (features used, time spent)</li>
                  <li>App performance metrics</li>
                  <li>Crash reports and error logs</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  1.3 Local Storage
                </h4>
                <p className="text-gray-700 dark:text-gray-300">
                  All product data is stored locally on your device. We do not send this data to
                  our servers unless you explicitly choose to backup and restore it.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              2. How We Use Your Information
            </h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Providing and improving the Service</li>
              <li>Processing backups and exports when requested</li>
              <li>Analyzing app performance and user behavior</li>
              <li>Responding to support requests</li>
              <li>Notifying you about service updates or changes</li>
              <li>Preventing fraud and ensuring security</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              3. Data Security
            </h3>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to protect your personal
              information against unauthorized access, alteration, disclosure, or destruction. However,
              no method of transmission over the Internet is 100% secure.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Important:</strong> Since most data is stored locally on your device, you are
                responsible for protecting your device from unauthorized access.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              4. Data Retention
            </h3>
            <p className="mb-4">
              Product data is retained on your device for as long as you maintain it. You can delete
              any data at any time through the app's interface. Backup files are retained for as long
              as you store them.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              5. Third-Party Services
            </h3>
            <p className="mb-4">
              Our app may use the following third-party services:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Capacitor:</strong> Mobile app framework for iOS/Android support
              </li>
              <li>
                <strong>Supabase:</strong> Optional backend service for data backup (only if you
                choose to connect)
              </li>
              <li>
                <strong>Analytics:</strong> App performance monitoring and crash reporting
              </li>
            </ul>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Each third-party service has its own privacy policy. We encourage you to review them.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              6. Your Rights
            </h3>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a standard format</li>
              <li>Opt-out of non-essential communications</li>
            </ul>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              To exercise these rights, please contact us at bazelwings@gmail.com
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              7. Children's Privacy
            </h3>
            <p>
              CatShare is not intended for children under 13. We do not knowingly collect personal
              information from children. If we discover that a child has provided us with personal
              information, we will immediately delete such information.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              8. Changes to This Privacy Policy
            </h3>
            <p>
              We may update this Privacy Policy periodically. We will notify you of any material
              changes by posting the new policy here and updating the "Last Updated" date. Your
              continued use of the Service constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-12">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              9. Contact Us
            </h3>
            <p className="mb-3">
              If you have questions about this Privacy Policy or our privacy practices, please contact
              us at:
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <p className="font-semibold text-gray-900 dark:text-white">CatShare Support</p>
              <p className="text-gray-600 dark:text-gray-400">Email: support@catshare.app</p>
              <p className="text-gray-600 dark:text-gray-400">Website: https://catshare.app</p>
            </div>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-8 pb-8">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © 2024 CatShare. All rights reserved. Created by Sabarish Arjunan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
