import React, { useState, useEffect } from 'react';
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
import { somatometryService } from '../../services/somatometryService';
import { supabase } from '../../lib/supabase';
import type { SomatometryRecord } from '../../types/somatometry';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface WHOWeightForAgeFromDBProps {
  records: SomatometryRecord[];
  gender: 'M' | 'F';
  patientName: string;
}

export const WHOWeightForAgeFromDB: React.FC<WHOWeightForAgeFromDBProps> = ({
  records,
  gender,
  patientName
}) => {
  const [whoData, setWhoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isGirl = gender === 'F';
  const backgroundColor = isGirl ? '#E91E63' : '#2196F3';

  // Cargar datos OMS desde la base de datos
  useEffect(() => {
    const loadWHOData = async () => {
      try {
        setLoading(true);
        // Convertir género a formato de BD (M/F)
        const genderCode = (gender === 'F' || gender?.toLowerCase().includes('femenino') || gender?.toLowerCase().includes('female')) ? 'F' : 'M';
        console.log('🔍 Cargando datos OMS para:', { type: 'weight', gender, genderCode });
        
        // Probar consulta directa a la tabla
        const { data: rawData, error: rawError } = await supabase
          .from('tcSomatometriasPesoEdad')
          .select('*')
          .eq('sex', genderCode)
          .limit(5);
        
        console.log('🔍 Consulta directa a tabla:', { rawData, rawError, count: rawData?.length || 0 });
        
        const data = await somatometryService.getWHOChartData('weight', genderCode);
        console.log('📊 Datos OMS recibidos:', data);
        console.log('📈 Cantidad de puntos:', data?.ages?.length || 0);
        
        // Si la BD está vacía, usar datos hardcodeados como fallback
        if (!data?.ages?.length) {
          console.log('⚠️ BD vacía, usando datos hardcodeados como fallback');
          const fallbackData = {
            ages: [0, 6, 12, 18, 24, 36, 48, 60],
            sd3neg: genderCode === 'M' ? [2.0, 5.7, 7.1, 8.2, 9.0, 10.5, 11.8, 13.0] : [2.0, 5.1, 6.5, 7.5, 8.2, 9.6, 10.8, 12.0],
            sd2neg: genderCode === 'M' ? [2.3, 6.2, 7.7, 8.8, 9.7, 11.3, 12.7, 14.1] : [2.3, 5.6, 7.0, 8.1, 8.9, 10.3, 11.6, 12.8],
            sd0: genderCode === 'M' ? [3.3, 7.9, 9.6, 10.9, 12.0, 14.0, 15.7, 17.3] : [3.2, 7.3, 8.9, 10.1, 11.2, 13.0, 14.6, 16.1],
            sd2pos: genderCode === 'M' ? [4.4, 9.7, 11.8, 13.3, 14.6, 17.0, 19.1, 21.0] : [4.2, 9.0, 10.9, 12.4, 13.7, 15.9, 17.9, 19.7],
            sd3pos: genderCode === 'M' ? [5.0, 10.9, 13.3, 15.0, 16.5, 19.3, 21.7, 23.9] : [4.8, 10.1, 12.2, 14.0, 15.5, 18.0, 20.3, 22.4]
          };
          setWhoData(fallbackData);
        } else {
          setWhoData(data);
        }
        setError(null);
      } catch (err) {
        console.error('❌ Error loading WHO data:', err);
        setError(`Error al cargar datos OMS: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    loadWHOData();
  }, [gender]);

  // Procesar datos del paciente
  const patientPoints = records.map(r => ({
    x: r.age_months || 0,
    y: r.weight || 0
  })).filter(p => p.y > 0).sort((a, b) => a.x - b.x);

  if (loading) {
    return (
      <div className="w-full h-[768px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos OMS...</p>
        </div>
      </div>
    );
  }

  if (error || !whoData) {
    return (
      <div className="w-full h-[768px] flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error al cargar gráfica</p>
          <p className="text-sm">{error || 'No se pudieron cargar los datos OMS'}</p>
        </div>
      </div>
    );
  }

  const chartData: ChartData<'line'> = {
    labels: whoData.ages,
    datasets: [
      {
        label: '+3 DE (P97)',
        data: whoData.sd3pos,
        borderColor: '#000',
        borderWidth: 3,
        pointRadius: 0,
        tension: 0.4,
        fill: false
      },
      {
        label: '+2 DE (P85)',
        data: whoData.sd2pos,
        borderColor: '#FF0000',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: false
      },
      {
        label: 'Mediana (P50)',
        data: whoData.sd0,
        borderColor: '#4CAF50',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: false
      },
      {
        label: '-2 DE (P15)',
        data: whoData.sd2neg,
        borderColor: '#FF0000',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: false
      },
      {
        label: '-3 DE (P3)',
        data: whoData.sd3neg,
        borderColor: '#000',
        borderWidth: 3,
        pointRadius: 0,
        tension: 0.4,
        fill: false
      },
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
        text: `Peso para la edad - ${isGirl ? 'NIÑAS' : 'NIÑOS'} (Datos OMS BD)`,
        font: { size: 18, weight: 'bold' },
        color: backgroundColor
      },
      legend: {
        position: 'right',
        labels: { 
          usePointStyle: true, 
          padding: 10,
          font: { size: 11 }
        }
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            const months = context[0].parsed.x;
            const years = Math.floor(months / 12);
            const remainingMonths = months % 12;
            return `Edad: ${years}a ${remainingMonths}m`;
          },
          label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)} kg`,
          footer: () => `Total puntos OMS: ${whoData.ages.length}`
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
        title: { 
          display: true, 
          text: 'Peso (kg)',
          font: { size: 14, weight: 'bold' }
        },
        min: 2,
        max: 28,
        grid: { color: '#E0E0E0' }
      }
    }
  };

  return (
    <div className="w-full">
      <div 
        className="h-[768px] p-4 rounded-lg" 
        style={{ backgroundColor: `${backgroundColor}08` }}
      >
        <Line data={chartData} options={options} />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>Estándares de Crecimiento Infantil de la OMS</span>
        <span>
          {whoData?.ages?.length ? (
            `✅ Datos: ${whoData.ages.length} puntos de 0-60 meses`
          ) : (
            `❌ Sin datos OMS cargados`
          )}
        </span>
      </div>
      
      {/* Debug info */}
      <div className="text-xs text-gray-400 mt-1 text-center">
        Estado: {loading ? '⏳ Cargando...' : error ? '❌ Error' : whoData ? '✅ Datos cargados' : '⚠️ Sin datos'}
      </div>
    </div>
  );
};

export default WHOWeightForAgeFromDB;
