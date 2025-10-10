import React from 'react';
import { GrowthChart } from './GrowthChart';
import type { SomatometryRecord } from '../../types/somatometry';

interface BMIForAgeProps {
  records: SomatometryRecord[];
}

export function BMIForAge({ records }: BMIForAgeProps) {
  // Sort records by age
  const sortedRecords = [...records].sort((a, b) => a.age_months - b.age_months);

  // Prepare data for the chart
  const data = {
    labels: sortedRecords.map(r => `${r.age_months}`),
    datasets: [
      {
        label: 'IMC',
        data: sortedRecords.map(r => r.bmi || 0),
        borderColor: '#8B5CF6',
        backgroundColor: '#8B5CF6',
        borderWidth: 2,
        pointRadius: 4,
      },
      {
        label: 'P97',
        data: sortedRecords.map(() => 97),
        borderColor: '#D1D5DB',
        backgroundColor: '#D1D5DB',
        borderWidth: 1,
        pointRadius: 0,
      },
      {
        label: 'P85',
        data: sortedRecords.map(() => 85),
        borderColor: '#E5E7EB',
        backgroundColor: '#E5E7EB',
        borderWidth: 1,
        pointRadius: 0,
      },
      {
        label: 'P50',
        data: sortedRecords.map(() => 50),
        borderColor: '#9CA3AF',
        backgroundColor: '#9CA3AF',
        borderWidth: 1,
        pointRadius: 0,
      },
      {
        label: 'P15',
        data: sortedRecords.map(() => 15),
        borderColor: '#E5E7EB',
        backgroundColor: '#E5E7EB',
        borderWidth: 1,
        pointRadius: 0,
      },
      {
        label: 'P3',
        data: sortedRecords.map(() => 3),
        borderColor: '#D1D5DB',
        backgroundColor: '#D1D5DB',
        borderWidth: 1,
        pointRadius: 0,
      },
    ],
  };

  return (
    <GrowthChart
      title="IMC para la Edad"
      data={data}
      yAxisLabel="IMC"
      xAxisLabel="Edad (meses)"
    />
  );
}