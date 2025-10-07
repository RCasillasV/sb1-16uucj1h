import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { SomatometryRecord } from '../../types/somatometry';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface WHOHeightForAgeIntegratedProps {
  records: SomatometryRecord[];
  gender: 'M' | 'F';
  patientName: string;
}

// Datos OMS Talla-para-Edad (cm)
const WHO_HEIGHT_DATA = {
  ages: [0, 6, 12, 18, 24, 36, 48, 60],
  boys: {
    sd3pos: [53.5, 72.2, 82.3, 89.2, 95.0, 105.0, 113.5, 121.1],
    sd2pos: [52.3, 70.6, 80.2, 86.8, 92.4, 102.0, 110.0, 117.3],
    sd0: [50.0, 67.6, 76.1, 82.3, 87.1, 96.1, 103.3, 110.2],
    sd2neg: [47.7, 64.6, 72.0, 77.8, 81.8, 90.2, 96.6, 103.1],
    sd3neg: [46.5, 63.0, 70.0, 75.5, 79.4, 87.4, 93.2, 99.9]
  },
  girls: {
    sd3pos: [52.9, 70.9, 80.7, 87.4, 93.1, 102.7, 110.2, 117.3],
    sd2pos: [51.7, 69.4, 78.8, 85.1, 90.8, 100.1, 107.2, 114.2],
    sd0: [49.1, 65.7, 74.4, 80.0, 85.7, 94.1, 100.6, 107.4],
    sd2neg: [46.5, 62.1, 70.0, 74.9, 80.6, 88.1, 94.0, 100.6],
    sd3neg: [45.3, 60.5, 68.0, 72.8, 78.4, 85.4, 90.7, 97.4]
  }
};

export const WHOHeightForAgeIntegrated: React.FC<WHOHeightForAgeIntegratedProps> = ({
  records,
  gender,
  patientName
}) => {
  const isGirl = gender === 'F';
  const data = isGirl ? WHO_HEIGHT_DATA.girls : WHO_HEIGHT_DATA.boys;
  const backgroundColor = isGirl ? '#E91E63' : '#2196F3';
  
  const patientPoints = records.map(r => ({
    x: r.age_months || 0,
    y: r.height || 0
  })).filter(p => p.y > 0).sort((a, b) => a.x - b.x);

  const chartData: ChartData<'line'> = {
    labels: WHO_HEIGHT_DATA.ages,
    datasets: [
      {
        label: '+3 DE',
        data: data.sd3pos,
        borderColor: '#000',
        borderWidth: 3,
        pointRadius: 0,
        tension: 0.4
      },
      {
        label: '+2 DE',
        data: data.sd2pos,
        borderColor: '#FF0000',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4
      },
      {
        label: 'Mediana',
        data: data.sd0,
        borderColor: '#4CAF50',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4
      },
      {
        label: '-2 DE',
        data: data.sd2neg,
        borderColor: '#FF0000',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4
      },
      {
        label: '-3 DE',
        data: data.sd3neg,
        borderColor: '#000',
        borderWidth: 3,
        pointRadius: 0,
        tension: 0.4
      },
      ...(patientPoints.length > 0 ? [{
        label: patientName,
        data: patientPoints,
        borderColor: '#FF6B35',
        backgroundColor: '#FF6B35',
        borderWidth: 3,
        pointRadius: 5,
        tension: 0.2
      }] : [])
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: `Talla para la edad - ${isGirl ? 'NIÑAS' : 'NIÑOS'}`,
        font: { size: 18, weight: 'bold' },
        color: backgroundColor
      },
      legend: {
        position: 'right',
        labels: { usePointStyle: true, padding: 10 }
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            const months = context[0].parsed.x;
            const years = Math.floor(months / 12);
            const remainingMonths = months % 12;
            return `Edad: ${years}a ${remainingMonths}m`;
          },
          label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)} cm`
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: { display: true, text: 'Edad (meses)' },
        min: 0,
        max: 60
      },
      y: {
        title: { display: true, text: 'Talla (cm)' },
        min: 40,
        max: 125
      }
    }
  };

  return (
    <div className="w-full">
      <div className="h-[768px] p-4 rounded-lg" style={{ backgroundColor: `${backgroundColor}08` }}>
        <Line data={chartData} options={options} />
      </div>
      <div className="text-right text-xs text-gray-500 mt-2">
        Estándares de Crecimiento Infantil de la OMS
      </div>
    </div>
  );
};

export default WHOHeightForAgeIntegrated;
