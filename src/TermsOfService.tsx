import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

export default function TermsOfService() {
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
            Terms of Service
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 text-gray-800 dark:text-gray-200">
        <div className="prose dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Terms of Service
            </h2>
            <p className="mb-4">
              Welcome to CatShare. These Terms of Service ("Terms") govern your use of our mobile
              application and web platform (the "Service"). By accessing or using CatShare, you agree
              to be bound by these Terms. If you do not agree to any part of these Terms, you may not
              use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              1. Use License
            </h3>
            <p className="mb-4">
              We grant you a limited, non-exclusive, non-transferable, revocable license to use
              CatShare for your personal and business purposes, subject to these Terms.
            </p>
            <p className="mb-2 font-semibold text-gray-900 dark:text-white">You may NOT:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Modify or copy the software or Service</li>
              <li>Attempt to decompile or reverse engineer the application</li>
              <li>Remove any copyright or proprietary notices</li>
              <li>Transfer or sublicense the Service to third parties</li>
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              2. Acceptable Use Policy
            </h3>
            <p className="mb-4">
              You agree to use CatShare only for lawful purposes and in a way that does not infringe
              upon the rights of others or restrict their use and enjoyment of the Service.
            </p>
            <p className="mb-2 font-semibold text-gray-900 dark:text-white">
              Prohibited behavior includes:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Harassing or causing distress to any person</li>
              <li>Transmitting malware or corrupted data</li>
              <li>Engaging in unlawful activity or fraud</li>
              <li>Violating intellectual property rights</li>
              <li>Accessing the Service without authorization</li>
              <li>Interfering with the proper working of the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              3. Intellectual Property Rights
            </h3>
            <p className="mb-4">
              CatShare and all its contents, features, and functionality (including but not limited to
              all information, software, code, and designs) are owned by CatShare, its licensors, or
              other providers of such material and are protected by international copyright,
              trademark, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              4. User Content
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  4.1 Your Responsibility
                </h4>
                <p>
                  You are responsible for all product data, images, and information you create or
                  upload to CatShare. You represent and warrant that you own or have the right to use
                  all content you provide.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  4.2 License to Content
                </h4>
                <p>
                  By uploading content to CatShare, you grant us a limited license to use, store, and
                  process your content solely for the purpose of providing the Service.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  4.3 Data Ownership
                </h4>
                <p>
                  You retain full ownership of all product data and content created in CatShare. We
                  do not claim ownership of your data.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              5. Disclaimer of Warranties
            </h3>
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-4 rounded mb-4">
              <p className="text-yellow-900 dark:text-yellow-200">
                <strong>THE SERVICE IS PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS.</strong> WE
                DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY,
                FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
            </div>
            <p>
              We do not warrant that the Service will be uninterrupted, secure, or error-free. Your use
              of the Service is at your own risk.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              6. Limitation of Liability
            </h3>
            <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-900 dark:text-red-200">
                <strong>IN NO EVENT SHALL CATSHARE, ITS DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR
                ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</strong>
                arising out of or relating to your use of or inability to use the Service.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              7. Indemnification
            </h3>
            <p>
              You agree to indemnify and hold harmless CatShare and its officers, directors, employees,
              and agents from any and all claims, damages, losses, or costs (including legal fees) arising
              out of or relating to your use of the Service or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              8. Termination
            </h3>
            <p className="mb-4">
              We may terminate or suspend your access to CatShare at any time, without cause or notice,
              if we believe in our sole discretion that you have violated these Terms or any applicable laws.
            </p>
            <p>
              Upon termination, your right to use the Service will immediately cease. Your product data
              will remain on your device and can be exported at any time before termination.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              9. Changes to Terms
            </h3>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of material changes
              by updating this page. Your continued use of the Service after such modifications constitutes
              acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              10. Governing Law
            </h3>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction
              in which CatShare is operated, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              11. Data Backup Responsibility
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-blue-900 dark:text-blue-200">
                <strong>Important:</strong> While we provide backup and restore functionality, you are
                responsible for maintaining regular backups of your product data. CatShare is not liable
                for any loss of data due to device failure, accidental deletion, or other causes.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              12. Export and Portability
            </h3>
            <p>
              CatShare allows you to export your data in ZIP format. You can access and
              export your data at any time to ensure portability and prevent vendor lock-in.
            </p>
          </section>

          <section className="mb-12">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              13. Contact Us
            </h3>
            <p className="mb-3">
              If you have any questions about these Terms or need to report a violation, please contact us at:
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <p className="font-semibold text-gray-900 dark:text-white">CatShare Support</p>
              <p className="text-gray-600 dark:text-gray-400">Email: bazelwings@gmail.com</p>
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
