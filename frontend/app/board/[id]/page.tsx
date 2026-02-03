"use client";

import { useParams } from "next/navigation";
import { Whiteboard } from "@/components/whiteboard";

export default function BoardPage() {
  const params = useParams();
  const boardId = params.id as string;

  return <Whiteboard boardId={boardId} />;
}
