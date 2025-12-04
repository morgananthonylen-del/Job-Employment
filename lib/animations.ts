import { gsap } from "gsap";

// Fade in animation
export const fadeIn = (element: HTMLElement | null, delay = 0) => {
  if (!element) return;
  
  gsap.fromTo(
    element,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      delay,
      ease: "power2.out",
    }
  );
};

// Slide in from left
export const slideInLeft = (element: HTMLElement | null, delay = 0) => {
  if (!element) return;
  
  gsap.fromTo(
    element,
    { opacity: 0, x: -50 },
    {
      opacity: 1,
      x: 0,
      duration: 0.6,
      delay,
      ease: "power2.out",
    }
  );
};

// Slide in from right
export const slideInRight = (element: HTMLElement | null, delay = 0) => {
  if (!element) return;
  
  gsap.fromTo(
    element,
    { opacity: 0, x: 50 },
    {
      opacity: 1,
      x: 0,
      duration: 0.6,
      delay,
      ease: "power2.out",
    }
  );
};

// Scale in animation
export const scaleIn = (element: HTMLElement | null, delay = 0) => {
  if (!element) return;
  
  gsap.fromTo(
    element,
    { opacity: 0, scale: 0.8 },
    {
      opacity: 1,
      scale: 1,
      duration: 0.5,
      delay,
      ease: "back.out(1.7)",
    }
  );
};

// Stagger children animation
export const staggerChildren = (
  parent: HTMLElement | null,
  childSelector: string,
  delay = 0
) => {
  if (!parent) return;
  
  const children = parent.querySelectorAll(childSelector);
  
  gsap.fromTo(
    children,
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.1,
      delay,
      ease: "power2.out",
    }
  );
};

// Hover scale animation
export const hoverScale = (element: HTMLElement | null) => {
  if (!element) return;
  
  element.addEventListener("mouseenter", () => {
    gsap.to(element, {
      scale: 1.05,
      duration: 0.3,
      ease: "power2.out",
    });
  });
  
  element.addEventListener("mouseleave", () => {
    gsap.to(element, {
      scale: 1,
      duration: 0.3,
      ease: "power2.out",
    });
  });
};

// Button click animation
export const buttonClick = (element: HTMLElement | null) => {
  if (!element) return;
  
  element.addEventListener("click", () => {
    gsap.to(element, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
    });
  });
};

// Page transition animation
export const pageTransition = (element: HTMLElement | null) => {
  if (!element) return;
  
  gsap.fromTo(
    element,
    { opacity: 0 },
    {
      opacity: 1,
      duration: 0.4,
      ease: "power2.out",
    }
  );
};

// Card reveal animation
export const cardReveal = (element: HTMLElement | null, delay = 0) => {
  if (!element) return;
  
  gsap.fromTo(
    element,
    { opacity: 0, y: 50, rotationX: -15 },
    {
      opacity: 1,
      y: 0,
      rotationX: 0,
      duration: 0.7,
      delay,
      ease: "power3.out",
    }
  );
};

// Number counter animation
export const animateCounter = (
  element: HTMLElement | null,
  targetValue: number,
  duration = 2
) => {
  if (!element) return;
  
  const obj = { value: 0 };
  
  gsap.to(obj, {
    value: targetValue,
    duration,
    ease: "power2.out",
    onUpdate: () => {
      element.textContent = Math.round(obj.value).toString();
    },
  });
};










