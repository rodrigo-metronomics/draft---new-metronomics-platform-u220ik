import React from 'react'; // ^18.2.0
import styled from 'styled-components'; // ^5.3.10
import { neutral } from '../../styles/colors';
import { mediaQueries } from '../../styles/breakpoints';
import { textStyles } from '../../styles/typography';
import { useTheme } from '../../contexts/ThemeContext';

const FooterContainer = styled.footer`
  padding: 1rem;
  background-color: ${props => props.theme.themeMode === 'dark' ? neutral[800] : neutral[100]};
  border-top: 1px solid ${props => props.theme.themeMode === 'dark' ? neutral[700] : neutral[200]};
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  
  ${mediaQueries.sm} {
    flex-direction: row;
  }
`;

const Copyright = styled.div`
  ${textStyles.caption}
  color: ${props => props.theme.themeMode === 'dark' ? neutral[400] : neutral[600]};
  margin-bottom: 0.5rem;
  
  ${mediaQueries.sm} {
    margin-bottom: 0;
  }
`;

const Links = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  
  ${mediaQueries.sm} {
    justify-content: flex-end;
  }
`;

const Link = styled.a`
  ${textStyles.caption}
  color: ${props => props.theme.themeMode === 'dark' ? neutral[400] : neutral[600]};
  text-decoration: none;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.primary[500]};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${props => 
      props.theme.themeMode === 'dark' ? 'rgba(64, 169, 255, 0.25)' : 'rgba(24, 144, 255, 0.25)'};
  }
`;

const Footer: React.FC = () => {
  const { themeMode } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <FooterContainer theme={{ themeMode }}>
      <Copyright theme={{ themeMode }}>
        © {currentYear} Metronomics. All rights reserved.
      </Copyright>
      <Links>
        <Link href="/terms" theme={{ themeMode }}>Terms of Service</Link>
        <Link href="/privacy" theme={{ themeMode }}>Privacy Policy</Link>
        <Link href="/contact" theme={{ themeMode }}>Contact Us</Link>
      </Links>
    </FooterContainer>
  );
};

export default Footer;