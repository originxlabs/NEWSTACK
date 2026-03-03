import { useState, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PlaceImage {
  url: string;
  alt: string;
}

interface PlaceCardProps {
  name: string;
  address?: string;
  rating?: number;
  category?: string;
  distance?: string;
  images: PlaceImage[];
  onClick?: () => void;
}

export function PlaceCardWithImages({ name, address, rating, category, distance, images, onClick }: PlaceCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate placeholder images if none provided
  const displayImages = images.length > 0 ? images : [
    { url: `https://source.unsplash.com/800x600/?${encodeURIComponent(name)},landmark`, alt: name },
    { url: `https://source.unsplash.com/800x600/?${encodeURIComponent(name)},tourism`, alt: name },
    { url: `https://source.unsplash.com/800x600/?${encodeURIComponent(name)},attraction`, alt: name },
    { url: `https://source.unsplash.com/800x600/?${encodeURIComponent(name)},travel`, alt: name },
  ];

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (info.offset.x < -threshold && currentIndex < displayImages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < displayImages.length - 1) setCurrentIndex(currentIndex + 1);
  };

  return (
    <Card 
      className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02]"
      onClick={onClick}
    >
      {/* Image Carousel */}
      <div className="relative h-48 overflow-hidden" ref={containerRef}>
        <motion.div
          className="flex h-full"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          animate={{ x: -currentIndex * 100 + "%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ width: `${displayImages.length * 100}%` }}
        >
          {displayImages.map((image, index) => (
            <div key={index} className="relative h-full" style={{ width: `${100 / displayImages.length}%` }}>
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://source.unsplash.com/800x600/?place,${index}`;
                }}
              />
            </div>
          ))}
        </motion.div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />

        {/* Navigation arrows */}
        {displayImages.length > 1 && (
          <>
            <Button
              size="icon"
              variant="ghost"
              className={`absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity ${
                currentIndex === 0 ? "invisible" : ""
              }`}
              onClick={goToPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity ${
                currentIndex === displayImages.length - 1 ? "invisible" : ""
              }`}
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Dots indicator */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {displayImages.map((_, index) => (
              <button
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentIndex ? "bg-white w-4" : "bg-white/50"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
              />
            ))}
          </div>
        )}

        {/* Category badge */}
        {category && (
          <Badge className="absolute top-3 left-3 text-xs bg-background/80 backdrop-blur-sm">
            {category}
          </Badge>
        )}

        {/* Distance badge */}
        {distance && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {distance}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {name}
          </h3>
          {rating && (
            <div className="flex items-center gap-1 text-xs shrink-0">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <span>{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        {address && (
          <p className="text-xs text-muted-foreground line-clamp-1">{address}</p>
        )}
      </div>
    </Card>
  );
}
