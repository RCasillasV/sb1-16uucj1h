import React, { useRef } from 'react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PatientDataPoint {
  age_months: number;
  weight: number;
  measurement_date: string;
}

interface WHOWeightForAgeChartProps {
  gender: 'M' | 'F';
  patientData?: PatientDataPoint[];
  patientName?: string;
}

// Datos simplificados de percentiles OMS Weight-for-Age (0-60 meses)
const WHO_WEIGHT_DATA = {
  ages: [0, 1, 2, 3, 6, 9, 12, 15, 18, 21, 24, 30, 36, 42, 48, 54, 60], // meses
  boys: {
    sd3neg: [2.1, 2.9, 3.8, 4.4, 5.7, 6.4, 7.0, 7.5, 7.9, 8.2, 8.5, 9.0, 9.6, 10.2, 10.8, 11.4, 12.0],
    sd2neg: [2.5, 3.4, 4.3, 4.9, 6.4, 7.1, 7.7, 8.3, 8.8, 9.2, 9.5, 10.1, 10.8, 11.4, 12.0, 12.7, 13.3],
    sd0: [3.3, 4.5, 5.6, 6.4, 7.9, 8.9, 9.6, 10.3, 10.9, 11.5, 12.1, 12.9, 13.7, 14.6, 15.5, 16.4, 17.3],
    sd2pos: [4.4, 5.8, 7.1, 8.0, 9.8, 10.9, 11.8, 12.8, 13.7, 14.5, 15.3, 16.4, 17.6, 18.8, 20.1, 21.4, 22.7],
    sd3pos: [5.0, 6.6, 8.0, 9.0, 10.9, 12.0, 13.1, 14.1, 15.1, 16.0, 16.9, 18.1, 19.4, 20.7, 22.1, 23.6, 25.0]
  },
  girls: {
    sd3neg: [2.0, 2.7, 3.4, 3.9, 5.1, 5.8, 6.4, 6.9, 7.2, 7.5, 7.8, 8.3, 8.8, 9.3, 9.9, 10.4, 10.9],
    sd2neg: [2.4, 3.2, 3.9, 4.5, 5.7, 6.5, 7.0, 7.6, 8.1, 8.5, 8.9, 9.4, 10.0, 10.6, 11.2, 11.8, 12.4],
    sd0: [3.2, 4.2, 5.1, 5.8, 7.3, 8.2, 8.9, 9.6, 10.2, 10.9, 11.5, 12.3, 13.1, 13.9, 14.8, 15.7, 16.6],
    sd2pos: [4.2, 5.5, 6.6, 7.5, 9.3, 10.2, 11.1, 12.1, 12.9, 13.7, 14.6, 15.7, 16.8, 18.0, 19.4, 20.7, 22.1],
    sd3pos: [4.8, 6.2, 7.5, 8.5, 10.4, 11.4, 12.4, 13.4, 14.3, 15.3, 16.3, 17.5, 18.7, 20.0, 21.5, 23.0, 24.6]
  }
};

export const WHOWeightForAgeChart: React.FC<WHOWeightForAgeChartProps> = ({
  gender,
  patientData = [],
  patientName = 'Paciente'
}) => {
  const chartRef = useRef<ChartJS<'line'>>(null);
  
  const isGirl = gender === 'F';
  const data = isGirl ? WHO_WEIGHT_DATA.girls : WHO_WEIGHT_DATA.boys;
  
  // Colores según género (como en las gráficas OMS)
  const backgroundColor = isGirl ? '#E91E63' : '#2196F3';
  const titleColor = isGirl ? '#C2185B' : '#1976D2';
  
  // Preparar datos del paciente
  const patientPoints = patientData.map(point => ({
    x: point.age_months,
    y: point.weight
  }));

  const chartData: ChartData<'line'> = {
    labels: WHO_WEIGHT_DATA.ages,
    datasets: [
      // Líneas de percentiles OMS
      {
        label: '+3 SD',
        data: data.sd3pos,
        borderColor: '#000000',
        backgroundColor: 'transparent',
        borderWidth: 3,
        pointRadius: 0,
        tension: 0.4
      },
      {
        label: '+2 SD',
        data: data.sd2pos,
        borderColor: '#FF0000',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4
      },
      {
        label: '0 SD (Mediana)',
        data: data.sd0,
        borderColor: '#4CAF50',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4
      },
      {
        label: '-2 SD',
        data: data.sd2neg,
        borderColor: '#FF0000',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4
      },
      {
        label: '-3 SD',
        data: data.sd3neg,
        borderColor: '#000000',
        backgroundColor: 'transparent',
        borderWidth: 3,
        pointRadius: 0,
        tension: 0.4
      },
      // Datos del paciente
      ...(patientPoints.length > 0 ? [{
        label: patientName,
        data: patientPoints,
        borderColor: '#FF6B35',
        backgroundColor: '#FF6B35',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.2,
        fill: false
      }] : [])
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: `Peso para la edad - ${isGirl ? 'NIÑAS' : 'NIÑOS'}`,
        font: {
          size: 24,
          weight: 'bold'
        },
        color: titleColor,
        padding: 20
      },
      subtitle: {
        display: true,
        text: 'Nacimiento a 5 años (Puntajes Z)',
        font: {
          size: 14
        },
        color: '#666',
        padding: {
          bottom: 20
        }
      },
      legend: {
        display: true,
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          title: (context) => {
            const ageMonths = context[0].parsed.x;
            const years = Math.floor(ageMonths / 12);
            const months = ageMonths % 12;
            return `Edad: ${years}a ${months}m`;
          },
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)} kg`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: 'Edad (meses y años completados)',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        min: 0,
        max: 60,
        ticks: {
          stepSize: 6,
          callback: function(value) {
            const months = value as number;
            if (months === 0) return 'Nacimiento';
            if (months % 12 === 0) return `${months/12} año${months/12 > 1 ? 's' : ''}`;
            return `${months}m`;
          }
        },
        grid: {
          color: '#E0E0E0',
          lineWidth: 1
        }
      },
      y: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'Peso (kg)',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        min: 2,
        max: 28,
        ticks: {
          stepSize: 2
        },
        grid: {
          color: '#E0E0E0',
          lineWidth: 1
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div 
      className="w-full h-[768px] p-4 rounded-lg shadow-lg"
      style={{ 
        backgroundColor: `${backgroundColor}15`,
        border: `2px solid ${backgroundColor}`
      }}
    >
      <Line ref={chartRef} data={chartData} options={options} />
      
      {/* Footer como en las gráficas OMS */}
      <div className="text-right text-sm text-gray-600 mt-2">
        Estándares de Crecimiento Infantil de la OMS
      </div>
    </div>
  );
};

export default WHOWeightForAgeChart;
