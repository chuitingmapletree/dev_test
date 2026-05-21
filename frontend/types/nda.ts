export interface Party {
  printName: string;
  title: string;
  company: string;
  noticeAddress: string;
}

export type MNDATermType = "expires" | "until_terminated";
export type ConfidentialityTermType = "years" | "perpetuity";

export interface NDAFormData {
  purpose: string;
  effectiveDate: string;
  mndaTermType: MNDATermType;
  mndaTermYears: number;
  confidentialityTermType: ConfidentialityTermType;
  confidentialityTermYears: number;
  governingLawState: string;
  jurisdictionCity: string;
  jurisdictionState: string;
  modifications: string;
  party1: Party;
  party2: Party;
}

export const defaultFormData: NDAFormData = {
  purpose: "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: new Date().toISOString().split("T")[0],
  mndaTermType: "expires",
  mndaTermYears: 1,
  confidentialityTermType: "years",
  confidentialityTermYears: 1,
  governingLawState: "",
  jurisdictionCity: "",
  jurisdictionState: "",
  modifications: "",
  party1: { printName: "", title: "", company: "", noticeAddress: "" },
  party2: { printName: "", title: "", company: "", noticeAddress: "" },
};
