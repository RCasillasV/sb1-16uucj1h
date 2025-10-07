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

interface WHOBMIForAgeIntegratedProps {
  records: SomatometryRecord[];
  gender: 'M' | 'F';
  patientName: string;
}

// Datos OMS IMC-para-Edad (kg/m²)
const WHO_BMI_DATA = {
  ages: [0, 6, 12, 18, 24, 36, 48, 60],
  boys: {
    sd3pos: [18.1, 19.0, 19.3, 19.0, 18.5, 18.6, 19.3, 20.2],
    sd2pos: [17.2, 18.0, 18.3, 18.0, 17.6, 17.6, 18.2, 19.0],
    sd0: [15.6, 16.3, 16.8, 16.6, 16.2, 15.9, 16.2, 16.9],
    sd2neg: [14.1, 14.7, 15.3, 15.2, 14.9, 14.4, 14.4, 14.9],
    sd3neg: [13.4, 14.0, 14.6, 14.5, 14.2, 13.7, 13.6, 14.1]
  },
  girls: {
    sd3pos: [17.7, 18.8, 19.4, 19.2, 18.9, 18.9, 19.4, 20.0],
    sd2pos: [16.8, 17.7, 18.3, 18.1, 17.8, 17.8, 18.2, 18.8],
    sd0: [15.2, 15.8, 16.4, 16.3, 16.0, 15.8, 16.0, 16.5],
    sd2neg: [13.7, 14.1, 14.6, 14.6, 14.4, 14.0, 14.0, 14.4],
    sd3neg: [13.0, 13.4, 13.9, 13.9, 13.7, 13.3, 13.2, 13.6]
  }
};

export const WHOBMIForAgeIntegrated: React.FC<WHOBMIForAgeIntegratedProps> = ({
  records,
  gender,
  patientName
}) => {
  const isGirl = gender === 'F';
  const data = isGirl ? WHO_BMI_DATA.girls : WHO_BMI_DATA.boys;
  const backgroundColor = isGirl ? '#E91E63' : '#2196F3';
  
  const patientPoints = records.map(r => ({
    x: r.age_months || 0,
    y: r.bmi || 0
  })).filter(p => p.y > 0).sort((a, b) => a.x - b.x);

  const chartData: ChartData<'line'> = {
    labels: WHO_BMI_DATA.ages,
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
        text: `IMC para la edad - ${isGirl ? 'NIÑAS' : 'NIÑOS'}`,
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
          label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)} kg/m²`
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
        title: { display: true, text: 'IMC (kg/m²)' },
        min: 12,
        max: 22
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

export default WHOBMIForAgeIntegrated;
