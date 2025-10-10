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

interface WHOHeightForAgeFromDBProps {
  records: SomatometryRecord[];
  gender: 'M' | 'F';
  patientName: string;
}

export const WHOHeightForAgeFromDB: React.FC<WHOHeightForAgeFromDBProps> = ({
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
        console.log('🔍 Cargando datos OMS Talla para:', { type: 'height', gender, genderCode });
        
        // Probar consulta directa a la tabla
        const { data: rawData, error: rawError } = await supabase
          .from('tcSomatometriasAlturaEdad')
          .select('*')
          .eq('sex', genderCode)
          .limit(5);
        
        console.log('🔍 Consulta directa a tabla Talla:', { rawData, rawError, count: rawData?.length || 0 });
        
        // Usar datos completos de la BD directamente
        const completeData = await somatometryService.getCompleteWHOHeightData(genderCode);
        console.log('📊 Datos OMS Talla completos recibidos:', completeData);
        console.log('📈 Cantidad de puntos Talla:', completeData?.length || 0);
        
        if (!completeData?.length) {
          throw new Error('No hay datos OMS de Talla disponibles en la base de datos');
        }
        
        // Formatear datos para Chart.js
        const formattedData = {
          ages: completeData.map(d => d.age_months),
          sd3neg: completeData.map(d => d.p3),
          sd2neg: completeData.map(d => d.p15),
          sd0: completeData.map(d => d.p50),
          sd2pos: completeData.map(d => d.p85),
          sd3pos: completeData.map(d => d.p97)
        };
        
        setWhoData(formattedData);
        setError(null);
      } catch (err) {
        console.error('❌ Error loading WHO height data:', err);
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
    y: r.height || 0
  })).filter(p => p.y > 0).sort((a, b) => a.x - b.x);

  if (loading) {
    return (
      <div className="w-full h-[768px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos OMS Talla...</p>
        </div>
      </div>
    );
  }

  if (error || !whoData) {
    return (
      <div className="w-full h-[768px] flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error al cargar gráfica de Talla</p>
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
        text: `Talla para la edad - ${isGirl ? 'NIÑAS' : 'NIÑOS'} (Datos OMS BD)`,
        font: { size: 18, weight: 'bold' },
        color: backgroundColor
      },
      legend: {
        position: 'top',
        align: 'end',  // Alinear arriba
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
          label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)} cm`
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
          stepSize: 1, // Un tick por mes
          autoSkip: false, // No omitir ticks automáticamente
          maxRotation: 0,
          minRotation: 0,
          callback: function(value) {
            const months = value as number;
            if (months === 0) return 'Nacimiento';
            if (months % 12 === 0) return `${months/12} año${months/12 > 1 ? 's' : ''}`;
            // Mostrar solo cada 6 meses para mantener la legibilidad
            return months % 6 === 0 ? `${months}m` : '';
          }
        },
        grid: {
          color: (context) => {
            // Líneas más oscuras cada 6 meses
            return context.tick.value % 6 === 0 ? '#A0A0A0' : '#D0D0D0';
          },
          lineWidth: (context) => {
            // Líneas más gruesas cada 6 meses
            return context.tick.value % 6 === 0 ? 1.5 : 1;
          },
          drawTicks: true,
          drawOnChartArea: true
        }
      },
      y: {
        title: { 
          display: true, 
          text: 'Talla (cm)',
          font: { size: 14, weight: 'bold' }
        },
        min: 40,
        max: 125,
        ticks: {
          stepSize: 5,
          callback: (value) => `${value} cm`
        },
        grid: {
          color: (context) => {
            // Líneas más oscuras cada 10 cm
            return context.tick.value % 10 === 0 ? '#A0A0A0' : '#D0D0D0';
          },
          lineWidth: (context) => {
            // Líneas más gruesas cada 10 cm
            return context.tick.value % 10 === 0 ? 1.5 : 1;
          },
          drawTicks: true,
          drawOnChartArea: true
        }
      }
    }
  };

  return (
    <div className="w-full">
      <div 
        className="h-[70vh] p-4 rounded-lg"
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

export default WHOHeightForAgeFromDB;
