import React, { useState, useCallback, useEffect, useRef } from 'react'; // React v^18.2.0
import styled, { css, ThemeProvider } from 'styled-components'; // version ^5.3.10
import { Link, useNavigate } from 'react-router-dom'; // version ^6.10.0
import { BellIcon, MenuIcon } from 'primereact/icons'; // version ^10.0.0

import { useAuthContext } from '../../contexts/AuthContext';
import { useOrganizationContext } from '../../contexts/OrganizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import NotificationCenter from '../notifications/NotificationCenter';
import IconButton from '../common/IconButton';
import Dropdown from '../common/Dropdown';
import { ROUTES } from '../../utils/constants/routes';
import { colors } from '../../styles/colors';
import { mediaQueries } from '../../styles/breakpoints';

// Define styled components for the header
const HeaderContainer = styled.header<{ theme: any }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  padding: 0 24px;
  background-color: ${(props) => props.theme.colors.background.primary};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  transition: background-color 0.3s ease;

  ${mediaQueries.mobile} {
    height: 56px;
    padding: 0 16px;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  margin-right: 16px;
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  height: 100%;
  text-decoration: none;
`;

const LogoImage = styled.img`
  height: 32px;
  width: auto;
  object-fit: contain;
`;

const OrgSelectorContainer = styled.div`
  display: flex;
  align-items: center;
  margin-right: auto;

  ${mediaQueries.mobile} {
    display: none;
  }
`;

const OrgSelectorTrigger = styled.div<{ theme: any }>`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${(props) => colors.neutral[100]};
  }
`;

const OrgName = styled.span<{ theme: any }>`
  font-weight: 500;
  margin-right: 8px;
  color: ${(props) => props.theme.colors.text.primary};
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UserMenuContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const UserMenuTrigger = styled.div<{ theme: any }>`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${(props) => colors.neutral[100]};
  }
`;

const UserAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
`;

const UserName = styled.span<{ theme: any }>`
  margin-left: 8px;
  font-weight: 500;
  color: ${(props) => props.theme.colors.text.primary};

  ${mediaQueries.mobile} {
    display: none;
  }
`;

const DropdownMenu = styled.div<{ theme: any }>`
  position: absolute;
  top: 100%;
  right: 0;
  width: 200px;
  background-color: ${(props) => props.theme.colors.background.primary};
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 8px;
  z-index: 1000;
`;

const DropdownItem = styled.div<{ theme: any }>`
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  color: ${(props) => props.theme.colors.text.primary};

  &:hover {
    background-color: ${colors.neutral[100]};
  }

  display: flex;
  align-items: center;
`;

const DropdownItemIcon = styled.span`
  margin-right: 8px;
  display: flex;
  align-items: center;
`;

const MobileMenuButton = styled.div`
  display: none;

  ${mediaQueries.mobile} {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
  }
`;

/**
 * Main header component that displays the top navigation bar
 * @param onMenuToggle 
 * @returns Rendered header component
 */
const Header: React.FC<{ onMenuToggle: () => void }> = ({ onMenuToggle }) => {
  // Get authentication state and logout function from useAuthContext
  const { state: authState, logout } = useAuthContext();

  // Get organization data and switchOrganization function from useOrganizationContext
  const { currentOrganization, organizations, switchOrganization } = useOrganizationContext();

  // Get theme mode and toggleTheme function from useTheme
  const { themeMode, toggleTheme } = useTheme();

  // Get isMobile flag from useResponsive hook
  const { isMobileView } = useResponsive();

  // Get navigate function from useNavigate hook
  const navigate = useNavigate();

  // Initialize state for user menu dropdown visibility
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Initialize state for organization selector dropdown visibility
  const [isOrgSelectorOpen, setIsOrgSelectorOpen] = useState(false);

  // Create toggleUserMenu function to show/hide user menu dropdown
  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen((prev) => !prev);
  }, []);

  // Create toggleOrgSelector function to show/hide organization selector dropdown
  const toggleOrgSelector = useCallback(() => {
    setIsOrgSelectorOpen((prev) => !prev);
  }, []);

  // Create handleLogout function to log out the user and navigate to login page
  const handleLogout = useCallback(() => {
    logout().then(() => {
      navigate(ROUTES.AUTH.LOGIN);
    });
  }, [logout, navigate]);

  // Create handleSwitchOrganization function to switch the current organization
  const handleSwitchOrganization = useCallback(
    (orgId: string) => {
      switchOrganization(orgId);
      setIsOrgSelectorOpen(false);
    },
    [switchOrganization]
  );

  // Create handleProfileClick function to navigate to user profile page
  const handleProfileClick = useCallback(() => {
    navigate(ROUTES.USERS.PROFILE);
    setIsUserMenuOpen(false);
  }, [navigate]);

  // useRef for the user menu dropdown
  const userMenuRef = useRef<HTMLDivElement>(null);

  // useRef for the org selector dropdown
  const orgSelectorRef = useRef<HTMLDivElement>(null);

  // useClickOutside hook for closing the user menu dropdown
  useClickOutside(userMenuRef, () => {
    setIsUserMenuOpen(false);
  });

  // useClickOutside hook for closing the org selector dropdown
  useClickOutside(orgSelectorRef, () => {
    setIsOrgSelectorOpen(false);
  });

  // Return the header component with logo, organization selector, notification center, theme toggle, and user menu
  return (
    <HeaderContainer>
      <LogoContainer>
        <MobileMenuButton onClick={onMenuToggle}>
          <IconButton icon={<MenuIcon />} aria-label="Toggle Menu" />
        </MobileMenuButton>
        <LogoLink to={ROUTES.DASHBOARD.HOME}>
          <LogoImage src="/logo.svg" alt="Metronomics Logo" />
        </LogoLink>
      </LogoContainer>

      <OrgSelectorContainer>
        <Dropdown
          options={organizations.map((org) => ({ label: org.name, value: org.id }))}
          value={currentOrganization?.id}
          onChange={(e) => handleSwitchOrganization(e.value)}
          placeholder="Select Organization"
        />
      </OrgSelectorContainer>

      <ActionsContainer>
        <NotificationCenter />
        <IconButton icon={themeMode === 'dark' ? '☀️' : '🌙'} aria-label="Toggle Theme" onClick={toggleTheme} />
        <UserMenuContainer>
          <UserMenuTrigger onClick={toggleUserMenu}>
            <UserAvatar src={authState.user?.photoURL || '/default-avatar.png'} alt="User Avatar" />
            <UserName>{authState.user?.firstName} {authState.user?.lastName}</UserName>
          </UserMenuTrigger>
          {isUserMenuOpen && (
            <DropdownMenu ref={userMenuRef}>
              <DropdownItem onClick={handleProfileClick}>
                <DropdownItemIcon>👤</DropdownItemIcon>
                Profile
              </DropdownItem>
              <DropdownItem onClick={handleLogout}>
                <DropdownItemIcon>🚪</DropdownItemIcon>
                Logout
              </DropdownItem>
            </DropdownMenu>
          )}
        </UserMenuContainer>
      </ActionsContainer>
    </HeaderContainer>
  );
};

export default Header;