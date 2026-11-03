import { PageSkeleton } from "@/components/ui/skeleton";

// Shown by Next.js while a page of the dashboard is loading, instead of a blank content area
export default function Loading() {
  return <PageSkeleton />;
}
