"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, HeartPulse, Hospital, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LanguageSelector } from "@/components/patient/language-selector";

const ctas = [
  {
    title: "Returning Patient",
    subtitle: "Resume your last care journey",
    href: "/patient/queue",
    icon: HeartPulse,
  },
  {
    title: "I Know My Doctor",
    subtitle: "Jump straight to your specialist",
    href: "/patient/doctors",
    icon: Stethoscope,
  },
  {
    title: "Help Me Find a Doctor",
    subtitle: "Start AI intake and routing",
    href: "/patient/intake",
    icon: Hospital,
  },
];

export function LandingHero() {
  return (
    <div className="relative overflow-hidden rounded-4xl border border-border bg-card/95 p-6 md:p-10">
      <div className="absolute inset-0 -z-10 animated-gradient" />
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              AI HEALTHCARE INTAKE
            </p>
            <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
              Welcome to ArogyaMaarga
            </h1>
            <p className="mt-3 max-w-lg text-sm text-muted-foreground">
              A premium patient intake and hospital routing experience. Tell us
              your symptoms, get intelligent triage, and reach the right doctor
              in minutes.
            </p>
          </div>
          <LanguageSelector />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {ctas.map((cta, index) => (
            <motion.div
              key={cta.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
            >
              <Card className="glass h-full rounded-3xl border border-border p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/12 text-accent">
                    <cta.icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{cta.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {cta.subtitle}
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  className="mt-4 w-full justify-between"
                  variant="secondary"
                >
                  <Link href={cta.href}>
                    Get started
                    <ArrowRight size={16} />
                  </Link>
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center gap-3 rounded-3xl border border-danger/40 bg-danger/12 px-6 py-4 text-center"
        >
          <p className="text-sm font-semibold text-danger">
            Emergency? We will prioritize you instantly.
          </p>
          <Button variant="destructive" size="lg">
            Emergency Help
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
