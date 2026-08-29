import React from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

export interface LazyImageProps {
  src: string;
  alt?: string;
  className?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt = "",
  className = "",
}) => {
  return (
    <div className={`overflow-hidden ${className}`}>
      <LazyLoadImage
        src={src}
        alt={alt}
        effect="blur"
        className="w-full h-full object-cover"
        wrapperClassName="w-full h-full block"
      />
    </div>
  );
};
