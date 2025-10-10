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
        position: 'right' as const,
        labels: {
          color: currentTheme.colors.text,
          font: {
            family: currentTheme.typography.fonts.body,
          },
        },
      },
      title: {
        display: !!title,
        text: title,
        color: currentTheme.colors.text,
        font: {
          family: currentTheme.typography.fonts.headings,
          size: 16,
          weight: 'bold' as const,
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
          family: currentTheme.typography.fonts.body,
        },
        titleFont: {
          family: currentTheme.typography.fonts.headings,
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
            family: currentTheme.typography.fonts.body,
          },
        },
        grid: {
          color: currentTheme.colors.border,
        },
        ticks: {
          color: currentTheme.colors.text,
          font: {
            family: currentTheme.typography.fonts.body,
          },
        },
      },
      x: {
        title: {
          display: !!xAxisLabel,
          text: xAxisLabel,
          color: currentTheme.colors.text,
          font: {
            family: currentTheme.typography.fonts.body,
          },
        },
        grid: {
          color: currentTheme.colors.border,
        },
        ticks: {
          color: currentTheme.colors.text,
          font: {
            family: currentTheme.typography.fonts.body,
          },
        },
      },
    },
  };

  return (
    <div className="h-[320px] w-full">
      <Line options={options} data={data} />
    </div>
  );
}