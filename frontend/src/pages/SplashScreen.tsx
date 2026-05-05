import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import logo from '@/assets/Logo-Assets/ExpenseWise.png';

const SplashScreen = () => {
  const [fadingOut, setFadingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fadeOutTimer = setTimeout(() => {
      setFadingOut(true);
    }, 1000);

    const redirectTimer = setTimeout(() => {
      const hasOnboarded = localStorage.getItem('hasOnboarded');
      if (hasOnboarded === 'true') {
        navigate('/login');
      } else {
        navigate('/onboarding');
      }
    }, 2500);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <div
      className={cn(
        'fixed inset-0 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ease-in-out',
        fadingOut ? 'opacity-0' : 'opacity-100'
      )}
    >
      <img src={logo} alt="ExpenseWise Logo" className="h-32" />
      <h1 className="mt-6 text-4xl font-bold text-foreground tracking-wider">
        ExpenseWise
      </h1>
    </div>
  );
};

export default SplashScreen;