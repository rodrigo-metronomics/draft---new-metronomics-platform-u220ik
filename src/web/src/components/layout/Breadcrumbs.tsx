import React, { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom'; // ^6.10.0
import styled from 'styled-components'; // ^5.3.10
import { ROUTES } from '../../utils/constants/routes';
import useResponsive from '../../hooks/useResponsive';
import { colors } from '../../styles/colors';

/**
 * Interface for breadcrumb item objects
 */
interface BreadcrumbItem {
  path: string;
  label: string;
}

/**
 * Interface for mapping route segments to human-readable labels
 */
interface RouteNameMap {
  [key: string]: string;
}

// Styled components for breadcrumb navigation
const BreadcrumbsContainer = styled.nav`
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.875rem;
  color: ${colors.neutral[500]};
  
  @media (max-width: 575px) {
    font-size: 0.75rem;
    padding: 0.25rem 0;
  }
`;

const BreadcrumbList = styled.ol`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
`;

const BreadcrumbItem = styled.li<{ isLast: boolean }>`
  display: flex;
  align-items: center;
  font-weight: ${props => props.isLast ? '600' : '400'};
  color: ${props => props.isLast ? colors.neutral[900] : colors.neutral[500]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: ${props => props.isLast ? '100%' : '150px'};
  
  @media (max-width: 575px) {
    max-width: ${props => props.isLast ? '100%' : '100px'};
  }
`;

const BreadcrumbLink = styled(Link)`
  color: inherit;
  text-decoration: none;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${colors.primary[500]};
  }
  
  &:focus {
    outline: none;
    text-decoration: underline;
  }
`;

const BreadcrumbSeparator = styled.span`
  margin: 0 0.5rem;
  color: ${colors.neutral[400]};
`;

const CurrentBreadcrumb = styled.span`
  color: ${colors.neutral[900]};
  font-weight: 600;
`;

/**
 * Helper function to generate breadcrumb items from the current path
 * 
 * @param pathname - The current URL path
 * @returns Array of breadcrumb items with path and label
 */
const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  // Define route name mapping for human-readable breadcrumb labels
  const routeNameMap: RouteNameMap = {
    '': 'Home',
    'dashboard': 'Dashboard',
    'meetings': 'Meetings',
    'strategy': 'Strategy',
    'metrics': 'Metrics',
    'kffm': 'KFFM',
    'users': 'Users',
    'organization': 'Organization',
    'new': 'New',
    'edit': 'Edit',
    'moderate': 'Moderate',
    'profile': 'Profile',
    'settings': 'Settings',
    'teams': 'Teams',
    'roadmap': 'Roadmap',
    'one-page-plan': 'One-Page Plan',
    'goals': 'Goals',
    'shared': 'Shared Dashboard',
  };

  // Split the pathname into segments
  const segments = pathname.split('/').filter(segment => segment !== '');
  
  // Initialize breadcrumbs array with home item
  const breadcrumbs: BreadcrumbItem[] = [
    { path: ROUTES.ROOT, label: 'Home' }
  ];
  
  // Build up breadcrumb paths incrementally
  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Check if segment is a dynamic parameter (like an ID)
    // We detect UUIDs or numeric IDs as a simple heuristic
    const isDynamicParam = segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || 
                          /^\d+$/.test(segment);
    
    let label = '';
    
    if (isDynamicParam) {
      // For dynamic parameters, use the parameter type as label based on the previous segment
      const prevSegment = segments[index - 1] || '';
      
      if (prevSegment === 'meetings') {
        label = 'Meeting';
      } else if (prevSegment === 'goals') {
        label = 'Goal';
      } else if (prevSegment === 'metrics') {
        label = 'Metric';
      } else if (prevSegment === 'users') {
        label = 'User';
      } else if (prevSegment === 'teams') {
        label = 'Team';
      } else if (prevSegment === 'kffm') {
        label = 'KFFM';
      } else if (prevSegment === 'shared') {
        label = 'Shared View';
      } else {
        label = 'ID: ' + segment.substring(0, 6) + '...';
      }
    } else {
      // Otherwise, use the route name mapping or capitalize the segment
      label = routeNameMap[segment] || segment.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    
    breadcrumbs.push({
      path: currentPath,
      label,
    });
  });
  
  return breadcrumbs;
};

/**
 * Component that displays the current navigation path as clickable breadcrumbs
 * 
 * Features:
 * - Responsive design that adapts to different screen sizes
 * - Proper accessibility attributes for screen readers
 * - Handles dynamic route parameters intelligently
 * - Makes breadcrumbs clickable links for easy navigation
 * 
 * @returns Rendered breadcrumbs navigation component
 */
const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const { isMobileView } = useResponsive();
  
  // Generate breadcrumbs based on current path
  const breadcrumbs = useMemo(() => {
    return generateBreadcrumbs(location.pathname);
  }, [location.pathname]);
  
  // Don't render breadcrumbs if we're at the root path
  if (breadcrumbs.length <= 1) {
    return null;
  }
  
  return (
    <BreadcrumbsContainer aria-label="Breadcrumb">
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          // On mobile, only show the last 2 breadcrumbs for space efficiency
          if (isMobileView && index < breadcrumbs.length - 2) {
            return null;
          }
          
          return (
            <BreadcrumbItem key={breadcrumb.path} isLast={isLast}>
              {index > 0 && <BreadcrumbSeparator aria-hidden="true">/</BreadcrumbSeparator>}
              
              {isLast ? (
                <CurrentBreadcrumb aria-current="page">
                  {breadcrumb.label}
                </CurrentBreadcrumb>
              ) : (
                <BreadcrumbLink to={breadcrumb.path}>
                  {breadcrumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </BreadcrumbsContainer>
  );
};

export default Breadcrumbs;