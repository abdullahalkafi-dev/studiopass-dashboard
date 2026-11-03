import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-lg font-bold text-foreground">Page not found</h2>
      <p className="mt-1 text-sm text-muted-foreground">This page does not exist or was moved.</p>
      <Link
        href="/"
        className="mt-4 rounded-lg bg-[#02B2FF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0092D8]"
      >
        Back to the dashboard
      </Link>
    </div>
  );
}
