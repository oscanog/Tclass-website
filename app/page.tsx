"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Facebook,
  GraduationCap,
  LogIn,
  Mail,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  Star,
  Users,
  Wrench,
  X,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Play,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { submitContactForm } from "@/lib/contact-submit";
import { validateContactForm } from "@/lib/email-validator";
import { MathCaptcha, generateCaptchaToken } from "@/components/ui/math-captcha";

import { ThemeIconButton } from "@/components/ui/theme-icon-button";
import { cn } from "@/lib/utils";

const sectionLinks = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#news", label: "News" },
  { href: "#contact", label: "Contact" },
] as const;

const newsItems = [
  {
    id: 1,
    title: "TARA NA at Maging maYAP Scholar",
    date: "January 26, 2026",
    excerpt: "Scholarship tracks are open for qualified applicants.",
    type: "Announcement",
  },
  {
    id: 2,
    title: "Meat Processing Community-Based Training Program",
    date: "February 10, 2026",
    excerpt: "Provincial-led training completed with local participation.",
    type: "Event",
  },
  {
    id: 3,
    title: "Heavy Equipment Operator Opportunity",
    date: "February 5, 2026",
    excerpt: "Application season is open for heavy equipment programs.",
    type: "Opportunity",
  },
] as const;

const pillars = [
  "TESDA accredited tracks",
  "Scholarship-backed enrollment",
  "Government support",
  "Hands-on training",
  "Employment-ready pathways",
] as const;

const steps = [
  {
    title: "Choose Program",
    description: "Select a track based on demand, duration, and career goals.",
    icon: Target,
  },
  {
    title: "Submit Requirements",
    description: "Complete the admission form and required documents.",
    icon: CheckCircle2,
  },
  {
    title: "Start Training",
    description: "Attend orientation and begin practical classes.",
    icon: Zap,
  },
] as const;


// Intersection observer hook for scroll animations
function useScrollAnimation(threshold = 0.2) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

