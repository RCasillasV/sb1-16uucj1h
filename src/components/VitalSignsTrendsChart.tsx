import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { VitalSignRecord } from '../types/vitalSigns.types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface VitalSignsTrendsChartProps {
  records: VitalSignRecord[];
  title?: string;
}

export const VitalSignsTrendsChart: React.FC<VitalSignsTrendsChartProps> = ({ records, title }) => {
  const chartData = useMemo(() => {
    if (records.length === 0 || !records[0].tcSignosVitales) {
      return null;
    }

    const sortedRecords = [...records].sort(
      (a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
    );

    const catalog = records[0].tcSignosVitales;
    const labels = sortedRecords.map((r) => format(new Date(r.fecha_hora), 'dd/MMM HH:mm', { locale: es }));
    const values = sortedRecords.map((r) => r.valor_medido);

    return {
      labels,
      datasets: [
        {
          label: `${catalog.Descripcion} (${catalog.Unidad})`,
          data: values,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          pointBackgroundColor: sortedRecords.map((r) => (r.es_critico ? 'rgb(239, 68, 68)' : 'rgb(59, 130, 246)')),
          pointBorderColor: sortedRecords.map((r) => (r.es_critico ? 'rgb(239, 68, 68)' : 'rgb(59, 130, 246)')),
          pointRadius: sortedRecords.map((r) => (r.es_critico ? 6 : 4)),
          pointHoverRadius: 8,
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Límite Superior Normal',
          data: Array(values.length).fill(catalog.valor_maximo_normal),
          borderColor: 'rgba(34, 197, 94, 0.5)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        },
        {
          label: 'Límite Inferior Normal',
          data: Array(values.length).fill(catalog.valor_minimo_normal),
          borderColor: 'rgba(34, 197, 94, 0.5)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        },
      ],
    };
  }, [records]);

  const options = useMemo(() => {
    if (!records[0]?.tcSignosVitales) return {};

    const catalog = records[0].tcSignosVitales;

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
        },
        title: {
          display: !!title,
          text: title || '',
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              if (context.datasetIndex === 0) {
                const record = records[context.dataIndex];
                return [
                  `Valor: ${context.parsed.y} ${catalog.Unidad}`,
                  record.es_critico ? '⚠️ CRÍTICO' : '',
                  record.notas ? `Nota: ${record.notas}` : '',
                ].filter(Boolean);
              }
              return `${context.dataset.label}: ${context.parsed.y} ${catalog.Unidad}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: catalog.Unidad,
          },
          ticks: {
            callback: function (value: any) {
              return `${value} ${catalog.Unidad}`;
            },
          },
        },
        x: {
          title: {
            display: true,
            text: 'Fecha y Hora',
          },
        },
      },
    };
  }, [records, title]);

  if (!chartData) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">No hay datos suficientes para mostrar la gráfica</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div style={{ height: '400px' }}>
        <Line data={chartData} options={options} />
      </div>
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Valor Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Valor Crítico</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 border-t-2 border-green-500 border-dashed"></div>
          <span>Rango Normal</span>
        </div>
      </div>
    </div>
  );
};
