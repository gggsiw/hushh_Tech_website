/**
 * HushhTechCta — Reusable CTA button component
 * Two variants: BLACK (filled) and WHITE (outlined)
 * Rounded, tall buttons matching the premium Hushh design.
 *
 * Usage:
 *   <HushhTechCta variant={HushhTechCtaVariant.BLACK} onClick={handleClick}>
 *     Complete Your Profile <span className="material-symbols-outlined">arrow_forward</span>
 *   </HushhTechCta>
 */
import React from "react";
import { Button, type ButtonVariant } from "../ui/button";

/** Enum for CTA button variants */
export enum HushhTechCtaVariant {
  BLACK = "black",
  WHITE = "white",
}

interface HushhTechCtaProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant — BLACK (filled) or WHITE (outlined) */
  variant: HushhTechCtaVariant;
  /** Button content */
  children: React.ReactNode;
}

/** Tailwind classes for each variant */
const CTA_VARIANTS: Record<HushhTechCtaVariant, ButtonVariant> = {
  [HushhTechCtaVariant.BLACK]: "primary",
  [HushhTechCtaVariant.WHITE]: "secondary",
};

/** Base classes shared by both variants */
const BASE_CLASSES = [
  "w-full",
].join(" ");

const HushhTechCta: React.FC<HushhTechCtaProps> = ({
  variant,
  children,
  className = "",
  ...rest
}) => {
  return (
    <Button
      variant={CTA_VARIANTS[variant]}
      size="lg"
      className={`${BASE_CLASSES} ${className}`}
      {...rest}
    >
      {children}
    </Button>
  );
};

export default HushhTechCta;
