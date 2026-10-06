"use client";

import { ResponsiveContainer } from "recharts";
import { useEffect, useRef, useState } from "react";

interface ChartWrapperProps {
  children: React.ReactNode;
  height?: number;
  className?: string;
  fallback?: React.ReactNode;
}

export function ChartWrapper({ children, height = 300, className = "", fallback }: ChartWrapperProps) {
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        containerRef.current.style.height = `${height}px`;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [height]);

  if (hasError) {
    return (
      <div
        ref={containerRef}
        className={`flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
        style={{ height }}
      >
        {fallback || (
          <div className="text-center text-gray-500 dark:text-gray-400 p-4">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Erro ao carregar gráfico</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full ${className}`}
      style={{ height }}
      onError={() => setHasError(true)}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}