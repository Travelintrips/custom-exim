import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader2
        className={cn(
          "animate-spin text-slate-500",
          sizeClasses[size],
          className
        )}
      />
      {text && (
        <p className="text-xs font-medium text-slate-500">{text}</p>
      )}
    </div>
  );
}

interface LoadingScreenProps {
  text?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ text, fullScreen = false }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-slate-50 p-8",
        fullScreen ? "fixed inset-0 z-50" : "h-full w-full min-h-[200px]"
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      {text && (
        <p className="mt-3 text-sm font-medium text-slate-600">{text}</p>
      )}
    </div>
  );
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-1", className)}>
      <div className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
      <div className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:0.2s]" />
      <div className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:0.4s]" />
    </div>
  );
}

export function LoadingPulse({ className }: { className?: string }) {
  return (
    <div className="flex justify-center">
      <Loader2 className={cn("h-5 w-5 animate-spin text-slate-500", className)} />
    </div>
  );
}
