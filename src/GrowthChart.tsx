import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../../contexts/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface GrowthChartProps {
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      borderWidth?: number;
      pointRadius?: number;
      fill?: boolean;
    }[];
  };
  yAxisLabel: string;
  xAxisLabel?: string;
}

export function GrowthChart({ title, data, yAxisLabel, xAxisLabel }: GrowthChartProps) {
  const { currentTheme } = useTheme();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: currentTheme.colors.text,
          font: {
            family: currentTheme.typography.fontFamily,
          },
        },
      },
      title: {
        display: true,
        text: title,
        color: currentTheme.colors.text,
        font: {
          family: currentTheme.typography.fontFamily,
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        backgroundColor: currentTheme.colors.surface,
        titleColor: currentTheme.colors.text,
        bodyColor: currentTheme.colors.text,
        borderColor: currentTheme.colors.border,
        borderWidth: 1,
        padding: 10,
        bodyFont: {
          family: currentTheme.typography.fontFamily,
        },
        titleFont: {
          family: currentTheme.typography.fontFamily,
        },
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: yAxisLabel,
          color: currentTheme.colors.text,
          font: {
            family: currentTheme.typography.fontFamily,
          },
        },
        grid: {
          color: currentTheme.colors.border,
        },
        ticks: {
          color: currentTheme.colors.text,
          font: {
            family: currentTheme.typography.fontFamily,
          },
        },
      },
      x: {
        title: {
          display: !!xAxisLabel,
          text: xAxisLabel,
          color: currentTheme.colors.text,
          font: {
            family: currentTheme.typography.fontFamily,
          },
        },
        grid: {
          color: currentTheme.colors.border,
        },
        ticks: {
          color: currentTheme.colors.text,
          font: {
            family: currentTheme.typography.fontFamily,
          },
        },
      },
    },
  };

  return (
    <div className="h-[400px] w-full">
      <Line options={options} data={data} />
    </div>
  );
}