"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { doctorProfiles } from "@/lib/mock-data";
import { useIntakeStore } from "@/store/intake-store";

export function DoctorGrid() {
  const { setRouting } = useIntakeStore();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {doctorProfiles.map((doctor) => (
        <Card key={doctor.id} className="overflow-hidden">
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-muted">
                <Image
                  src={doctor.image}
                  alt={doctor.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold">{doctor.name}</p>
                <p className="text-sm text-muted-foreground">
                  {doctor.specialty} · {doctor.department}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{doctor.rating}★</Badge>
                  <Badge variant="outline">{doctor.waitMinutes} min</Badge>
                  <Badge variant="outline">{doctor.distanceKm} km</Badge>
                </div>
              </div>
            </div>
            {doctor.highlight && (
              <Badge variant="success" className="w-fit">
                {doctor.highlight}
              </Badge>
            )}
            <Button onClick={() => setRouting(doctor.department, doctor.name)}>
              Select Doctor
            </Button>
          </CardContent>
        </Card>
      ))}
      <Card className="glass md:col-span-2">
        <CardContent className="flex flex-col items-center justify-between gap-4 p-6 md:flex-row">
          <div>
            <p className="text-base font-semibold">Prefer telemedicine?</p>
            <p className="text-sm text-muted-foreground">
              Start a video consult in under 5 minutes with a verified
              physician.
            </p>
          </div>
          <Button variant="secondary">Start Telemedicine</Button>
        </CardContent>
      </Card>
    </div>
  );
}
