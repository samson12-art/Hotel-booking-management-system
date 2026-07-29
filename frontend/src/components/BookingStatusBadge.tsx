const statusConfig: Record<string, { className: string }> = {
  PENDING: { className: "badge badge-yellow" },
  CONFIRMED: { className: "badge badge-blue" },
  CHECKED_IN: { className: "badge badge-green" },
  CHECKED_OUT: { className: "badge badge-gray" },
  CANCELLED: { className: "badge badge-red" },
  COMPLETED: { className: "badge badge-green" },
  FAILED: { className: "badge badge-red" },
  REFUNDED: { className: "badge badge-purple" },
};

export default function BookingStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { className: "badge badge-gray" };
  return (
    <span className={config.className}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
