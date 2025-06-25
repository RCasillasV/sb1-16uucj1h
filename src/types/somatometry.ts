export interface SomatometryRecord {
  id: string;
  measurement_date: string;
  weight: number;
  height: number;
  head_circumference: number | null;
  bmi: number | null;
  age_months: number;
  notes: string | null;
}