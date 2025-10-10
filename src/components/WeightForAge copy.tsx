import React from 'react';
import { GrowthChart } from './GrowthChart';
import type { SomatometryRecord } from '../../types/somatometry';

interface WeightForAgeProps {
  records: SomatometryRecord[];
}

export function WeightForAge({ records }: WeightForAgeProps) {
  // Sort records by age
  const sortedRecords = [...records].sort((a, b) => a.age_months - b.age_months);

  // Prepare data for the chart
  const data = {
    labels: sortedRecords.map(r => `${r.age_months}`),
    datasets: [
      {
        label: 'Peso',
        data: sortedRecords.map(r => r.weight),
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F6',
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
      title=""
      data={data}
      yAxisLabel="Peso (kg)"
      xAxisLabel="Edad (meses)"
    />
  );
}