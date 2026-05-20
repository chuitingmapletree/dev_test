"use client";

import { useState } from "react";
import NDAForm from "@/components/NDAForm";
import NDAPreview from "@/components/NDAPreview";
import { NDAFormData, defaultFormData } from "@/types/nda";

export default function Home() {
  const [formData, setFormData] = useState<NDAFormData>(defaultFormData);

  const handleDownload = async () => {
    const element = document.getElementById("nda-preview");
    if (!element) return;

    const { toJpeg } = await import("html-to-image");
    const { jsPDF } = await import("jspdf");

    const dataUrl = await toJpeg(element, { pixelRatio: 1.5, quality: 0.88, backgroundColor: "#ffffff" });

    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve) => { img.onload = resolve; });

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (img.naturalHeight * pageWidth) / img.naturalWidth;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(dataUrl, "JPEG", 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(dataUrl, "JPEG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const date = new Date().toISOString().split("T")[0];
    pdf.save(`mutual-nda-${date}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Mutual NDA Creator</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Based on{" "}
              <a
                href="https://commonpaper.com/standards/mutual-nda/1.0"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Common Paper Mutual NDA Standard Terms v1.0
              </a>
            </p>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <DownloadIcon />
            Download PDF
          </button>
        </div>
      </header>

      {/* Main two-column layout */}
      <main className="max-w-screen-xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Form panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">Enter NDA Details</h2>
          <NDAForm data={formData} onChange={setFormData} />
        </div>

        {/* Preview panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h2 className="text-base font-semibold text-gray-800">Live Preview</h2>
            <span className="text-xs text-gray-400">Updates as you type</span>
          </div>
          <div className="p-2 overflow-auto flex-1">
            <NDAPreview data={formData} />
          </div>
        </div>
      </main>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );
}
