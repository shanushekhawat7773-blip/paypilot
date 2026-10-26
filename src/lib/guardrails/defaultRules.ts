import { UserRulesConfig, Payee } from "@/types/payment";

export const DEFAULT_RULES: UserRulesConfig = {
  monthlyBudget: 3500, // $3,500 monthly budget
  perPaymentCap: 1000, // $1,000 hard cap on single payment
  askAboveThreshold: 150, // payments over $150 require approval unless payee has pre-approved limit
  approvedPayeesOnly: false,
  holdUnapprovedPayees: true,
  blockedCategories: ["ENTERTAINMENT"],
  dailyVelocityLimit: 6, // max 6 payments / 24h
  duplicateWindowHours: 24,
};

export const INITIAL_APPROVED_PAYEES: Payee[] = [
  {
    id: "payee-riya",
    name: "Riya Sharma",
    identifier: "riya.design@example.com",
    type: "EMAIL",
    isApproved: true,
    addedAt: "2024-01-15T09:00:00Z",
    tags: ["Contractor", "Design", "Verified"],
    historicalAverage: 200,
    totalPaidToDate: 1400,
    maxPreApprovedLimit: 250,
  },
  {
    id: "payee-aws",
    name: "Amazon Web Services",
    identifier: "aws-billing@amazon.com",
    type: "EMAIL",
    isApproved: true,
    addedAt: "2023-11-01T12:00:00Z",
    tags: ["Infrastructure", "Cloud"],
    historicalAverage: 85,
    totalPaidToDate: 1020,
  },
  {
    id: "payee-github",
    name: "GitHub Inc",
    identifier: "billing@github.com",
    type: "EMAIL",
    isApproved: true,
    addedAt: "2023-08-20T10:00:00Z",
    tags: ["Dev Tools", "Software"],
    historicalAverage: 21,
    totalPaidToDate: 252,
  },
  {
    id: "payee-namesilo",
    name: "Domain Registrar Co",
    identifier: "domains@registrar-services.com",
    type: "EMAIL",
    isApproved: true,
    addedAt: "2024-02-10T14:30:00Z",
    tags: ["Domains", "Utilities"],
    historicalAverage: 14,
    totalPaidToDate: 56,
  },
];
