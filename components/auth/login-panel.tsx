"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { loginSchema } from "@/lib/validation";
import { roleRoutes, type UserRole } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";

type LoginValues = z.infer<typeof loginSchema>;

type RoleChoice = {
  label: "Patient" | "Doctor" | "Admin";
  value: UserRole;
};

const roleChoices: RoleChoice[] = [
  { label: "Patient", value: "Patient" },
  { label: "Doctor", value: "Doctor" },
  { label: "Admin", value: "Super Admin" },
];

const patientGenders = ["Male", "Female", "Other"] as const;

export function LoginPanel() {
  const router = useRouter();
  const { login } = useAuthStore();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: "Patient",
      name: "",
      age: "",
      gender: "",
    },
  });

  const selectedRole = watch("role") as UserRole;

  const onSubmit = handleSubmit((values) => {
    if (selectedRole === "Patient") {
      if (!values.age?.trim()) {
        setError("age", { message: "Please enter age." });
        return;
      }
      if (!values.gender?.trim()) {
        setError("gender", { message: "Please select gender." });
        return;
      }
    }

    login({
      role: values.role,
      name: values.name,
      age: values.age ?? null,
      gender: values.gender ?? null,
    });

    router.push(roleRoutes[values.role]);
  });

  return (
    <div className="mx-auto w-full max-w-xl">
      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold">Sign in</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {roleChoices.map((choice) => {
              const isSelected = selectedRole === choice.value;
              return (
                <button
                  key={choice.value}
                  type="button"
                  onClick={() => {
                    setValue("role", choice.value, { shouldValidate: true });
                    if (choice.value !== "Patient") {
                      setValue("age", "");
                      setValue("gender", "");
                    }
                    clearErrors();
                  }}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition",
                    isSelected
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-card hover:border-accent/40",
                  )}
                >
                  {choice.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">
              Name
            </label>
            <Input placeholder="Your name" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-danger">{errors.name.message}</p>
            )}
          </div>

          {selectedRole === "Patient" && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Age
                </label>
                <Input type="number" placeholder="Age" {...register("age")} />
                {errors.age && (
                  <p className="text-xs text-danger">{errors.age.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {patientGenders.map((gender) => {
                    const selectedGender = watch("gender") === gender;
                    return (
                      <button
                        key={gender}
                        type="button"
                        onClick={() =>
                          setValue("gender", gender, { shouldValidate: true })
                        }
                        className={cn(
                          "rounded-xl border px-3 py-2 text-sm font-medium transition",
                          selectedGender
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border bg-card hover:border-accent/40",
                        )}
                      >
                        {gender}
                      </button>
                    );
                  })}
                </div>
                {errors.gender && (
                  <p className="text-xs text-danger">{errors.gender.message}</p>
                )}
              </div>
            </>
          )}

          <div className="rounded-2xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            Active role:{" "}
            <span className="font-semibold text-foreground">
              {selectedRole === "Super Admin" ? "Admin" : selectedRole}
            </span>
          </div>

          <Button type="submit" size="lg" className="w-full">
            Continue
          </Button>
        </form>
      </Card>
    </div>
  );
}
