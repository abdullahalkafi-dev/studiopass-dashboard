"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const ListenerProfileContent = dynamic(() => import("@/components/listener-profile-content"), { ssr: false });

export default function ListenerProfilePage() {
  const params = useParams();
  return <ListenerProfileContent id={params.id as string} />;
}
