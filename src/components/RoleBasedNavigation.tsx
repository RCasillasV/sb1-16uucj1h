import React from 'react';

// Define the navigation item type
export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
  onClick?: () => void;
  count?: number;
}

interface RoleBasedNavigationProps {
  navigationItems: NavigationItem[];
  userRole: string | null | undefined;
}

export function RoleBasedNavigation({ 
  navigationItems, 
  userRole 
}: RoleBasedNavigationProps) {
  // Filter navigation items based on user role
  const filteredItems = navigationItems.filter(item => {
    // If the item has no roles specified, show it to everyone
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    
    // If user has no role or the item requires a role, hide it
    if (!userRole) {
     return false;
    }
    
    // Show the item if the user's role is included in the item's roles
    return item.roles.includes(userRole);
  });

  return filteredItems;
}