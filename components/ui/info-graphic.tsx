import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

interface InfoGraphicConversationProps {
  icon: ReactNode;
  title: string;
  description: string;
  isLeftArrow: boolean;
  gradient?: boolean;
  button?: ReactNode;
}

export default function InfoGraphic({
  icon,
  title,
  description,
  isLeftArrow,
  gradient = true,
  button,
}: InfoGraphicConversationProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center h-full ${
        gradient ? "bg-gradient-to-b from-background to-secondary/10" : ""
      } p-8`}
    >
      <div className="relative mb-8">
        {icon}
        {isLeftArrow && (
          <ArrowLeft className="absolute -left-12 top-1/2 transform -translate-y-1/2 h-10 w-10 text-primary animate-pulse" />
        )}
      </div>
      <h2 className="text-2xl font-semibold text-foreground mb-2 text-center">
        {title}
      </h2>
      <p className="text-muted-foreground text-center max-w-sm">
        {description}
      </p>
      {button && <div className="mt-4">{button}</div>}
    </div>
  );
}
