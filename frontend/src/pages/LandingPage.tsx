import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { TestimonialsSection } from "@/components/ui/testimonials-with-marquee";
import { Component as RaycastBackground } from "@/components/raycast-animated-background";
import BlurText from "@/components/BlurText";
import Squares from "@/components/Squares";
import ExpenseWiseLogo from "@/assets/Logo-Assets/ExpenseWise.png";
import { 
  LayoutDashboard, 
  PiggyBank, 
  Tag, 
  BarChart3, 
  Calendar, 
  Shield,
  ArrowRight,
  Menu,
  X
} from "lucide-react";
import SpotlightCard from "@/components/SpotlightCard";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { getAuthToken, getRefreshToken } from "@/utils/tokenStorage";
import { isTokenExpired } from "@/utils/tokenUtils";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const previousTheme = useRef<string | undefined>();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    const token = getAuthToken();
    const refreshTokenValue = getRefreshToken();

    // If the user has a valid access token, or a refresh token that can be used
    // to get a new access token, skip the landing page and go to the dashboard.
    if ((token && !isTokenExpired(token)) || refreshTokenValue) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  // Force dark theme for landing page
  useEffect(() => {
    // Store the current theme to restore later
    previousTheme.current = theme;
    
    // Set dark theme for landing page
    setTheme("dark");
    
    // Cleanup function to restore previous theme when leaving the page
    return () => {
      if (previousTheme.current && previousTheme.current !== "dark") {
        setTheme(previousTheme.current);
      }
    };
  }, [theme, setTheme]);

  const testimonials = [
    {
      author: {
        name: "Sarah M.",
        handle: "@sarahfinance",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face"
      },
      text: "ExpenseWise has transformed the way I manage my finances. It's intuitive, powerful, and has helped me save significantly.",
    },
    {
      author: {
        name: "David K.",
        handle: "@davidbiz",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
      },
      text: "I love the simplicity of ExpenseWise. It's easy to use, yet provides all the features I need to stay on top of my expenses.",
    },
    {
      author: {
        name: "Emily L.",
        handle: "@emilylearns",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face"
      },
      text: "The reporting and analytics features are fantastic. I can now see exactly where my money is going and make smarter financial choices.",
    },
    {
      author: {
        name: "Neel Bhattacharjee",
        handle: "@neelbhattacharjee",
        avatar: "https://iili.io/K7VSfmx.jpg"
      },
      text: "As a freelancer, tracking expenses was a nightmare. ExpenseWise made it so simple that I actually look forward to managing my finances!",
    },
    {
      author: {
        name: "Arpan Duari",
        handle: "@arpanduari",
        avatar: "https://iili.io/K7Myn6u.jpg"
      },
      text: "The budget tracking feature helped me cut my monthly expenses by 30%. I can finally afford that vacation I've been dreaming about!",
    },
    {
      author: {
        name: "Rahul Bera",
        handle: "@rahulbera",
        avatar: "https://iili.io/K7V0lTJ.jpg"
      },
      text: "ExpenseWise's calendar view is a game-changer. Seeing my spending patterns over time has completely changed how I approach money management.",
    }
  ];

  return (
    <div className="min-h-screen bg-black font-sans overflow-x-hidden relative">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between px-6 py-4 relative z-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 text-foreground">
            <img 
              src={ExpenseWiseLogo} 
              alt="ExpenseWise Logo" 
              className="h-10 w-10 object-contain"
            />
            <h2 className="text-xl font-bold tracking-tight">ExpenseWise</h2>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-base font-medium hover:text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-base font-medium hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#testimonials" className="text-base font-medium hover:text-primary transition-colors">
              Testimonials
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="font-bold">
                Log In
              </Button>
            </Link>
            <Link to="/create-account">
              <Button className="font-bold">
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
            <div className="container mx-auto px-6 py-4 space-y-4 relative z-10">
              <a 
                href="#features" 
                className="block text-base font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                className="block text-base font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <a 
                href="#testimonials" 
                className="block text-base font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Testimonials
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full font-bold">
                    Log In
                  </Button>
                </Link>
                <Link to="/create-account" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full font-bold">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pt-[73px] relative">
        {/* Hero Section */}
        <section className="py-20 md:py-32 px-4 relative z-10 overflow-hidden">
          {/* Animated Background - only in hero section */}
          <div className="absolute inset-0 -top-[73px] z-0">
            <RaycastBackground />
          </div>
          
          {/* Background overlay for text readability only */}
          <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-background/80 pointer-events-none" />
          
          {/* Stronger vignette effect to blend into black background */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, transparent 30%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.8) 80%, rgba(0,0,0,0.95) 90%, black 100%)'
          }} />
          
          <div className="container mx-auto max-w-6xl text-center relative z-20">
            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight text-foreground mb-6 animate-fade-in">
              Track Your Expenses, <br/>
              <span className="text-primary">Simplify Your Finances</span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 animate-fade-in delay-200">
              ExpenseWise helps you manage your money effortlessly. Gain insights into your spending, 
              set budgets, and achieve your financial goals with our intuitive platform.
            </p>
            <div className="flex justify-center gap-4 flex-wrap animate-fade-in delay-300">
              <Link to="/create-account">
                <InteractiveHoverButton 
                  text="Get Started Free" 
                  className="w-48 h-14 text-lg font-bold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                />
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 relative z-10" id="features">
          {/* Background overlay for content readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/80 to-background/90 pointer-events-none z-1" />
          
          <div className="container mx-auto max-w-6xl px-4 relative z-20">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
                Powerful Features for Financial Control
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                ExpenseWise offers a comprehensive suite of tools to help you stay on top of your finances, 
                all in one place.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <SpotlightCard className="hover:scale-[1.02] transition-transform duration-300" spotlightColor="rgba(0,229,255,0.12)">
                <div className="flex flex-col gap-4">
                  <div className="text-[rgba(0,229,255,1)]">
                    <LayoutDashboard className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Smart Dashboard</h3>
                  <p className="text-muted-foreground">
                    Get a clear overview of your financial health with our intuitive and customizable dashboard.
                  </p>
                </div>
              </SpotlightCard>

              <SpotlightCard className="hover:scale-[1.02] transition-transform duration-300" spotlightColor="rgba(255,183,77,0.12)">
                <div className="flex flex-col gap-4">
                  <div className="text-[rgba(255,183,77,1)]">
                    <PiggyBank className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Budget Management</h3>
                  <p className="text-muted-foreground">
                    Set and track budgets to stay within your spending limits and reach your savings goals faster.
                  </p>
                </div>
              </SpotlightCard>

              <SpotlightCard className="hover:scale-[1.02] transition-transform duration-300" spotlightColor="rgba(0,200,83,0.12)">
                <div className="flex flex-col gap-4">
                  <div className="text-[rgba(0,200,83,1)]">
                    <Tag className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Expense Categories</h3>
                  <p className="text-muted-foreground">
                    Categorize your expenses for better insights into where your money goes each month.
                  </p>
                </div>
              </SpotlightCard>

              <SpotlightCard className="hover:scale-[1.02] transition-transform duration-300" spotlightColor="rgba(124,58,237,0.12)">
                <div className="flex flex-col gap-4">
                  <div className="text-[rgba(124,58,237,1)]">
                    <BarChart3 className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Reports & Analytics</h3>
                  <p className="text-muted-foreground">
                    Generate detailed reports and analytics to understand your spending patterns over time.
                  </p>
                </div>
              </SpotlightCard>

              <SpotlightCard className="hover:scale-[1.02] transition-transform duration-300" spotlightColor="rgba(255,82,82,0.12)">
                <div className="flex flex-col gap-4">
                  <div className="text-[rgba(255,82,82,1)]">
                    <Calendar className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Calendar View</h3>
                  <p className="text-muted-foreground">
                    Visualize your expenses on a calendar for a time-based perspective on your spending habits.
                  </p>
                </div>
              </SpotlightCard>

              <SpotlightCard className="hover:scale-[1.02] transition-transform duration-300" spotlightColor="rgba(3,169,244,0.12)">
                <div className="flex flex-col gap-4">
                  <div className="text-[rgba(3,169,244,1)]">
                    <Shield className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Secure & Private</h3>
                  <p className="text-muted-foreground">
                    Your data is protected with bank-level security and privacy measures, because your trust is our priority.
                  </p>
                </div>
              </SpotlightCard>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 md:py-28 relative z-10 overflow-hidden" id="how-it-works">
          {/* Squares Background */}
          <div className="absolute inset-0 z-0">
            <Squares 
              speed={0.3} 
              squareSize={50}
              direction="diagonal"
              borderColor="rgba(255,255,255,0.08)"
              hoverFillColor="rgba(255,255,255,0.03)"
            />
          </div>
          
          {/* Background overlay for content readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-background/85 via-background/75 to-background/85 pointer-events-none z-1" />
          
          {/* Strong vignette effect to blend with other sections */}
          <div className="absolute inset-0 pointer-events-none z-2" style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, transparent 25%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0.5) 65%, rgba(0,0,0,0.8) 80%, rgba(0,0,0,0.95) 90%, black 100%)'
          }} />
          
          <div className="container mx-auto max-w-6xl px-4 relative z-20">
            <div className="text-center mb-20">
              <div className="flex justify-center">
                <BlurText
                  text="Get Started in 3 Simple Steps"
                  delay={150}
                  animateBy="words"
                  direction="top"
                  className="text-3xl md:text-4xl font-black text-foreground mb-6"
                />
              </div>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of users who have simplified their financial management with our intuitive platform
              </p>
            </div>
            
            <div className="relative">
              <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                {/* Step 1 */}
                <div className="group flex flex-col items-center text-center">
                  <div className="relative mb-8">
                    <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-blue-500/10">
                      <div className="text-blue-400">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                      1
                    </div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4 group-hover:text-blue-400 transition-colors">
                    Sign Up
                  </h3>
                  <p className="text-muted-foreground leading-relaxed max-w-sm">
                    Create your free account in just a few minutes. No credit card required, no hidden fees.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="group flex flex-col items-center text-center">
                  <div className="relative mb-8">
                    <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-green-500/10">
                      <div className="text-green-400">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                      2
                    </div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4 group-hover:text-green-400 transition-colors">
                    Add Expenses
                  </h3>
                  <p className="text-muted-foreground leading-relaxed max-w-sm">
                    Easily add your expenses on the go with our user-friendly interface and smart categorization.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="group flex flex-col items-center text-center">
                  <div className="relative mb-8">
                    <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-purple-500/10">
                      <div className="text-purple-400">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                      3
                    </div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4 group-hover:text-purple-400 transition-colors">
                    Track & Analyze
                  </h3>
                  <p className="text-muted-foreground leading-relaxed max-w-sm">
                    Gain powerful insights into your spending habits and make informed financial decisions with ease.
                  </p>
                </div>
              </div>
            </div>

            {/* Call to action */}
            <div className="text-center mt-16">
              <Link to="/create-account">
                <InteractiveHoverButton 
                  text="Start Your Financial Journey" 
                  className="w-56 h-14 text-lg font-bold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                />
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <TestimonialsSection
          title="What Our Users Say"
          description="Join thousands of users who have transformed their financial lives with ExpenseWise"
          testimonials={testimonials}
          className="py-20 relative z-10"
          id="testimonials"
        />
      </main>

      {/* Footer */}
      <footer className="bg-background/50 border-t border-border/20 relative z-10">
        <div className="container mx-auto max-w-6xl py-12 px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 text-foreground mb-4">
                <img 
                  src={ExpenseWiseLogo} 
                  alt="ExpenseWise Logo" 
                  className="h-10 w-10 object-contain"
                />
                <h2 className="text-xl font-bold tracking-tight">ExpenseWise</h2>
              </div>
              <p className="text-muted-foreground">© 2024 ExpenseWise. All rights reserved.</p>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="font-bold text-foreground">Product</h4>
              <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                Features
              </a>
              <Link to="/support" className="text-muted-foreground hover:text-primary transition-colors">
                Support
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="font-bold text-foreground">Company</h4>
              <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                Contact
              </Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-foreground">Stay up to date</h4>
              <form className="flex">
                <input 
                  className="flex-1 rounded-l-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input" 
                  placeholder="Your email address" 
                  type="email"
                />
                <Button type="submit" size="sm" className="rounded-l-none">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>Designed with ❤️ for a better financial future.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}