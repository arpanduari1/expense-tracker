import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import lightLogo from "@/assets/Logo-Assets/expensewise-transparent-light.png";
import darkLogo from "@/assets/Logo-Assets/expensewise-transparent-dark.png";

interface DynamicLogoProps {
  className?: string;
  alt?: string;
}

export function DynamicLogo({ className = "", alt = "ExpenseWise Logo" }: DynamicLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by waiting for theme to be resolved
  useEffect(() => {
    setMounted(true);
  }, []);

  // Return a placeholder while mounting to prevent layout shift
  if (!mounted) {
    return (
      <div 
        className={`${className} bg-muted/20 animate-pulse rounded-lg flex items-center justify-center`}
        style={{ aspectRatio: '1' }}
      >
        <span className="sr-only">Loading logo...</span>
      </div>
    );
  }

  // Note: The file names are opposite to what you'd expect:
  // - "dark" logo is used on light themes (for contrast)
  // - "light" logo is used on dark themes (for contrast)
  const logoSrc = resolvedTheme === "dark" ? lightLogo : darkLogo;

  return (
    <img 
      src={logoSrc} 
      alt={alt} 
      className={`transition-opacity duration-300 object-contain ${className}`}
      onError={(e) => {
        console.error('Failed to load logo:', logoSrc);
        // Fallback to text if image fails to load
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}
