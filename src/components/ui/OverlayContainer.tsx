import { cn } from "@/utils/helpers";
import type React from "react";
import ChildrenContainer from "./ChildrenContainer";

type OverlayContainerProps = {
  onClick?: () => void;
  children: React.ReactNode;
};

const OverlayContainer: React.FC<OverlayContainerProps> = ({
  children,
  onClick,
}) => (
  <div
    className={cn(
      "w-full h-screen absolute inset-0 z-50 grid place-items-center"
    )}
    role="presentation"
    onClick={onClick}
  >
    <ChildrenContainer>{children}</ChildrenContainer>
  </div>
);
export default OverlayContainer;