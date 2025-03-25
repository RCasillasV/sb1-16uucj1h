export type ThemeType = 'light' | 'dark' | 'professional' | 'modern' | 'minimal' | 'ocean' | 'forest' | 'sunset' | 'forest-night' | 'ocean-breeze' | 'sunset-orange' | 'forest-green';

export interface Theme {
  id: ThemeType;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    sidebar: string;
    sidebarText: string;
    sidebarHover: string;
    header: string;
    headerText: string;
    buttonPrimary: string;
    buttonSecondary: string;
    buttonText: string;
  };
  typography: {
    fontFamily: string;
    scale: number;
    baseSize: string;
  };
  buttons: {
    style: 'rounded' | 'square' | 'pill';
    shadow: boolean;
    animation: boolean;
  };
}

export const themes: Record<ThemeType, Theme> = {
  light: {
    id: 'light',
    name: 'Claro',
    colors: {
      primary: '#3B82F6',
      secondary: '#60A5FA',
      background: '#F3F4F6',
      surface: '#FFFFFF',
      text: '#111827',
      textSecondary: '#4B5563',
      border: '#E5E7EB',
      sidebar: '#1F2937',
      sidebarText: '#F3F4F6',
      sidebarHover: '#374151',
      header: '#FFFFFF',
      headerText: '#111827',
      buttonPrimary: '#3B82F6',
      buttonSecondary: '#9CA3AF',
      buttonText: '#FFFFFF',
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      scale: 1,
      baseSize: '16px',
    },
    buttons: {
      style: 'rounded',
      shadow: true,
      animation: true,
    },
  },
  dark: {
    id: 'dark',
    name: 'Oscuro',
    colors: {
      primary: '#60A5FA',
      secondary: '#93C5FD',
      background: '#111827',
      surface: '#1F2937',
      text: '#F9FAFB',
      textSecondary: '#D1D5DB',
      border: '#374151',
      sidebar: '#0F172A',
      sidebarText: '#F3F4F6',
      sidebarHover: '#1E293B',
      header: '#1F2937',
      headerText: '#F9FAFB',
      buttonPrimary: '#60A5FA',
      buttonSecondary: '#4B5563',
      buttonText: '#FFFFFF',
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      scale: 1,
      baseSize: '16px',
    },
    buttons: {
      style: 'rounded',
      shadow: true,
      animation: true,
    },
  },
  professional: {
    id: 'professional',
    name: 'Profesional',
    colors: {
      primary: '#0D9488',
      secondary: '#14B8A6',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      text: '#0F172A',
      textSecondary: '#334155',
      border: '#E2E8F0',
      sidebar: '#0F172A',
      sidebarText: '#F8FAFC',
      sidebarHover: '#1E293B',
      header: '#FFFFFF',
      headerText: '#0F172A',
      buttonPrimary: '#0D9488',
      buttonSecondary: '#64748B',
      buttonText: '#FFFFFF',
    },
    typography: {
      fontFamily: 'system-ui, sans-serif',
      scale: 1,
      baseSize: '16px',
    },
    buttons: {
      style: 'square',
      shadow: false,
      animation: false,
    },
  },
  modern: {
    id: 'modern',
    name: 'Moderno',
    colors: {
      primary: '#8B5CF6',
      secondary: '#A78BFA',
      background: '#F3F4F6',
      surface: '#FFFFFF',
      text: '#1F2937',
      textSecondary: '#4B5563',
      border: '#E5E7EB',
      sidebar: '#2D1B69',
      sidebarText: '#F3F4F6',
      sidebarHover: '#4C1D95',
      header: '#FFFFFF',
      headerText: '#1F2937',
      buttonPrimary: '#8B5CF6',
      buttonSecondary: '#9CA3AF',
      buttonText: '#FFFFFF',
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      scale: 1.1,
      baseSize: '16px',
    },
    buttons: {
      style: 'pill',
      shadow: true,
      animation: true,
    },
  },
  minimal: {
    id: 'minimal',
    name: 'Minimalista',
    colors: {
      primary: '#6B7280',
      secondary: '#9CA3AF',
      background: '#FFFFFF',
      surface: '#FFFFFF',
      text: '#111827',
      textSecondary: '#4B5563',
      border: '#E5E7EB',
      sidebar: '#F9FAFB',
      sidebarText: '#111827',
      sidebarHover: '#F3F4F6',
      header: '#FFFFFF',
      headerText: '#111827',
      buttonPrimary: '#6B7280',
      buttonSecondary: '#9CA3AF',
      buttonText: '#FFFFFF',
    },
    typography: {
      fontFamily: '"Inter", system-ui, sans-serif',
      scale: 0.95,
      baseSize: '16px',
    },
    buttons: {
      style: 'square',
      shadow: false,
      animation: false,
    },
  },
  ocean: {
    id: 'ocean',
    name: 'Oceánico',
    colors: {
      primary: '#0EA5E9',
      secondary: '#38BDF8',
      background: '#F0F9FF',
      surface: '#FFFFFF',
      text: '#0C4A6E',
      textSecondary: '#0369A1',
      border: '#BAE6FD',
      sidebar: '#075985',
      sidebarText: '#F0F9FF',
      sidebarHover: '#0369A1',
      header: '#FFFFFF',
      headerText: '#0C4A6E',
      buttonPrimary: '#0EA5E9',
      buttonSecondary: '#38BDF8',
      buttonText: '#FFFFFF',
    },
    typography: {
      fontFamily: '"Nunito", system-ui, sans-serif',
      scale: 1,
      baseSize: '16px',
    },
    buttons: {
      style: 'rounded',
      shadow: true,
      animation: true,
    },
  },
  forest: {
    id: 'forest',
    name: 'Forestal',
    colors: {
      primary: '#059669',
      secondary: '#34D399',
      background: '#ECFDF5',
      surface: '#FFFFFF',
      text: '#064E3B',
      textSecondary: '#065F46',
      border: '#A7F3D0',
      sidebar: '#065F46',
      sidebarText: '#ECFDF5',
      sidebarHover: '#047857',
      header: '#FFFFFF',
      headerText: '#064E3B',
      buttonPrimary: '#059669',
      buttonSecondary: '#34D399',
      buttonText: '#FFFFFF',
    },
    typography: {
      fontFamily: '"Quicksand", system-ui, sans-serif',
      scale: 1,
      baseSize: '16px',
    },
    buttons: {
      style: 'pill',
      shadow: true,
      animation: true,
    },
  },
  sunset: {
    id: 'sunset',
    name: 'Atardecer',
    colors: {
      primary: '#F97316',
      secondary: '#FB923C',
      background: '#FFF7ED',
      surface: '#FFFFFF',
      text: '#7C2D12',
      textSecondary: '#9A3412',
      border: '#FFEDD5',
      sidebar: '#9A3412',
      sidebarText: '#FFF7ED',
      sidebarHover: '#C2410C',
      header: '#FFFFFF',
      headerText: '#7C2D12',
      buttonPrimary: '#F97316',
      buttonSecondary: '#FB923C',
      buttonText: '#FFFFFF',
    },
    typography: {
      fontFamily: '"Poppins", system-ui, sans-serif',
      scale: 1.05,
      baseSize: '16px',
    },
    buttons: {
      style: 'rounded',
      shadow: true,
      animation: true,
    },
  },
  'forest-night': {
    id: 'forest-night',
    name: 'Forest Night',
    colors: {
      primary: '#2D3B2D',
      secondary: '#4A5D4A',
      background: '#1A231A',
      surface: '#2D3B2D',
      text: '#E5E7E5',
      textSecondary: '#B8C0B8',
      border: '#4A5D4A',
      sidebar: '#141914',
      sidebarText: '#E5E7E5',
      sidebarHover: '#2D3B2D',
      header: '#2D3B2D',
      headerText: '#E5E7E5',
      buttonPrimary: '#4A5D4A',
      buttonSecondary: '#2D3B2D',
      buttonText: '#E5E7E5',
    },
    typography: {
      fontFamily: '"Roboto Slab", serif',
      scale: 1,
      baseSize: '16px',
    },
    buttons: {
      style: 'rounded',
      shadow: true,
      animation: true,
    },
  },
  'ocean-breeze': {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    colors: {
      primary: '#0EA5E9',
      secondary: '#38BDF8',
      background: '#F0FDFF',
      surface: '#FFFFFF',
      text: '#0C4A6E',
      textSecondary: '#0369A1',
      border: '#BAE6FD',
      sidebar: '#0EA5E9',
      sidebarText: '#FFFFFF',
      sidebarHover: '#38BDF8',
      header: '#FFFFFF',
      headerText: '#0C4A6E',
      buttonPrimary: '#0EA5E9',
      buttonSecondary: '#38BDF8',
      buttonText: '#FFFFFF',
    },
    typography: {
      fontFamily: '"Work Sans", sans-serif',
      scale: 1,
      baseSize: '16px',
    },
    buttons: {
      style: 'pill',
      shadow: true,
      animation: true,
    },
  },
  'sunset-orange': {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    colors: {
      primary: '#EA580C',
      secondary: '#F97316',
      background: '#FFF7ED',
      surface: '#FFFFFF',
      text: '#7C2D12',
      textSecondary: '#9A3412',
      border: '#FFEDD5',
      sidebar: '#C2410C',
      sidebarText: '#FFF7ED',
      sidebarHover: '#EA580C',
      header: '#FFFFFF',
      headerText: '#7C2D12',
      buttonPrimary: '#EA580C',
      buttonSecondary: '#F97316',
      buttonText: '#FFFFFF',
    },
    typography: {
      fontFamily: '"DM Sans", sans-serif',
      scale: 1,
      baseSize: '16px',
    },
    buttons: {
      style: 'pill',
      shadow: true,
      animation: true,
    },
  },
  'forest-green': {
    id: 'forest-green',
    name: 'Forest Green',
    colors: {
      primary: '#166534',
      secondary: '#15803D',
      background: '#F0FDF4',
      surface: '#FFFFFF',
      text: '#14532D',
      textSecondary: '#15803D',
      border: '#DCFCE7',
      sidebar: '#166534',
      sidebarText: '#F0FDF4',
      sidebarHover: '#15803D',
      header: '#FFFFFF',
      headerText: '#14532D',
      buttonPrimary: '#166534',
      buttonSecondary: '#15803D',
      buttonText: '#FFFFFF',
    },
    typography: {
      fontFamily: '"Montserrat", sans-serif',
      scale: 1,
      baseSize: '16px',
    },
    buttons: {
      style: 'rounded',
      shadow: true,
      animation: true,
    },
  },
};