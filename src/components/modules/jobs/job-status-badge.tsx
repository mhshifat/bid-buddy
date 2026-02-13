import { Badge } from "@/components/ui/badge";

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  NEW: {
    label: "New",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  ANALYZED: {
    label: "Analyzed",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
  SHORTLISTED: {
    label: "Shortlisted",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  },
  BIDDING: {
    label: "Bidding",
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  },
  BID_SENT: {
    label: "Bid Sent",
    className:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  },
  INTERVIEWING: {
    label: "Interviewing",
    className: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  },
  ACCEPTED: {
    label: "Accepted",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  },
  SKIPPED: {
    label: "Skipped",
    className: "bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-400",
  },
  FLAGGED: {
    label: "Flagged",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  },
};

interface JobStatusBadgeProps {
  status: string;
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "",
  };

  return (
    <Badge variant="secondary" className={`text-[10px] ${config.className}`}>
      {config.label}
    </Badge>
  );
}

