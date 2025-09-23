import React, { useState, useEffect } from 'react';

interface PlanetBackgroundProps {
  planetSlug: string;
  children: React.ReactNode;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  fallbackGradient?: string;
}

const PlanetBackground: React.FC<PlanetBackgroundProps> = ({
  planetSlug,
  children,
  className = '',
  overlay = true,
  overlayOpacity = 0.7,
  fallbackGradient = 'from-gray-900 to-gray-700'
}) => {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // For now, use placeholder planet backgrounds
    // In the future, this will integrate with planet asset service
    const loadPlanetBackground = async () => {
      try {
        // Placeholder implementation - would use asset service
        const planetBackgrounds: Record<string, string> = {
          mustafar: '/assets/planets/backgrounds/mustafar.webp',
          coruscant: '/assets/planets/backgrounds/coruscant.webp',
          hoth: '/assets/planets/backgrounds/hoth.webp',
          endor: '/assets/planets/backgrounds/endor.webp',
          jakku: '/assets/planets/backgrounds/jakku.webp',
          kashyyyk: '/assets/planets/backgrounds/kashyyyk.webp',
          geonosis: '/assets/planets/backgrounds/geonosis.webp'
        };

        const backgroundUrl = planetBackgrounds[planetSlug.toLowerCase()];
        if (backgroundUrl) {
          // Test if image exists
          const img = new Image();
          img.onload = () => {
            setBackgroundImage(backgroundUrl);
            setImageLoaded(true);
          };
          img.onerror = () => {
            setImageError(true);
          };
          img.src = backgroundUrl;
        } else {
          setImageError(true);
        }
      } catch (error) {
        console.error('Error loading planet background:', error);
        setImageError(true);
      }
    };

    loadPlanetBackground();
  }, [planetSlug]);

  const getBackgroundStyle = () => {
    if (imageLoaded && backgroundImage) {
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    return {};
  };

  const getPlanetGradient = (planet: string) => {
    const gradients: Record<string, string> = {
      mustafar: 'from-red-900 via-orange-800 to-yellow-700',
      coruscant: 'from-blue-900 via-purple-800 to-indigo-700',
      hoth: 'from-blue-100 via-gray-200 to-white',
      endor: 'from-green-800 via-emerald-700 to-green-600',
      jakku: 'from-yellow-600 via-orange-500 to-red-500',
      kashyyyk: 'from-green-900 via-emerald-800 to-green-700',
      geonosis: 'from-red-800 via-orange-700 to-yellow-600'
    };
    return gradients[planet.toLowerCase()] || fallbackGradient;
  };

  return (
    <div
      className={`relative min-h-screen w-full ${className}`}
      style={getBackgroundStyle()}
    >
      {/* Fallback gradient background */}
      {(!imageLoaded || imageError) && (
        <div className={`absolute inset-0 bg-gradient-to-br ${getPlanetGradient(planetSlug)}`} />
      )}

      {/* Overlay for better text readability */}
      {overlay && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Loading state */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full animate-spin border-t-2 border-white"></div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Planet name indicator (optional) */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className="bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-full capitalize">
          {planetSlug.replace('-', ' ')}
        </div>
      </div>
    </div>
  );
};

export default PlanetBackground;