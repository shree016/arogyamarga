"use client";

import { useState } from "react";
import { CheckCircle, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/client";
import { useRouter } from "next/navigation";

type Props = { entryId: string };

export function DoctorQueueActions({ entryId }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const advance = async (status: string) => {
    setIsLoading(true);
    const supabase = createClient();
    const update: Record<string, string> = { status };
    if (status === "Completed") update.completed_at = new Date().toISOString();
    await supabase.from("queue_entries").update(update).eq("id", entryId);
    setIsLoading(false);
    router.refresh();
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => advance("Your Turn")}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
        Call In
      </Button>
      <Button
        size="sm"
        onClick={() => advance("Completed")}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
        Complete
      </Button>
    </div>
  );
}
