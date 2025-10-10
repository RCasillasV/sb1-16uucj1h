import React from 'react';
import { GrowthChart } from './GrowthChart';
import type { SomatometryRecord } from '../../types/somatometry';

interface HeadCircumferenceForAgeProps {
  records: SomatometryRecord[];
}

export function HeadCircumferenceForAge({ records }: HeadCircumferenceForAgeProps) {
  // Filter records with head circumference and age <= 36 months
  const filteredRecords = records
    .filter(r => r.head_circumference && r.age_months <= 36)
    .sort((a, b) => a.age_months - b.age_months);

  // Prepare data for the chart
  const data = {
    labels: filteredRecords.map(r => `${r.age_months}`),
    datasets: [
      {
        label: 'Perímetro Cefálico',
        data: filteredRecords.map(r => r.head_circumference || 0),
        borderColor: '#EC4899',
        backgroundColor: '#EC4899',
        borderWidth: 2,
        pointRadius: 4,
      },
      {
        label: 'P97',
        data: filteredRecords.map(() => 97),
        borderColor: '#D1D5DB',
        backgroundColor: '#D1D5DB',
        borderWidth: 1,
        pointRadius: 0,
      },
      {
        label: 'P85',
        data: filteredRecords.map(() => 85),
        borderColor: '#E5E7EB',
        backgroundColor: '#E5E7EB',
        borderWidth: 1,
        pointRadius: 0,
      },
      {
        label: 'P50',
        data: filteredRecords.map(() => 50),
        borderColor: '#9CA3AF',
        backgroundColor: '#9CA3AF',
        borderWidth: 1,
        pointRadius: 0,
      },
      {
        label: 'P15',
        data: filteredRecords.map(() => 15),
        borderColor: '#E5E7EB',
        backgroundColor: '#E5E7EB',
        borderWidth: 1,
        pointRadius: 0,
      },
      {
        label: 'P3',
        data: filteredRecords.map(() => 3),
        borderColor: '#D1D5DB',
        backgroundColor: '#D1D5DB',
        borderWidth: 1,
        pointRadius: 0,
      },
    ],
  };

  return (
    <GrowthChart
      title="Perímetro Cefálico para la Edad"
      data={data}
      yAxisLabel="Perímetro Cefálico (cm)"
      xAxisLabel="Edad (meses)"
    />
  );
}