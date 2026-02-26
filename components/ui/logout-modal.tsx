"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  redirectPath?: string;
}

const LOGOUT_DURATION = 3000; // 3 seconds

export function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
  redirectPath = "/",
}: LogoutModalProps) {
  const [progress, setProgress] = useState(100);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const rafIdRef = useRef<number | null>(null);
  const confirmedRef = useRef(false);
  const onConfirmRef = useRef(onConfirm);

  useEffect(() => {
    onConfirmRef.current = onConfirm;
  }, [onConfirm]);

  useEffect(() => {
    if (!isOpen || !isLoggingOut) {
      setProgress(100);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    const startTime = Date.now();
    const duration = LOGOUT_DURATION;

    const updateProgress = () => {
      if (!isOpen || !isLoggingOut || confirmedRef.current) return;

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining > 0) {
        rafIdRef.current = requestAnimationFrame(updateProgress);
      } else {
        confirmedRef.current = true;
        rafIdRef.current = null;
        onConfirmRef.current();
      }
    };

    rafIdRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isOpen, isLoggingOut]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      confirmedRef.current = false;
      setProgress(100);
      setIsLoggingOut(true);
    } else {
      confirmedRef.current = false;
      setProgress(100);
      setIsLoggingOut(false);
    }
  }, [isOpen]);

  const handleCancel = () => {
    confirmedRef.current = true;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setIsLoggingOut(false);
    setProgress(100);
    onClose();
  };

  const handleConfirmNow = () => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setIsLoggingOut(false);
    setProgress(0);
    onConfirmRef.current();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md overflow-hidden border-slate-200 bg-white p-0 shadow-2xl dark:border-white/15 dark:bg-slate-950">
        {/* Loading bar at top */}
        <div className="relative h-1.5 w-full bg-slate-100 dark:bg-slate-800">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6">
          <DialogHeader className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20">
              <LogOut className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-center text-lg font-semibold text-slate-900 dark:text-slate-100">
              You&apos;re about to leave this page
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-slate-500 dark:text-slate-400">
              You will be logged out and redirected to the home page in{" "}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {Math.ceil((progress / 100) * (LOGOUT_DURATION / 1000))}s
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-slate-100"
              onClick={handleCancel}
            >
              <X className="mr-2 h-4 w-4" />
              Stay on Page
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
              onClick={handleConfirmNow}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