// Animated counter hook
function useCountUp(end: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!start) return;
    
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      countRef.current = Math.floor(easeOut * end);
      setCount(countRef.current);
      
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, duration, start]);

  return count;
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [formStatus, setFormStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  
  // Scroll animations for sections
  const aboutAnim = useScrollAnimation(0.15);
  const stepsAnim = useScrollAnimation(0.15);
  const newsAnim = useScrollAnimation(0.15);
  const contactAnim = useScrollAnimation(0.15);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Handle scroll to contact section from external link
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#contact" || hash === "#send-message") {
      const element = document.getElementById(hash.slice(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    }
  }, []);

  // Intersection observer for animations
  useEffect(() => {
    setIsVisible(true);
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);


  const handleContactSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Validate form using our validator
    const validation = validateContactForm(contactForm);
    
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      setFormStatus({ 
        type: "error", 
        message: "Please correct the errors in the form." 
      });
      setTimeout(() => setFormStatus(null), 5000);
      return;
    }

    // Show captcha if not shown yet
    if (!showCaptcha) {
      setShowCaptcha(true);
      setFormStatus({ 
        type: "info", 
        message: "Please complete the security verification below." 
      });
      return;
    }

    // Validate captcha
    if (!captchaVerified) {
      setFormStatus({ 
        type: "error", 
        message: "Please complete the security verification." 
      });
      return;
    }

    setIsSendingMessage(true);
    setFormStatus(null);
    setFieldErrors({});
    
    try {
      const response = await submitContactForm(contactForm);
      setFormStatus({ 
        type: "success", 
        message: (response as { message?: string }).message ?? "Message sent successfully. We will get back to you soon." 
      });
      setContactForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        message: "",
      });
      setFieldErrors({});
      setCaptchaVerified(false);
      setShowCaptcha(false);
      // Clear success message after 5 seconds
      setTimeout(() => setFormStatus(null), 5000);
    } catch (error) {
      setFormStatus({ 
        type: "error", 
        message: error instanceof Error ? error.message : "Failed to send message. Please try again." 
      });
      // Reset captcha on error
      setCaptchaVerified(false);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Animated stats
  const yearsCount = useCountUp(17, 2000, statsVisible);
  
  // Navigation transition state
  const [isNavigating, setIsNavigating] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [enrollChoiceOpen, setEnrollChoiceOpen] = useState(false);
  
  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);
    // Small delay for animation to show
    setTimeout(() => {
      window.location.href = "/login";
    }, 800);
  };
  
  // Smooth scroll to section with fade animation
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace("#", "");
    const element = document.getElementById(targetId);
    
    if (element) {
      setIsScrolling(true);
      
      // First fade out content slightly
      setTimeout(() => {
        // Smooth scroll to element
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        
        // Fade back in after scroll
        setTimeout(() => {
          setIsScrolling(false);
        }, 500);
      }, 150);
    }
  };

  return (
    <div className="landing-page min-h-screen text-slate-900 dark:text-slate-100">
      {/* Smooth Scroll Fade Overlay */}
      <div className={cn(
        "fixed inset-0 z-[150] bg-slate-950/20 backdrop-blur-sm transition-opacity duration-300 pointer-events-none",
        isScrolling ? "opacity-100" : "opacity-0"
      )} />
      
      {/* Page Transition Overlay */}
      <div className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center bg-slate-950 transition-all duration-700",
        isNavigating ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className="relative flex flex-col items-center gap-4">
          {/* Logo animation */}
          <div className="relative h-16 w-16 animate-pulse">
            <Image
              src="/tclass-logo.jpg"
              alt="TCLASS"
              fill
              className="object-contain rounded-2xl"
            />
          </div>
          {/* Loading text */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-lg font-semibold text-white">TCLASS Portal</p>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-[loading_800ms_ease-in-out]" />
          </div>
        </div>
      </div>
      
      {/* Global keyframes for loading animation */}
      <style jsx global>{`
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
      {/* Top Bar */}
      <div className="bg-blue-950/95 py-2 text-[11px] text-blue-50 sm:text-sm border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-5">
            <a href="tel:09177066718" className="flex items-center gap-1.5 hover:text-blue-200 transition-colors">
              <Phone className="h-3.5 w-3.5" />
              0917-706-6718
            </a>
            <span className="hidden items-center gap-1.5 sm:flex">
              <Mail className="h-3.5 w-3.5" />
              pgt.tclass@gmail.com
            </span>
          </div>
          <Link
            href="https://www.facebook.com/pgt.tclass/"
            target="_blank"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-blue-200"
          >
            <Facebook className="h-4 w-4" />
            <span className="hidden sm:inline">Follow us</span>
          </Link>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-blue-100/70 bg-white/88 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-11 w-11 sm:h-14 sm:w-14 transition-transform group-hover:scale-105">
              <Image
                src="/tclass-logo.jpg"
                alt="TCLASS Logo"
                fill
                className="object-contain rounded-xl"
                priority
              />
            </div>
            <div>
              <p className="text-base font-bold leading-tight text-slate-900 dark:text-white sm:text-lg">
                PGT - TCLASS
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 sm:text-xs">
                Tarlac Center for Learning And Skills Success
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {sectionLinks.map((link) => (
              <a 
                key={link.href} 
                href={link.href} 
                onClick={(e) => handleNavClick(e, link.href)}
                className="nav-chip cursor-pointer"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeIconButton />
            <Button
              size="sm"
              onClick={handleLoginClick}
              className="hidden sm:flex gap-2 rounded-full bg-blue-600 text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10 lg:hidden"
              onClick={() => setMobileMenuOpen((value) => !value)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-[120] lg:hidden ${mobileMenuOpen ? "visible pointer-events-auto" : "invisible pointer-events-none"}`}
        aria-hidden={!mobileMenuOpen}
      >
        <button
          type="button"
          aria-label="Close menu"
          className={`absolute inset-0 bg-slate-950/70 transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={closeMobileMenu}
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className={`absolute left-0 top-0 h-full w-[84%] max-w-[21rem] border-r border-slate-200 bg-white px-3 pb-4 pt-4 shadow-[0_26px_65px_rgba(15,23,42,0.35)] transition-transform duration-300 dark:border-white/15 dark:bg-slate-950 dark:shadow-[0_26px_65px_rgba(0,0,0,0.65)] ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-white/15">
            <div className="flex items-center gap-2">
              <div className="relative h-10 w-10">
                <Image src="/tclass-logo.jpg" alt="TCLASS Logo" fill className="rounded-full object-contain" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">TCLASS Portal</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Navigation</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
              onClick={closeMobileMenu}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/15 dark:bg-slate-900">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Theme</span>
            <ThemeIconButton />
          </div>

          <div className="space-y-1.5">
            {sectionLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  closeMobileMenu();
                  handleNavClick(e, link.href);
                }}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {link.label}
                <ChevronRight className="h-4 w-4 ml-auto text-slate-400" />
              </a>
            ))}

            <button
              onClick={() => {
                closeMobileMenu();
                handleLoginClick({ preventDefault: () => {} } as React.MouseEvent);
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
            >
              <LogIn className="h-4 w-4" />
              Login Portal
            </button>
          </div>
        </aside>
      </div>

      <main>
        <Dialog open={enrollChoiceOpen} onOpenChange={setEnrollChoiceOpen}>
          <DialogContent hideCloseButton className="w-[calc(100vw-1rem)] max-w-[34rem] overflow-hidden border-blue-100 bg-white p-0 shadow-2xl sm:w-full dark:border-white/15 dark:bg-slate-950">
            <div className="h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600" />
            <div className="p-4 sm:p-6">
              <DialogHeader className="space-y-3 text-left">
                <div className="space-y-2">
                  <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300">
                    Enrollment Start
                  </div>
                  <DialogTitle className="text-xl leading-tight text-blue-950 dark:text-slate-100 sm:text-2xl">
                    Choose Enrollment Type
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
                    Select what you want to enroll in. You can continue to your preferred track after this step.
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="mt-5 grid gap-3">
              <Link
                href="/programs"
                onClick={() => setEnrollChoiceOpen(false)}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-900/5 dark:border-white/15 dark:bg-slate-900 dark:hover:bg-white/5"
              >
                <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-slate-200/50 blur-2xl dark:bg-white/5" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Certificate</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Browse Training Programs and pick a course to enroll in.
                    </p>
                    <div className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                      TESDA / Skills Training
                    </div>
                  </div>
                  <ArrowRight className="relative mt-0.5 h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-1 dark:text-slate-300" />
                </div>
              </Link>

              <Link
                href="/diploma-programs"
                onClick={() => setEnrollChoiceOpen(false)}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-900/5 dark:border-white/15 dark:bg-slate-900 dark:hover:bg-white/5"
              >
                <div className="absolute -left-8 -bottom-8 h-20 w-20 rounded-full bg-slate-200/50 blur-2xl dark:bg-white/5" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Diploma</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Browse 4-year college courses and continue to the diploma enrollment form.
                    </p>
                    <div className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                      College Degree Path
                    </div>
                  </div>
                  <ArrowRight className="relative mt-0.5 h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-1 dark:text-slate-300" />
                </div>
              </Link>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Tip: If you are applying for TESDA short courses, choose <span className="font-semibold">Certificate</span>.
              </div>

              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEnrollChoiceOpen(false)}
                  className="cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Hero Section */}
        <section id="home" className="relative isolate overflow-hidden" ref={heroRef}>
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/tclass.jpg')" }} aria-hidden />
          <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(7,20,56,0.94)_0%,rgba(12,54,130,0.78)_45%,rgba(5,17,45,0.88)_100%)]" aria-hidden />
          
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden" aria-hidden>
            <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -left-20 bottom-20 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
          </div>

          <div className="relative mx-auto grid min-h-[82svh] max-w-7xl gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-12 lg:px-8 lg:pb-24 lg:pt-24">
            <div className={cn("transition-all duration-700", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-blue-50 backdrop-blur-sm mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Since 2007 | Career-focused training</span>
              </div>
              
              {/* Headline */}
              <h1 className="hero-title max-w-3xl text-3xl font-bold leading-[1.15] text-white sm:text-5xl lg:text-6xl">
                Build job-ready skills with a{" "}
                <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  modern training center
                </span>{" "}
                in Tarlac.
              </h1>
              
              {/* Description */}
              <p className="mt-6 max-w-2xl text-base text-blue-50/90 sm:text-lg leading-relaxed">
                TCLASS delivers scholarship-supported and industry-aligned programs 
                designed for practical employability and career success.
              </p>

              {/* CTA Button */}
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => setEnrollChoiceOpen(true)}
                  className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-blue-900 shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-1 hover:bg-blue-50 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] active:translate-y-0 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
                >
                  Enroll now
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>

              {/* Stats */}
              <div 
                ref={statsRef}
                className={cn(
                  "mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3 transition-all duration-700 delay-300",
                  statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}
              >
                <div className="group rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:border-white/30">
                  <p className="text-3xl font-bold text-white">{yearsCount}+</p>
                  <p className="text-xs uppercase tracking-[0.12em] text-blue-100 mt-1">Years of service</p>
                </div>
                <div className="group rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:border-white/30">
                  <p className="text-3xl font-bold text-white">6</p>
                  <p className="text-xs uppercase tracking-[0.12em] text-blue-100 mt-1">Core tracks</p>
                </div>
                <div className="group rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:border-white/30">
                  <p className="text-2xl font-bold text-white">TESDA</p>
                  <p className="text-xs uppercase tracking-[0.12em] text-blue-100 mt-1">Accredited</p>
                </div>
              </div>
              
              {/* Trust badges */}
              <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-blue-100/80">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  Government-backed
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  1000+ graduates
                </span>
              </div>
            </div>

            {/* Hero Image / Visual */}
            <div className={cn(
              "hidden lg:block relative transition-all duration-700 delay-200",
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            )}>
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
                <Image
                  src="/tclass.jpg"
                  alt="TCLASS Training Center"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4">
                    <p className="text-sm font-medium text-white">IT Training Center Building</p>
                    <p className="text-xs text-blue-100">IT Park I, Tibag, Tarlac City</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pillars / Trust Bar */}
        <section className="border-y border-blue-100/70 bg-white/82 py-5 dark:border-white/10 dark:bg-slate-900/55">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
            {pillars.map((item, index) => (
              <div 
                key={item} 
                className="group flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-blue-900 transition-all duration-300 hover:bg-blue-100 hover:border-blue-300 hover:-translate-y-0.5 hover:shadow-md cursor-default dark:border-white/15 dark:bg-white/5 dark:text-blue-100 dark:hover:bg-white/10 dark:hover:border-white/30 sm:text-xs"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CheckCircle2 className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 md:py-24" ref={aboutAnim.ref}>
          <div className={cn(
            "mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14 lg:px-8 transition-all duration-700",
            aboutAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div>
              <Badge className="mb-4 bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-100">About TCLASS</Badge>
              <h2 className="hero-title text-3xl font-bold text-blue-950 dark:text-slate-100 sm:text-4xl">
                A practical training center focused on employability.
              </h2>
              <p className="mt-5 max-w-2xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
                TCLASS delivers accessible and outcome-driven technical education under the Provincial Government of Tarlac.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  { icon: GraduationCap, title: "TESDA Standards", desc: "Curriculum aligned with competency requirements." },
                  { icon: Award, title: "Scholarship Access", desc: "TCLASS and maYAP support for qualified applicants." },
                  { icon: Users, title: "Industry Relevance", desc: "Tracks designed for in-demand local roles." },
                  { icon: Wrench, title: "Hands-on Practice", desc: "Supervised practical sessions and coaching." },
                ].map((feature, idx) => (
                  <div 
                    key={feature.title}
                    className="group rounded-2xl border border-blue-100 bg-white/85 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900/75"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-500/20 dark:text-blue-300 dark:group-hover:bg-blue-500 dark:group-hover:text-white">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{feature.title}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card className="elev-card overflow-hidden rounded-3xl border-blue-100 dark:border-white/10">
              <CardContent className="space-y-5 p-7 sm:p-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Why learners choose us</h3>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  {[
                    "Clear path from enrollment to certification.",
                    "Training focused on real workplace outcomes.",
                    "Government-backed community trust and support.",
                    "Affordable scholarship programs available.",
                  ].map((item, idx) => (
                    <p key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
                      {item}
                    </p>
                  ))}
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/85 p-5 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-semibold uppercase tracking-[0.08em] text-blue-800 dark:text-blue-200">Campus Location</p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">IT Training Center Bldg., IT Park I, Tibag, Tarlac City</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Enrollment Steps */}
        <section className="py-16 md:py-24 bg-slate-50/50 dark:bg-slate-900/30" ref={stepsAnim.ref}>
          <div className={cn(
            "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 transition-all duration-700",
            stepsAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="mb-12 text-center">
              <Badge className="mb-4 bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-100">Enrollment Flow</Badge>
              <h2 className="hero-title text-3xl font-bold text-blue-950 dark:text-slate-100 sm:text-4xl">
                Simple and guided from inquiry to training.
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Card 
                    key={step.title} 
                    className="group elev-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <CardContent className="p-6">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-500/20 dark:text-blue-300 dark:group-hover:bg-blue-500 dark:group-hover:text-white">
                        <Icon className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">
                        Step {index + 1}
                      </p>
                      <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">{step.title}</h3>
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{step.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* News Section */}
        <section id="news" className="bg-white/70 py-16 dark:bg-transparent md:py-24" ref={newsAnim.ref}>
          <div className={cn(
            "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 transition-all duration-700",
            newsAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="mb-12 text-center">
              <Badge className="mb-4 bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-100">News & Updates</Badge>
              <h2 className="hero-title text-3xl font-bold text-blue-950 dark:text-slate-100 sm:text-4xl">Latest from TCLASS</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {newsItems.map((item, idx) => (
                <Card 
                  key={item.id} 
                  className="group elev-card overflow-hidden transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-200 to-blue-100 dark:from-slate-900 dark:to-slate-800">
                    <BookOpen className="h-12 w-12 text-slate-500 transition-transform duration-300 group-hover:scale-110 dark:text-slate-400" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{item.date}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.excerpt}</p>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="mt-4 w-full group/btn text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                      onClick={() => toast.success(`Reading: ${item.title}`)}
                    >
                      Read More
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link href="https://www.facebook.com/pgt.tclass/" target="_blank">
                <Button 
                  variant="outline" 
                  className="gap-2 rounded-full border-blue-200 bg-white/85 px-6 text-blue-900 hover:bg-blue-50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  <Facebook className="h-4 w-4" />
                  View updates on Facebook
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 py-16 text-white md:py-24" ref={contactAnim.ref}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(56,189,248,0.22),transparent_42%),radial-gradient(circle_at_90%_15%,rgba(37,99,235,0.25),transparent_36%)]" aria-hidden />
          <div className={cn(
            "relative mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:px-8 transition-all duration-700",
            contactAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div>
              <Badge className="mb-4 border border-white/25 bg-white/10 text-blue-100">Contact Us</Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">Talk with our admissions team.</h2>
              <p className="mt-4 text-sm text-slate-200 sm:text-base">Reach out for program matching, requirements, and scholarship guidance.</p>
              <div className="mt-8 space-y-4">
                {[
                  { icon: MapPin, label: "Address", value: "IT Training Center Bldg., Right Wing, IT Park I, Tibag, Tarlac City, Tarlac, Philippines, 2300" },
                  { icon: Phone, label: "Phone", value: "0917-706-6718 (Training) | 0917-848-5235 (Assessment)" },
                  { icon: Clock, label: "Office Hours", value: "Monday to Friday | 8:00 AM to 5:00 PM" },
                ].map((item) => (
                  <div key={item.label} className="group rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:border-white/30">
                    <p className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-blue-100">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </p>
                    <p className="text-sm text-slate-100">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card id="send-message" className="glass-panel rounded-3xl border-white/25 bg-white text-slate-900 dark:border-white/10 dark:bg-slate-950/85 dark:text-slate-100">
              <CardContent className="p-6 sm:p-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Send a message</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">We typically respond within one working day.</p>
                <form className="mt-6 space-y-4" onSubmit={handleContactSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="first-name" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">First Name</label>
                      <input
                        id="first-name"
                        type="text"
                        placeholder="Juan"
                        required
                        value={contactForm.firstName}
                        onChange={(event) => {
                          setContactForm((previous) => ({ ...previous, firstName: event.target.value }));
                          if (fieldErrors.firstName) setFieldErrors((prev) => ({ ...prev, firstName: "" }));
                        }}
                        className={cn(
                          "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 dark:bg-slate-900/80 dark:text-slate-100",
                          fieldErrors.firstName 
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500" 
                            : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/20"
                        )}
                      />
                      {fieldErrors.firstName && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="last-name" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Last Name</label>
                      <input
                        id="last-name"
                        type="text"
                        placeholder="Dela Cruz"
                        required
                        value={contactForm.lastName}
                        onChange={(event) => {
                          setContactForm((previous) => ({ ...previous, lastName: event.target.value }));
                          if (fieldErrors.lastName) setFieldErrors((prev) => ({ ...prev, lastName: "" }));
                        }}
                        className={cn(
                          "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 dark:bg-slate-900/80 dark:text-slate-100",
                          fieldErrors.lastName 
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500" 
                            : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/20"
                        )}
                      />
                      {fieldErrors.lastName && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.lastName}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="juan@example.com"
                      required
                      value={contactForm.email}
                      onChange={(event) => {
                        // Remove spaces and validate
                        const value = event.target.value.replace(/\s/g, "");
                        setContactForm((previous) => ({ ...previous, email: value }));
                        if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      title="Please enter a valid email address (e.g., juan@example.com)"
                      className={cn(
                        "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 dark:bg-slate-900/80 dark:text-slate-100",
                        fieldErrors.email 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500" 
                          : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/20"
                      )}
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Phone</label>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="0917XXXXXXX"
                      value={contactForm.phone}
                      onChange={(event) => {
                        // Only allow numbers
                        const value = event.target.value.replace(/\D/g, "");
                        setContactForm((previous) => ({ ...previous, phone: value }));
                        if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
                      }}
                      maxLength={11}
                      pattern="[0-9]{11}"
                      title="Please enter an 11-digit phone number"
                      className={cn(
                        "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 dark:bg-slate-900/80 dark:text-slate-100",
                        fieldErrors.phone 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500" 
                          : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/20"
                      )}
                    />
                    {fieldErrors.phone && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="message" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Message</label>
                    <textarea
                      id="message"
                      rows={4}
                      placeholder="How can we help you?"
                      required
                      value={contactForm.message}
                      onChange={(event) => {
                        setContactForm((previous) => ({ ...previous, message: event.target.value }));
                        if (fieldErrors.message) setFieldErrors((prev) => ({ ...prev, message: "" }));
                      }}
                      className={cn(
                        "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 dark:bg-slate-900/80 dark:text-slate-100",
                        fieldErrors.message 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500" 
                          : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/20"
                      )}
                    />
                    {fieldErrors.message && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.message}</p>
                    )}
                  </div>
                  
                  {/* Math CAPTCHA - Shows after clicking Send */}
                  {showCaptcha && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <MathCaptcha 
                        onVerify={setCaptchaVerified}
                        isVerified={captchaVerified}
                      />
                    </div>
                  )}
                  
                  {/* Inline Form Status Message */}
                  {formStatus && (
                    <div className={cn(
                      "rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
                      formStatus.type === "success" 
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30"
                        : formStatus.type === "error"
                        ? "bg-red-100 text-red-800 border border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30"
                        : "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30"
                    )}>
                      {formStatus.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      ) : formStatus.type === "error" ? (
                        <X className="h-4 w-4 shrink-0" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                      )}
                      {formStatus.message}
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    disabled={isSendingMessage}
                    className="w-full rounded-xl bg-blue-600 py-5 font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-70 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
                  >
                    {isSendingMessage ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Send message
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-slate-50 py-8 dark:border-white/10 dark:bg-slate-950">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              © {new Date().getFullYear()} PGT - TCLASS. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="rounded-full border border-transparent px-3 py-2 text-sm text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-400 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="rounded-full border border-transparent px-3 py-2 text-sm text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-400 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
              >
                Terms
              </Link>
              <Link
                href="/contract"
                className="rounded-full border border-transparent px-3 py-2 text-sm text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-400 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
              >
                Contract
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
