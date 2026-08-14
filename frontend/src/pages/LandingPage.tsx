import { LandingNavbar, LandingFooter } from "@/components/landing/NavFooter";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base-900">
      <LandingNavbar />
      <Hero />
      <div id="features"><Features /></div>
      <Testimonials />
      <div id="faq"><FAQ /></div>
      <LandingFooter />
    </div>
  );
}
