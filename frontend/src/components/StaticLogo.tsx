import lightLogo from "@/assets/Logo-Assets/expensewise-transparent-light.png";

interface StaticLogoProps {
  className?: string;
  alt?: string;
}

export function StaticLogo({ className = "", alt = "ExpenseWise Logo" }: StaticLogoProps) {
  return (
    <img 
      src={lightLogo} 
      alt={alt} 
      className={`object-contain ${className}`}
      onError={(e) => {
        console.error('Failed to load static logo:', lightLogo);
        // Fallback to text if image fails to load
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}
