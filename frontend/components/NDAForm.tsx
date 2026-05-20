"use client";

import { NDAFormData, Party } from "@/types/nda";

interface Props {
  data: NDAFormData;
  onChange: (data: NDAFormData) => void;
}

function PartyFields({
  label,
  party,
  onChange,
}: {
  label: string;
  party: Party;
  onChange: (p: Party) => void;
}) {
  const field = (key: keyof Party, placeholder: string, multiline = false) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
        {key.replace(/([A-Z])/g, " $1")}
      </label>
      {multiline ? (
        <textarea
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder={placeholder}
          value={party[key]}
          onChange={(e) => onChange({ ...party, [key]: e.target.value })}
        />
      ) : (
        <input
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
          value={party[key]}
          onChange={(e) => onChange({ ...party, [key]: e.target.value })}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
      {field("printName", "Jane Smith")}
      {field("title", "CEO")}
      {field("company", "Acme Corp")}
      {field("noticeAddress", "jane@acme.com or 123 Main St, City, ST 00000", true)}
    </div>
  );
}

export default function NDAForm({ data, onChange }: Props) {
  const set = <K extends keyof NDAFormData>(key: K, value: NDAFormData[K]) =>
    onChange({ ...data, [key]: value });

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      {/* Purpose */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Purpose
          <span className="text-xs font-normal text-gray-500 ml-1">
            — how confidential information may be used
          </span>
        </label>
        <textarea
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          value={data.purpose}
          onChange={(e) => set("purpose", e.target.value)}
        />
      </div>

      {/* Effective Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Effective Date
        </label>
        <input
          type="date"
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={data.effectiveDate}
          onChange={(e) => set("effectiveDate", e.target.value)}
        />
      </div>

      {/* MNDA Term */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          MNDA Term
          <span className="text-xs font-normal text-gray-500 ml-1">
            — length of this MNDA
          </span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="mndaTermType"
              checked={data.mndaTermType === "expires"}
              onChange={() => set("mndaTermType", "expires")}
              className="text-blue-600"
            />
            <span className="text-sm">Expires</span>
            <input
              type="number"
              min={1}
              className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={data.mndaTermYears}
              onChange={(e) => set("mndaTermYears", Number(e.target.value))}
              disabled={data.mndaTermType !== "expires"}
            />
            <span className="text-sm">year(s) from Effective Date</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="mndaTermType"
              checked={data.mndaTermType === "until_terminated"}
              onChange={() => set("mndaTermType", "until_terminated")}
              className="text-blue-600"
            />
            <span className="text-sm">
              Continues until terminated in accordance with the terms of the MNDA
            </span>
          </label>
        </div>
      </div>

      {/* Term of Confidentiality */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Term of Confidentiality
          <span className="text-xs font-normal text-gray-500 ml-1">
            — how long confidential information is protected
          </span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="confidentialityTermType"
              checked={data.confidentialityTermType === "years"}
              onChange={() => set("confidentialityTermType", "years")}
              className="text-blue-600"
            />
            <input
              type="number"
              min={1}
              className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={data.confidentialityTermYears}
              onChange={(e) => set("confidentialityTermYears", Number(e.target.value))}
              disabled={data.confidentialityTermType !== "years"}
            />
            <span className="text-sm">
              year(s) from Effective Date (trade secrets protected until no longer a trade secret)
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="confidentialityTermType"
              checked={data.confidentialityTermType === "perpetuity"}
              onChange={() => set("confidentialityTermType", "perpetuity")}
              className="text-blue-600"
            />
            <span className="text-sm">In perpetuity</span>
          </label>
        </div>
      </div>

      {/* Governing Law & Jurisdiction */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Governing Law &amp; Jurisdiction
        </label>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Governing Law — State
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Delaware"
            value={data.governingLawState}
            onChange={(e) => set("governingLawState", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Jurisdiction City / County
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. New Castle"
              value={data.jurisdictionCity}
              onChange={(e) => set("jurisdictionCity", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Jurisdiction State
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. DE"
              value={data.jurisdictionState}
              onChange={(e) => set("jurisdictionState", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* MNDA Modifications */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          MNDA Modifications
          <span className="text-xs font-normal text-gray-500 ml-1">— optional</span>
        </label>
        <textarea
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="List any modifications to the standard terms…"
          value={data.modifications}
          onChange={(e) => set("modifications", e.target.value)}
        />
      </div>

      {/* Parties */}
      <div className="border-t pt-5 space-y-6">
        <PartyFields
          label="Party 1"
          party={data.party1}
          onChange={(p) => set("party1", p)}
        />
        <PartyFields
          label="Party 2"
          party={data.party2}
          onChange={(p) => set("party2", p)}
        />
      </div>
    </form>
  );
}
