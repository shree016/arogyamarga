"use client";

import { useState } from "react";
import { CheckCircle, Clock, Star, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useIntakeStore } from "@/store/intake-store";
import { useRouter } from "next/navigation";

type Doctor = {
  id: string;
  specialty: string;
  department: string;
  qualification: string | null;
  experience_years: number;
  rating: number;
  is_available: boolean;
  consultation_fee: number;
  room_number: string | null;
  waitMinutes: number;
  currentQueue: number;
  profiles:
    | { full_name: string; phone?: string | null }
    | { full_name: string; phone?: string | null }[]
    | null;
};

export function DoctorGridLive({ doctors }: { doctors: Doctor[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { setRouting } = useIntakeStore();
  const router = useRouter();

  const handleSelect = (doctor: Doctor) => {
    const profile = Array.isArray(doctor.profiles)
      ? doctor.profiles[0]
      : doctor.profiles;
    setSelectedId(doctor.id);
    setRouting(doctor.department, profile?.full_name ?? doctor.specialty);
    setTimeout(() => router.push("/patient/queue"), 600);
  };

  if (doctors.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No doctors are available at the moment.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {doctors.map((doctor, idx) => {
          const profile = Array.isArray(doctor.profiles)
            ? doctor.profiles[0]
            : doctor.profiles;
          const isSelected = selectedId === doctor.id;
          const isBestMatch = idx === 0;

          return (
            <Card
              key={doctor.id}
              className={cn(
                "overflow-hidden transition-all",
                isSelected && "border-accent/60 shadow-lg",
                isBestMatch && "border-success/40",
              )}
            >
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <span className="text-lg font-bold">
                      {profile?.full_name?.split(" ").pop()?.charAt(0) ?? "D"}
                    </span>
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{profile?.full_name ?? "Doctor"}</p>
                      {isBestMatch && (
                        <Badge variant="success" className="text-[10px]">
                          Best Match
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {doctor.specialty}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {doctor.qualification}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-border bg-muted/30 px-2 py-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Star size={10} />
                      <span className="font-semibold text-foreground">
                        {doctor.rating}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">Rating</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 px-2 py-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-xs">
                      <Clock size={10} className="text-muted-foreground" />
                      <span className="font-semibold">{doctor.waitMinutes}m</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">Wait</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 px-2 py-2 text-center">
                    <p className="text-xs font-semibold">
                      ₹{doctor.consultation_fee}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">Fee</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Room {doctor.room_number ?? "—"} ·{" "}
                  {doctor.experience_years} yrs exp ·{" "}
                  {doctor.currentQueue} in queue
                </div>

                <Button
                  onClick={() => handleSelect(doctor)}
                  disabled={isSelected}
                  className="w-full"
                  variant={isSelected ? "secondary" : "default"}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle size={14} />
                      Selected
                    </>
                  ) : (
                    "Select Doctor"
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Telemedicine option */}
      <Card className="glass">
        <CardContent className="flex flex-col items-center justify-between gap-4 p-5 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-100 p-2 dark:bg-teal-950">
              <Video size={18} className="text-teal-600" />
            </div>
            <div>
              <p className="font-semibold">Prefer telemedicine?</p>
              <p className="text-sm text-muted-foreground">
                Video consult in under 5 minutes with a verified physician.
              </p>
            </div>
          </div>
          <Button variant="secondary" className="shrink-0">
            Start Telemedicine
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
