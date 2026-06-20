"use client";

import dynamic from "next/dynamic";

const CreateStatusPostContent = dynamic(() => import("@/components/create-status-post-content"), { ssr: false });

export default function CreateStatusPostPage() {
  return <CreateStatusPostContent />;
}
