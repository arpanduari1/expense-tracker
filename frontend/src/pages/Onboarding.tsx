import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";

import OnboardingImage1 from "@/assets/Onboard Images/onboarding-1.png";
import OnboardingImage2 from "@/assets/Onboard Images/onboarding-2.png";
import OnboardingImage3 from "@/assets/Onboard Images/onboarding-3.png";

const onboardingSteps = [
  {
    image: OnboardingImage1,
    title: "Track Your Expenses",
    description: "Easily log every transaction to see where your money is going. Stay on top of your spending effortlessly.",
  },
  {
    image: OnboardingImage2,
    title: "Set Your Budgets",
    description: "Create monthly budgets for different categories to control your spending and save more effectively.",
  },
  {
    image: OnboardingImage3,
    title: "Visualize Your Habits",
    description: "Get clear insights with simple charts and reports. Understand your financial habits to make smarter decisions.",
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const handleFinish = () => {
    localStorage.setItem("hasOnboarded", "true");
    navigate("/login");
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl mx-auto">
        <Carousel setApi={setApi} className="w-full" opts={{ loop: true }}>
          <CarouselContent>
            {onboardingSteps.map((step, index) => (
              <CarouselItem key={index}>
                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
                  <div
                    className="w-full h-64 lg:h-[400px] lg:w-1/2 bg-center bg-cover rounded-lg shadow-sm"
                    style={{ backgroundImage: `url("${step.image}")` }}
                  />
                  <div className="flex flex-col gap-6 text-center lg:text-left lg:w-1/2">
                    <div className="flex flex-col gap-2">
                      <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground lg:text-5xl">
                        {step.title}
                      </h1>
                      <p className="text-base leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                      {index === onboardingSteps.length - 1 ? (
                        <Button onClick={handleFinish} size="lg" className="h-12 px-6 text-base font-bold">
                          Get Started
                        </Button>
                      ) : (
                        <Button onClick={() => api?.scrollNext()} size="lg" className="h-12 px-6 text-base font-bold">
                          Next
                        </Button>
                      )}
                      <Button onClick={handleFinish} variant="secondary" size="lg" className="h-12 px-6 text-base font-bold">
                        Skip
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        
        <div className="flex items-center justify-center space-x-2 mt-8">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                current === index + 1 ? "w-6 bg-primary" : "w-2 bg-muted hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        
        <p className="text-muted-foreground text-sm font-normal leading-normal text-center pt-4">
          Step {current || 1} of {count || onboardingSteps.length}
        </p>
      </div>
    </div>
  );
};

export default Onboarding;