import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface CustomSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  normalRange?: { min: number; max: number };
  label: string;
  unit: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function CustomSlider({
  value,
  onChange,
  min,
  max,
  step = 0.1,
  normalRange,
  label,
  unit,
  icon,
  disabled = false
}: CustomSliderProps) {
  const { currentTheme } = useTheme();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  const percentage = ((value - min) / (max - min)) * 100;
  const normalStartPercentage = normalRange ? ((normalRange.min - min) / (max - min)) * 100 : 0;
  const normalEndPercentage = normalRange ? ((normalRange.max - min) / (max - min)) * 100 : 100;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && (
            <div style={{ color: currentTheme.colors.secondary }}>
              {icon}
            </div>
          )}
          <span 
            className="text-sm font-medium"
            style={{ color: currentTheme.colors.text }}
          >
            {label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span 
            className="text-lg font-bold"
            style={{ color: currentTheme.colors.text }}
          >
            {value.toFixed(1)}
          </span>
          <span 
            className="text-sm"
            style={{ color: currentTheme.colors.textSecondary }}
          >
            {unit}
          </span>
        </div>
      </div>

      {/* Slider Container */}
      <div className="relative">
        {/* Track Background */}
        <div 
          className="w-full h-2 rounded-full relative"
          style={{ backgroundColor: `${currentTheme.colors.border}40` }}
        >
          {/* Normal Range Indicator */}
          {normalRange && (
            <div
              className="absolute h-2 rounded-full"
              style={{
                backgroundColor: `${currentTheme.colors.secondary}30`,
                left: `${normalStartPercentage}%`,
                width: `${normalEndPercentage - normalStartPercentage}%`
              }}
            />
          )}
          
          {/* Progress Track */}
          <div
            className="absolute h-2 rounded-full"
            style={{
              backgroundColor: currentTheme.colors.secondary,
              width: `${percentage}%`
            }}
          />
          
          {/* Thumb */}
          <div
            className="absolute w-5 h-5 rounded-full border-2 transform -translate-y-1.5 transition-all duration-200 hover:scale-110"
            style={{
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.secondary,
              left: `calc(${percentage}% - 10px)`
            }}
          />
        </div>

        {/* Hidden Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>

      {/* Range Labels */}
      <div className="flex justify-between items-center">
        <span 
          className="text-xs"
          style={{ color: currentTheme.colors.textSecondary }}
        >
          {min}
        </span>
        
        {normalRange && (
          <span 
            className="text-xs px-2 py-1 rounded-full"
            style={{ 
              color: currentTheme.colors.secondary,
              backgroundColor: `${currentTheme.colors.secondary}20`
            }}
          >
            Normal
          </span>
        )}
        
        <span 
          className="text-xs"
          style={{ color: currentTheme.colors.textSecondary }}
        >
          {max}
        </span>
      </div>
    </div>
  );
}
