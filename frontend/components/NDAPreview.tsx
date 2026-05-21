"use client";

import { NDAFormData } from "@/types/nda";

interface Props {
  data: NDAFormData;
  standardTerms?: string;
}

function formatDate(isoDate: string): string {
  if (!isoDate) return "[Effective Date]";
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function SignatureTable({ data }: { data: NDAFormData }) {
  const rows: { label: string; key1: string; key2: string }[] = [
    { label: "Print Name", key1: data.party1.printName, key2: data.party2.printName },
    { label: "Title", key1: data.party1.title, key2: data.party2.title },
    { label: "Company", key1: data.party1.company, key2: data.party2.company },
    { label: "Notice Address", key1: data.party1.noticeAddress, key2: data.party2.noticeAddress },
  ];

  return (
    <table className="w-full border-collapse text-sm mt-2">
      <thead>
        <tr>
          <th className="border border-gray-400 px-3 py-2 text-left w-1/4 bg-gray-50"></th>
          <th className="border border-gray-400 px-3 py-2 text-center w-3/8 bg-gray-50">
            {data.party1.company || "Party 1"}
          </th>
          <th className="border border-gray-400 px-3 py-2 text-center w-3/8 bg-gray-50">
            {data.party2.company || "Party 2"}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-gray-400 px-3 py-4 text-gray-600 text-xs font-medium">
            Signature
          </td>
          <td className="border border-gray-400 px-3 py-4">&nbsp;</td>
          <td className="border border-gray-400 px-3 py-4">&nbsp;</td>
        </tr>
        {rows.map(({ label, key1, key2 }) => (
          <tr key={label}>
            <td className="border border-gray-400 px-3 py-2 text-gray-600 text-xs font-medium">
              {label}
            </td>
            <td className="border border-gray-400 px-3 py-2 whitespace-pre-wrap">{key1}</td>
            <td className="border border-gray-400 px-3 py-2 whitespace-pre-wrap">{key2}</td>
          </tr>
        ))}
        <tr>
          <td className="border border-gray-400 px-3 py-2 text-gray-600 text-xs font-medium">
            Date
          </td>
          <td className="border border-gray-400 px-3 py-2">&nbsp;</td>
          <td className="border border-gray-400 px-3 py-2">&nbsp;</td>
        </tr>
      </tbody>
    </table>
  );
}

function renderStandardTerms(markdown: string) {
  const toHtml = (text: string) =>
    text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  return markdown
    .split(/\n\n+/)
    .map((block, i) => {
      const trimmed = block.trim();
      if (!trimmed) return null;
      if (trimmed.startsWith("# ")) {
        return (
          <h2 key={i} className="text-lg font-bold mt-6 mb-3">
            {trimmed.slice(2)}
          </h2>
        );
      }
      return (
        <p
          key={i}
          className="mb-3 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: toHtml(trimmed) }}
        />
      );
    });
}

export default function NDAPreview({ data, standardTerms }: Props) {
  const mndaTerm =
    data.mndaTermType === "expires"
      ? `Expires ${data.mndaTermYears} year(s) from Effective Date.`
      : "Continues until terminated in accordance with the terms of the MNDA.";

  const confidentialityTerm =
    data.confidentialityTermType === "years"
      ? `${data.confidentialityTermYears} year(s) from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`
      : "In perpetuity.";

  const jurisdiction =
    data.jurisdictionCity && data.jurisdictionState
      ? `courts located in ${data.jurisdictionCity}, ${data.jurisdictionState}`
      : "[Jurisdiction]";

  return (
    <div
      id="nda-preview"
      className="bg-white p-8 text-gray-900 font-serif text-sm leading-relaxed max-w-none"
    >
      <h1 className="text-2xl font-bold text-center mb-6">
        Mutual Non-Disclosure Agreement
      </h1>

      <div className="text-xs text-gray-500 mb-6 p-3 bg-gray-50 rounded border border-gray-200">
        This Mutual Non-Disclosure Agreement (the &ldquo;MNDA&rdquo;) consists of: (1) this Cover
        Page (&ldquo;Cover Page&rdquo;) and (2) the Common Paper Mutual NDA Standard Terms Version
        1.0 (&ldquo;Standard Terms&rdquo;) identical to those posted at{" "}
        <a
          href="https://commonpaper.com/standards/mutual-nda/1.0"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          commonpaper.com/standards/mutual-nda/1.0
        </a>
        . Any modifications of the Standard Terms should be made on the Cover Page, which will
        control over conflicts with the Standard Terms.
      </div>

      {/* Purpose */}
      <section className="mb-5">
        <h2 className="text-base font-bold mb-1">Purpose</h2>
        <p className="text-xs text-gray-500 italic mb-1">
          How Confidential Information may be used
        </p>
        <p>{data.purpose || "[Purpose]"}</p>
      </section>

      {/* Effective Date */}
      <section className="mb-5">
        <h2 className="text-base font-bold mb-1">Effective Date</h2>
        <p>{formatDate(data.effectiveDate)}</p>
      </section>

      {/* MNDA Term */}
      <section className="mb-5">
        <h2 className="text-base font-bold mb-1">MNDA Term</h2>
        <p className="text-xs text-gray-500 italic mb-1">The length of this MNDA</p>
        <p>{mndaTerm}</p>
      </section>

      {/* Term of Confidentiality */}
      <section className="mb-5">
        <h2 className="text-base font-bold mb-1">Term of Confidentiality</h2>
        <p className="text-xs text-gray-500 italic mb-1">
          How long Confidential Information is protected
        </p>
        <p>{confidentialityTerm}</p>
      </section>

      {/* Governing Law & Jurisdiction */}
      <section className="mb-5">
        <h2 className="text-base font-bold mb-1">Governing Law &amp; Jurisdiction</h2>
        <p>
          <strong>Governing Law:</strong>{" "}
          {data.governingLawState || "[Governing Law State]"}
        </p>
        <p>
          <strong>Jurisdiction:</strong> {jurisdiction}
        </p>
      </section>

      {/* MNDA Modifications */}
      <section className="mb-5">
        <h2 className="text-base font-bold mb-1">MNDA Modifications</h2>
        <p className="whitespace-pre-wrap">
          {data.modifications || "None."}
        </p>
      </section>

      {/* Signature block */}
      <section id="signature-section" className="mb-6">
        <p className="mb-3 text-sm">
          By signing this Cover Page, each party agrees to enter into this MNDA as of the
          Effective Date.
        </p>
        <SignatureTable data={data} />
      </section>

      {/* Standard Terms */}
      {standardTerms && (
        <section className="border-t pt-6 mt-2">
          {renderStandardTerms(standardTerms)}
        </section>
      )}
    </div>
  );
}
