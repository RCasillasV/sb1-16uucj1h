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

interface WHOHeadCircumferenceIntegratedProps {
  records: SomatometryRecord[];
  gender: 'M' | 'F';
  patientName: string;
}

// Datos OMS Perímetro Cefálico-para-Edad (cm) - 0 a 24 meses
const WHO_HEAD_DATA = {
  ages: [0, 1, 2, 3, 6, 9, 12, 15, 18, 21, 24],
  boys: {
    sd3pos: [38.9, 41.5, 43.4, 44.8, 47.4, 49.0, 50.2, 51.2, 52.0, 52.7, 53.2],
    sd2pos: [37.9, 40.5, 42.4, 43.8, 46.4, 48.0, 49.2, 50.2, 51.0, 51.7, 52.2],
    sd0: [35.8, 38.4, 40.3, 41.7, 44.3, 45.9, 47.1, 48.1, 48.9, 49.6, 50.1],
    sd2neg: [33.7, 36.3, 38.2, 39.6, 42.2, 43.8, 45.0, 46.0, 46.8, 47.5, 48.0],
    sd3neg: [32.7, 35.3, 37.2, 38.6, 41.2, 42.8, 44.0, 45.0, 45.8, 46.5, 47.0]
  },
  girls: {
    sd3pos: [37.9, 40.2, 42.2, 43.6, 46.0, 47.5, 48.6, 49.6, 50.3, 51.0, 51.5],
    sd2pos: [36.9, 39.2, 41.2, 42.6, 45.0, 46.5, 47.6, 48.6, 49.3, 50.0, 50.5],
    sd0: [34.7, 37.0, 39.0, 40.4, 42.8, 44.3, 45.4, 46.4, 47.1, 47.8, 48.3],
    sd2neg: [32.5, 34.8, 36.8, 38.2, 40.6, 42.1, 43.2, 44.2, 44.9, 45.6, 46.1],
    sd3neg: [31.5, 33.8, 35.8, 37.2, 39.6, 41.1, 42.2, 43.2, 43.9, 44.6, 45.1]
  }
};

export const WHOHeadCircumferenceIntegrated: React.FC<WHOHeadCircumferenceIntegratedProps> = ({
  records,
  gender,
  patientName
}) => {
  const isGirl = gender === 'F';
  const data = isGirl ? WHO_HEAD_DATA.girls : WHO_HEAD_DATA.boys;
  const backgroundColor = isGirl ? '#E91E63' : '#2196F3';
  
  // Filtrar solo registros de 0-24 meses con perímetro cefálico
  const patientPoints = records
    .filter(r => (r.age_months || 0) <= 24 && (r.head_circumference || 0) > 0)
    .map(r => ({
      x: r.age_months || 0,
      y: r.head_circumference || 0
    }))
    .sort((a, b) => a.x - b.x);

  const chartData: ChartData<'line'> = {
    labels: WHO_HEAD_DATA.ages,
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
        text: `Perímetro cefálico para la edad - ${isGirl ? 'NIÑAS' : 'NIÑOS'}`,
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
        max: 24,
        ticks: {
          stepSize: 3,
          callback: function(value) {
            return `${value}m`;
          }
        }
      },
      y: {
        title: { display: true, text: 'Perímetro Cefálico (cm)' },
        min: 30,
        max: 55
      }
    }
  };

  return (
    <div className="w-full">
      <div className="h-[70vh] p-4 rounded-lg" style={{ backgroundColor: `${backgroundColor}08` }}>
        <Line data={chartData} options={options} />
      </div>
      <div className="text-right text-xs text-gray-500 mt-2">
        Estándares de Crecimiento Infantil de la OMS (0-24 meses)
      </div>
      {patientPoints.length === 0 && (
        <div className="text-center text-gray-500 mt-4">
          <p>No hay mediciones de perímetro cefálico para mostrar.</p>
          <p className="text-sm">El perímetro cefálico se mide típicamente en menores de 24 meses.</p>
        </div>
      )}
    </div>
  );
};

export default WHOHeadCircumferenceIntegrated;
