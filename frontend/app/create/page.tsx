"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NDAChat from "@/components/NDAChat";
import NDAForm from "@/components/NDAForm";
import NDAPreview from "@/components/NDAPreview";
import { NDAFormData, defaultFormData } from "@/types/nda";

export default function Create() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [formData, setFormData] = useState<NDAFormData>(defaultFormData);
  const [standardTerms, setStandardTerms] = useState<string>("");
  const [viewMode, setViewMode] = useState<"chat" | "form">("chat");

  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") !== "true") {
      router.replace("/");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  useEffect(() => {
    fetch("/templates/Mutual-NDA.md")
      .then((r) => { if (r.ok) return r.text(); })
      .then((text) => { if (text) setStandardTerms(text); })
      .catch(() => {});
  }, []);

  if (isChecking) return null;

  const handleSignOut = () => {
    localStorage.removeItem("isLoggedIn");
    router.push("/");
  };

  const handleDownload = async () => {
    const element = document.getElementById("nda-preview");
    if (!element) return;

    const { toJpeg } = await import("html-to-image");
    const { jsPDF } = await import("jspdf");

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidthMm = pdf.internal.pageSize.getWidth();
    const pageHeightMm = pdf.internal.pageSize.getHeight();

    // Page height in screen pixels (same ratio as mm dimensions)
    const pageHeightPx = (pageHeightMm / pageWidthMm) * element.offsetWidth;

    // Push the signature section to the next page if it would be cut
    const sigSection = document.getElementById("signature-section");
    let addedPadding = 0;
    if (sigSection) {
      const elTop = sigSection.getBoundingClientRect().top - element.getBoundingClientRect().top;
      const nextBreak = (Math.floor(elTop / pageHeightPx) + 1) * pageHeightPx;
      const elBottom = elTop + sigSection.offsetHeight;
      if (elBottom > nextBreak) {
        addedPadding = nextBreak - elTop;
        sigSection.style.paddingTop = `${addedPadding}px`;
      }
    }

    const dataUrl = await toJpeg(element, { pixelRatio: 1.5, quality: 0.88, backgroundColor: "#ffffff" });

    if (sigSection && addedPadding) {
      sigSection.style.paddingTop = "";
    }

    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((resolve) => { img.onload = () => resolve(); });

    const imgHeightMm = (img.naturalHeight / img.naturalWidth) * pageWidthMm;
    let heightLeft = imgHeightMm;
    let position = 0;

    pdf.addImage(dataUrl, "JPEG", 0, position, pageWidthMm, imgHeightMm);
    heightLeft -= pageHeightMm;

    while (heightLeft > 0) {
      position -= pageHeightMm;
      pdf.addPage();
      pdf.addImage(dataUrl, "JPEG", 0, position, pageWidthMm, imgHeightMm);
      heightLeft -= pageHeightMm;
    }

    const date = new Date().toISOString().split("T")[0];
    pdf.save(`mutual-nda-${date}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "#032147" }}>
              Mutual NDA Creator
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#888888" }}>
              Based on{" "}
              <a
                href="https://commonpaper.com/standards/mutual-nda/1.0"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ color: "#209dd7" }}
              >
                Common Paper Mutual NDA Standard Terms v1.0
              </a>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: "#753991" }}
            >
              <DownloadIcon />
              Download PDF
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[520px]">
          {/* Tab toggle */}
          <div className="px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              {(["chat", "form"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className="flex-1 py-2 text-sm font-medium capitalize transition-colors cursor-pointer"
                  style={
                    viewMode === mode
                      ? { backgroundColor: "#032147", color: "#fff" }
                      : { backgroundColor: "#fff", color: "#555" }
                  }
                >
                  {mode === "chat" ? "Chat with AI" : "Fill Form"}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 flex-1 min-h-0 flex flex-col">
            {viewMode === "chat" ? (
              <NDAChat data={formData} onChange={setFormData} />
            ) : (
              <div className="overflow-y-auto flex-1">
                <NDAForm data={formData} onChange={setFormData} />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h2 className="text-base font-semibold" style={{ color: "#032147" }}>
              Live Preview
            </h2>
            <span className="text-xs" style={{ color: "#888888" }}>Updates as you type</span>
          </div>
          <div className="p-2 overflow-auto flex-1">
            <NDAPreview data={formData} standardTerms={standardTerms} />
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
