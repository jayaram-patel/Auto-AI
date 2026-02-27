import { cn } from "@/lib/utils";
import { Loader2, Brain, Database, Zap } from "lucide-react";
import { ReactNode } from "react";

interface LoadingProps {
  variant?: "spinner" | "dots" | "pulse" | "skeleton" | "cards";
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
  icon?: ReactNode;
}

// Spinner variant
function Spinner({ size = "md", className }: { size: string; className?: string }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2
      className={cn(
        "animate-spin text-primary",
        sizeClasses[size as keyof typeof sizeClasses],
        className
      )}
    />
  );
}

// Dots variant
function Dots({ size = "md", className }: { size: string; className?: string }) {
  const sizeClasses = {
    sm: "h-1 w-1",
    md: "h-2 w-2",
    lg: "h-3 w-3",
  };

  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "bg-primary rounded-full animate-pulse",
            sizeClasses[size as keyof typeof sizeClasses]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: "1.4s",
          }}
        />
      ))}
    </div>
  );
}

// Pulse variant
function Pulse({ size = "md", className }: { size: string; className?: string }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div
      className={cn(
        "bg-primary/20 rounded-full animate-ping",
        sizeClasses[size as keyof typeof sizeClasses],
        className
      )}
    />
  );
}

// Skeleton variant
function Skeleton({ size = "md", className }: { size: string; className?: string }) {
  const sizeClasses = {
    sm: "h-4",
    md: "h-6",
    lg: "h-8",
  };

  return (
    <div
      className={cn(
        "bg-muted animate-pulse rounded",
        sizeClasses[size as keyof typeof sizeClasses],
        className
      )}
    />
  );
}

// Cards variant for dashboard-like loading
function CardsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 border rounded-lg animate-pulse"
        >
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-32" />
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 bg-muted rounded" />
              <div className="h-3 bg-muted rounded w-20" />
            </div>
          </div>
          <div className="text-right space-y-2">
            <div className="h-5 bg-muted rounded w-16" />
            <div className="h-3 bg-muted rounded w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Main Loading component
export function Loading({
  variant = "spinner",
  size = "md",
  className,
  text,
  icon,
}: LoadingProps) {
  const renderVariant = () => {
    switch (variant) {
      case "spinner":
        return <Spinner size={size} className={className} />;
      case "dots":
        return <Dots size={size} className={className} />;
      case "pulse":
        return <Pulse size={size} className={className} />;
      case "skeleton":
        return <Skeleton size={size} className={className} />;
      case "cards":
        return <CardsSkeleton />;
      default:
        return <Spinner size={size} className={className} />;
    }
  };

  if (variant === "cards") {
    return renderVariant();
  }

  return (
    <div className="flex items-center justify-center space-x-2">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      {renderVariant()}
      {text && (
        <span className="text-sm text-muted-foreground animate-pulse">{text}</span>
      )}
    </div>
  );
}

// Specialized loading components for common use cases
export function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Stats cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 border rounded-lg animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-4 w-4 bg-muted rounded" />
            </div>
            <div className="h-8 bg-muted rounded w-16 mb-2" />
            <div className="h-3 bg-muted rounded w-20" />
          </div>
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 p-6 border rounded-lg animate-pulse">
          <div className="h-6 bg-muted rounded w-32 mb-2" />
          <div className="h-4 bg-muted rounded w-48 mb-6" />
          <CardsSkeleton />
        </div>
        <div className="col-span-3 p-6 border rounded-lg animate-pulse">
          <div className="h-6 bg-muted rounded w-24 mb-2" />
          <div className="h-4 bg-muted rounded w-40 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableLoading() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
          <div className="h-4 bg-muted rounded w-32" />
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-4 bg-muted rounded w-20" />
          <div className="h-4 bg-muted rounded w-16" />
        </div>
      ))}
    </div>
  );
}

export function CardLoading() {
  return (
    <div className="p-6 border rounded-lg animate-pulse">
      <div className="h-6 bg-muted rounded w-32 mb-4" />
      <div className="h-4 bg-muted rounded w-48 mb-6" />
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}
