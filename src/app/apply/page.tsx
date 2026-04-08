"use client";

import { useState } from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { SectionReveal } from "@/components/section-reveal";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Input } from "@/components/ui/input";
import type { ApplicationFormData } from "@/types";

const INITIAL_FORM: ApplicationFormData = {
  name: "",
  email: "",
  phone: "",
  instagram: "",
  car: "",
  modifications: "",
  source: "",
};

const inputClassName =
  "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] rounded-lg h-12 text-[#F5F5F0] placeholder:text-[rgba(245,245,240,0.2)] focus:border-[#C9A84C] focus-visible:ring-[#C9A84C]";

const labelClassName = "text-[10px] tracking-[3px] text-[#C9A84C] mb-2 block";

export default function ApplyPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ApplicationFormData>(INITIAL_FORM);

  function updateField(field: keyof ApplicationFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleContinue() {
    if (!formData.name.trim() || !formData.email.trim()) return;
    setStep(2);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="relative min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <BackgroundBeams className="opacity-40" />
        <SectionReveal className="relative z-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border-2 border-[#C9A84C] flex items-center justify-center mb-6">
            <span className="text-[#C9A84C] text-2xl">&#10003;</span>
          </div>
          <TextGenerateEffect words="Application Received" className="text-[#F5F5F0]" />
          <p className="text-[rgba(245,245,240,0.5)] mt-4 max-w-md leading-relaxed">
            We review every application personally. If you&apos;re a fit, expect
            to hear from us within 48 hours.
          </p>
        </SectionReveal>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 py-20">
      <BackgroundBeams className="opacity-40" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <SectionReveal>
          <p className="text-[10px] tracking-[3px] text-[#C9A84C] mb-3">
            APPLICATION
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-[#F5F5F0] mb-1">
            Request an{" "}
            <span className="text-[#C9A84C]">Invite</span>
          </h1>
          <p className="text-[rgba(245,245,240,0.5)] text-sm mb-6">
            Step {step} of 2
          </p>
        </SectionReveal>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          <div className="flex-1 h-[2px] rounded-full bg-[#C9A84C]" />
          <div
            className={`flex-1 h-[2px] rounded-full ${
              step >= 2 ? "bg-[#C9A84C]" : "bg-[rgba(255,255,255,0.08)]"
            }`}
          />
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <SectionReveal delay={0.1}>
            <div className="space-y-5">
              <div>
                <label className={labelClassName}>FULL NAME</label>
                <Input
                  type="text"
                  placeholder="Your name"
                  className={inputClassName}
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClassName}>EMAIL</label>
                <Input
                  type="email"
                  placeholder="you@email.com"
                  className={inputClassName}
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClassName}>PHONE</label>
                <Input
                  type="tel"
                  placeholder="+1 (305) 000-0000"
                  className={inputClassName}
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClassName}>INSTAGRAM</label>
                <Input
                  type="text"
                  placeholder="@yourhandle"
                  className={inputClassName}
                  value={formData.instagram}
                  onChange={(e) => updateField("instagram", e.target.value)}
                />
              </div>
              <ShimmerButton
                className="w-full rounded-xl text-sm font-semibold tracking-wide"
                borderRadius="12px"
                background="rgba(201,168,76,0.15)"
                shimmerColor="#C9A84C"
                onClick={handleContinue}
              >
                CONTINUE &gt;
              </ShimmerButton>
            </div>
          </SectionReveal>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <SectionReveal delay={0.1}>
            <div className="space-y-5">
              <div>
                <label className={labelClassName}>
                  CAR — YEAR, MAKE, MODEL
                </label>
                <Input
                  type="text"
                  placeholder="2024 Porsche 911 GT3"
                  className={inputClassName}
                  value={formData.car}
                  onChange={(e) => updateField("car", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClassName}>MODIFICATIONS</label>
                <Input
                  type="text"
                  placeholder="Full exhaust, lowered, wrapped..."
                  className={inputClassName}
                  value={formData.modifications}
                  onChange={(e) => updateField("modifications", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClassName}>
                  HOW DID YOU HEAR ABOUT US?
                </label>
                <Input
                  type="text"
                  placeholder="Instagram, a friend, at an event..."
                  className={inputClassName}
                  value={formData.source}
                  onChange={(e) => updateField("source", e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 h-12 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#F5F5F0] text-sm font-semibold tracking-wide hover:border-[rgba(255,255,255,0.2)] transition-colors"
                  onClick={() => setStep(1)}
                >
                  BACK
                </button>
                <ShimmerButton
                  className="flex-1 rounded-xl text-sm font-semibold tracking-wide"
                  borderRadius="12px"
                  background="rgba(201,168,76,0.15)"
                  shimmerColor="#C9A84C"
                  disabled={submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? "SUBMITTING..." : "SUBMIT APPLICATION"}
                </ShimmerButton>
              </div>
            </div>
          </SectionReveal>
        )}
      </div>
    </div>
  );
}
