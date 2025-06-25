export type ThemeType = 'light' | 'dark' | 'professional' | 'modern' | 'minimal' | 'ocean' | 'forest' | 'sunset' | 'forest-night' | 'ocean-breeze' | 'sunset-orange' | 'forest-green' | 'terra-cotta' | 'sage-clay' | 'desert-sand' | 'walnut-bark';

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
    fonts: {
      headings: 'Plus Jakarta Sans';
      subheadings: 'Montserrat';
      body: 'Inter';
      ui: 'DM Sans';
    };
    baseSize: 16;
  };
  buttons: {
    style: 'rounded' | 'square' | 'pill';
    shadow: boolean;
    animation: boolean;
    states: {
      hover: {
        opacity: number;
        scale: number;
      };
      active: {
        scale: number;
      };
      disabled: {
        opacity: number;
      };
    };
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
      fonts: {
        headings: 'Plus Jakarta Sans',
        subheadings: 'Montserrat',
        body: 'Inter',
        ui: 'DM Sans',
      },
      baseSize: 16,
    },
    buttons: {
      style: 'rounded',
      shadow: true,
      animation: true, 
      states: {
        hover: {
          opacity: 0.9,
          scale: 1.02
        },
        active: {
          scale: 0.98
        },
        disabled: {
          opacity: 0.5
        }
      }
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
      fonts: {
        headings: 'Plus Jakarta Sans',
        subheadings: 'Montserrat',
        body: 'Inter',
        ui: 'DM Sans',
      },
      baseSize: 16,
    },
    buttons: {
      style: 'rounded',
      shadow: true,
      animation: true,
      states: {
        hover: {
          opacity: 0.9,
          scale: 1.02
        },
        active: {
          scale: 0.98
        },
        disabled: {
          opacity: 0.5
        }
      }
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
      fonts: {
        headings: 'Plus Jakarta Sans',
        subheadings: 'Montserrat',
        body: 'Inter',
        ui: 'DM Sans',
      },
      baseSize: 16,
    },
    buttons: {
      style: 'square',
      shadow: false,
      animation: false,
      states: {
        hover: {
          opacity: 0.9,
          scale: 1.02
        },
        active: {
          scale: 0.98
        },
        disabled: {
          opacity: 0.5
        }
      }
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
      fonts: {
        headings: 'Plus Jakarta Sans',
        subheadings: 'Montserrat',
        body: 'Inter',
        ui: 'DM Sans',
      },
      baseSize: 16,
    },
    buttons: {
      style: 'pill',
      shadow: true,
      animation: true,
      states: {
        hover: {
          opacity: 0.9,
          scale: 1.02
        },
        active: {
          scale: 0.98
        },
        disabled: {
          opacity: 0.5
        }
      }
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
      fonts: {
        headings: 'Plus Jakarta Sans',
        subheadings: 'Montserrat',
        body: 'Inter',
        ui: 'DM Sans',
      },
      baseSize: 16,
    },
    buttons: {
      style: 'square',
      shadow: false,
      animation: false,
      states: {
        hover: {
          opacity: 0.9,
          scale: 1.02
        },
        active: {
          scale: 0.98
        },
        disabled: {
          opacity: 0.5
        }
      }
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
      fonts: {
        headings: 'Plus Jakarta Sans',
        subheadings: 'Montserrat',
        body: 'Inter',
        ui: 'DM Sans',
      },
      baseSize: 16,
    },
    buttons: {
      style: 'rounded',
      shadow: true,
      animation: true,
      states: {
        hover: {
          opacity: 0.9,
          scale: 1.02
        },
        active: {
          scale: 0.98
        },
        disabled: {
          opacity: 0.5
        }
      }
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
      fonts: {
        headings: 'Plus Jakarta Sans',
        subheadings: 'Montserrat',
        body: 'Inter',
        ui: 'DM Sans',
      },
      baseSize: 16,
    },
    buttons: {
      style: 'pill',
      shadow: true,
      animation: true,
      states: {
        hover: {
          opacity: 0.9,
          scale: 1.02
        },
        active: {
          scale: 0.98
        },
        disabled: {
          opacity: 0.5
        }
      }
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
      fonts: {
        headings: 'Plus Jakarta Sans',
        subheadings: 'Montserrat',
        body: 'Inter',
        ui: 'DM Sans',
      },
      baseSize: 16,
    },
    buttons: {
      style: 'rounded',
      shadow: true,
      animation: true,
      states: {
        hover: {
          opacity: 0.9,
          scale: 1.02
        },
        active: {
          scale: 0.98
        },
        disabled: {
          opacity: 0.5
        }
      }
    },
  },
  'forest-night': {
    id: 'forest-night',
    name: 'Forest Night',
    colors: {
      primary: '#4CAF50',
      secondary: '#81C784',
      background: '#1A231A',
      surface: '#243024',
      text: '#FFFFFF',
      textSecondary: '#C8E6C9',
      border: '#2E3B2E',
      sidebar: '#141914',
      sidebarText: '#FFFFFF',
      sidebarHover: '#2E3B2E',
      header: '#243024',
      headerText: '#FFFFFF',
      buttonPrimary: '#4CAF50',
      buttonSecondary: '#81C784',
      buttonText: '#FFFFFF',
    },
    typography: {
      fonts: {
        headings: 'Plus Jakarta Sans',
        subheadings: 'Montserrat',
        body: 'Inter',
        ui: 'DM Sans',
      },
      baseSize: 16,
    },
    buttons: {
      style: 'rounded',
      shadow: true,
      animation: true,
      states: {
        hover: {
          opacity: 0.9,
          scale: 1.02
        },
        active: {
          scale: 0.98
        },
        disabled: {
          opacity: 0.5
        }
      }
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
      fonts: {
        headings: 'Plus Jakarta Sans',
        subheadings: 'Montserrat',
        body: 'Inter',
        ui: 'DM Sans',
      },
      baseSize: 16,
    },
    buttons: {
      style: 'pill',
      shadow: true,
      animation: true,
      states: {
        hover: {
          opacity: 0.9,
          scale: 1.02
        },
        active: {
          scale: 0.98
        },
        disabled: {
          opacity: 0.5
        }
      }
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
      fonts: {
        headings: 'Plus Jakarta Sans',
        subheadings: 'Montserrat',
        body: 'Inter',
        ui: 'DM Sans',
      },
      baseSize: 16,
    },
    buttons: {
      style: 'pill',
      shadow: true,
      animation: true,
      states: {
        hover: {
          opacity: 0.9,
          scale: 1.02
        },
        active: {
          scale: 0.98
        },
        disabled: {
          opacity: 0.5
        }
      }
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
      fonts: {
        headings: 'Plus Jakarta Sans',
        subheadings: 'Montserrat',
        body: 'Inter',
        ui: 'DM Sans',
      },
      baseSize: 16,
    },
    buttons: {
      style: 'rounded',
      shadow: true,
      animation: true,
      states: {
        hover: {
          opacity: 0.9,
          scale: 1.02
        },
        active: {
          scale: 0.98
        },
        disabled: {
          opacity: 0.5
        }
      }
    },
  },
  'terra-cotta': {
    id: 'terra-cotta',
    name: 'Terra Cotta',
    colors: {
      primary: '#C65D4B',      // Rich terra cotta
      secondary: '#E6A792',    // Soft clay pink
      background: '#FDF6F4',   // Warm white
      surface: '#FFFFFF',
      text: '#4A3B38',        // Deep warm brown
      textSecondary: '#8C7B76', // Muted terra cotta
      border: '#F4D9D0',      // Light terra cotta
      sidebar: '#8C5E54',     // Dark terra cotta
      sidebarText: '#FDF6F4',
      sidebarHover: '#A66B60',
      header: '#FFFFFF',
      headerText: '#4A3B38',
      buttonPrimary: '#C65D4B',
      buttonSecondary: '#E6A792',
      buttonText: '#FFFFFF',
    },
    typography: {
      fonts: {
        headings: 'Plus Jakarta Sans',
        subheadings: 'Montserrat',
        body: 'Inter',
        ui: 'DM Sans',
      },
      baseSize: 16,
    },
    buttons: {
      style: 'rounded',
      shadow: true,
      animation: true,
      states: {
        hover: {
          opacity: 0.9,
          scale: 1.02
        },
        active: {
          scale: 0.98
        },
        disabled: {
          opacity: 0.5
        }
      }
    },
  },
  'sage-clay': {
    id: 'sage-clay',
    name: 'Sage & Clay',
    colors: {
      primary: '#8A9A7B',      // Sage green
      secondary: '#BFA89E',    // Clay brown
      background: '#F8F9F6',   // Light sage
      surface: '#FFFFFF',
      text: '#3C4A3E',        // Deep sage
      textSecondary: '#7C8475', // Muted sage
      border: '#E2E5DF',      // Light sage
      sidebar: '#6B7F5C',     // Dark sage
      sidebarText: '#F8F9F6',
      sidebarHover: '#7E9470',
      header: '#FFFFFF',
      headerText: '#3C4A3E',
      buttonPrimary: '#8A9A7B',
      buttonSecondary: '#BFA89E',
      buttonText: '#FFFFFF',
    },
    typography: {
      fonts: {
        headings: 'Plus Jakarta Sans',
        subheadings: 'Montserrat',
        body: 'Inter',
        ui: 'DM Sans',
      },
      baseSize: 16,
    },
    buttons: {
      style: 'pill',
      shadow: true,
      animation: true,
      states: {
        hover: {
          opacity: 0.9,
          scale: 1.02
        },
        active: {
          scale: 0.98
        },
        disabled: {
          opacity: 0.5
        }
      }
    },
  },
  'desert-sand': {
    id: 'desert-sand',
    name: 'Desert Sand',
    colors: {
      primary: '#D4A373',      // Warm sand
      secondary: '#E9D5C3',    // Light sand
      background: '#FDFAF6',   // Cream white
      surface: '#FFFFFF',
      text: '#4B3D2A',        // Deep sand
      textSecondary: '#8C7B64', // Muted sand
      border: '#F4E9DD',      // Light sand
      sidebar: '#B08A5C',     // Dark sand
      sidebarText: '#FDFAF6',
      sidebarHover: '#C49B6B',
      header: '#FFFFFF',
      headerText: '#4B3D2A',
      buttonPrimary: '#D4A373',
      buttonSecondary: '#E9D5C3',
      buttonText: '#FFFFFF',
    },
    typography: {
      fonts: {
        headings: 'Plus Jakarta Sans',
        subheadings: 'Montserrat',
        body: 'Inter',
        ui: 'DM Sans',
      },
      baseSize: 16,
    },
    buttons: {
      style: 'rounded',
      shadow: true,
      animation: true,
      states: {
        hover: {
          opacity: 0.9,
          scale: 1.02
        },
        active: {
          scale: 0.98
        },
        disabled: {
          opacity: 0.5
        }
      }
    },
  },
  'walnut-bark': {
    id: 'walnut-bark',
    name: 'Walnut Bark',
    colors: {
      primary: '#8B6E4F',      // Walnut brown
      secondary: '#B39B82',    // Light walnut
      background: '#FAF7F4',   // Cream white
      surface: '#FFFFFF',
      text: '#3D2E1C',        // Deep walnut
      textSecondary: '#7D6B56', // Muted walnut
      border: '#E9DFD4',      // Light walnut
      sidebar: '#6B4E2F',     // Dark walnut
      sidebarText: '#FAF7F4',
      sidebarHover: '#8B6E4F',
      header: '#FFFFFF',
      headerText: '#3D2E1C',
      buttonPrimary: '#8B6E4F',
      buttonSecondary: '#B39B82',
      buttonText: '#FFFFFF',
    },
    typography: {
      fonts: {
        headings: 'Plus Jakarta Sans',
        subheadings: 'Montserrat',
        body: 'Inter',
        ui: 'DM Sans',
      },
      baseSize: 16,
    },
    buttons: {
      style: 'square',
      shadow: true,
      animation: true,
      states: {
        hover: {
          opacity: 0.9,
          scale: 1.02
        },
        active: {
          scale: 0.98
        },
        disabled: {
          opacity: 0.5
        }
      }
    },
  },
};