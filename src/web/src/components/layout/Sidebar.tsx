import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styled from 'styled-components'; // v5.3.10

// Hooks
import { useAuth } from '../../hooks/useAuth';
import useResponsive from '../../hooks/useResponsive';

// Constants
import { ROUTES } from '../../utils/constants/routes';
import { Permission } from '../../utils/constants/permissions';
import { UserRole } from '../../utils/constants/roles';

// Styles
import { colors } from '../../styles/colors';
import { mediaQueries } from '../../styles/breakpoints';

/**
 * Interface for sidebar navigation item definition
 */
interface NavItemDef {
  to: string;
  label: string;
  icon: string; // Simple icon placeholder - would be replaced with actual icon components
  permission?: Permission;
  role?: UserRole;
}

/**
 * Sidebar component props
 */
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Sidebar navigation component that displays main application routes
 * Filters navigation items based on user permissions and adapts to screen size
 */
const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isMobileView, isTabletView } = useResponsive();
  const { hasPermission, hasRole } = useAuth();

  // Define navigation items with routes, labels, icons, and required permissions
  const navItems: NavItemDef[] = [
    {
      to: ROUTES.DASHBOARD.ROOT,
      label: 'Dashboard',
      icon: '📊', // Placeholder for dashboard icon
      permission: Permission.VIEW_DASHBOARD
    },
    {
      to: ROUTES.MEETINGS.ROOT,
      label: 'Meetings',
      icon: '🗓️', // Placeholder for meetings icon
      permission: Permission.VIEW_MEETING
    },
    {
      to: ROUTES.STRATEGY.ROOT,
      label: 'Strategy',
      icon: '🎯', // Placeholder for strategy icon
      permission: Permission.VIEW_GOAL
    },
    {
      to: ROUTES.METRICS.ROOT,
      label: 'Metrics',
      icon: '📈', // Placeholder for metrics icon
      permission: Permission.VIEW_METRIC
    },
    {
      to: ROUTES.KFFM.ROOT,
      label: 'KFFM',
      icon: '🔄', // Placeholder for KFFM icon
      permission: Permission.VIEW_KFFM
    },
    {
      to: ROUTES.USERS.ROOT,
      label: 'Users',
      icon: '👥', // Placeholder for users icon
      permission: Permission.VIEW_USERS,
      role: UserRole.LEADERSHIP
    },
    {
      to: ROUTES.ORGANIZATION.ROOT,
      label: 'Organization',
      icon: '🏢', // Placeholder for organization icon
      permission: Permission.VIEW_ORGANIZATION,
      role: UserRole.CEO
    }
  ];

  // Filter navigation items based on permissions
  const filteredNavItems = navItems.filter(item => {
    // Check if user has required permission
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    // Check if user has required role
    if (item.role && !hasRole(item.role)) {
      return false;
    }
    return true;
  });

  // Close sidebar on navigation click for mobile/tablet views
  const handleNavClick = useCallback(() => {
    if (isMobileView || isTabletView) {
      onClose();
    }
  }, [isMobileView, isTabletView, onClose]);

  return (
    <SidebarContainer isOpen={isOpen}>
      <NavList>
        {filteredNavItems.map((item) => (
          <NavItem key={item.to}>
            <NavLinkStyled 
              to={item.to} 
              onClick={handleNavClick}
              end={item.to === ROUTES.DASHBOARD.ROOT}
            >
              <NavIcon>{item.icon}</NavIcon>
              <NavLabel>{item.label}</NavLabel>
            </NavLinkStyled>
          </NavItem>
        ))}
      </NavList>
    </SidebarContainer>
  );
};

// Styled components
const SidebarContainer = styled.aside<{ isOpen: boolean }>`
  position: fixed;
  top: 60px; /* Assumes header height is 60px */
  left: 0;
  height: calc(100vh - 60px);
  width: 240px;
  background-color: ${colors.white};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
  overflow-y: auto;
  z-index: 1000;
  
  ${mediaQueries.mobile} {
    width: 280px;
    transform: translateX(${({ isOpen }) => isOpen ? '0' : '-100%'});
  }
  
  ${mediaQueries.tablet} {
    transform: translateX(${({ isOpen }) => isOpen ? '0' : '-100%'});
  }
`;

const NavList = styled.nav`
  display: flex;
  flex-direction: column;
  padding: 16px 0;
  list-style: none;
`;

const NavItem = styled.li`
  margin: 4px 0;
  padding: 0 16px;
`;

const NavLinkStyled = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 4px;
  text-decoration: none;
  color: ${colors.neutral[800]};
  transition: background-color 0.2s, color 0.2s;
  font-weight: 500;
  
  &:hover {
    background-color: ${colors.neutral[100]};
  }
  
  &.active {
    background-color: ${colors.primary[50]};
    color: ${colors.primary[600]};
    border-left: 3px solid ${colors.primary[500]};
  }
`;

const NavIcon = styled.span`
  display: flex;
  align-items: center;
  margin-right: 12px;
  width: 20px;
  height: 20px;
`;

const NavLabel = styled.span`
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export default Sidebar;