import { createGlobalStyle } from 'styled-components'; // ^5.3.10
import { normalize } from 'styled-normalize'; // ^8.0.7
import { colors, themeColors } from './colors';
import { fontFamilies, fontSizes, fontWeights, lineHeights } from './typography';
import { mediaQueries } from './breakpoints';
import { focusOutline } from './mixins';

/**
 * GlobalStyles component for the Metronomics Platform.
 * Establishes base styling for HTML elements, resets browser defaults,
 * and applies consistent typography, spacing, and accessibility styles
 * across the entire application.
 */
const GlobalStyles = createGlobalStyle`
  /* Import normalize.css for consistent cross-browser styling */
  ${normalize}
  
  /* Box sizing for all elements */
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  
  /* Set core body defaults */
  html {
    font-size: 16px;
    height: 100%;
    scroll-behavior: smooth;
    -webkit-text-size-adjust: 100%; /* Prevent font size adjustment on orientation change */
  }
  
  body {
    height: 100%;
    min-height: 100vh;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    background-color: ${themeColors.light.background.primary};
    color: ${themeColors.light.text.primary};
    font-family: ${fontFamilies.primary};
    font-size: ${fontSizes.md};
    font-weight: ${fontWeights.regular};
    line-height: ${lineHeights.normal};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    transition: background-color 0.3s ease, color 0.3s ease;
    
    &.dark-theme {
      background-color: ${themeColors.dark.background.primary};
      color: ${themeColors.dark.text.primary};
    }
  }
  
  #root {
    height: 100%;
  }
  
  /* Typography */
  h1, h2, h3, h4, h5, h6 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-family: ${fontFamilies.secondary};
    font-weight: ${fontWeights.bold};
    line-height: ${lineHeights.tight};
    color: ${themeColors.light.text.primary};
    
    .dark-theme & {
      color: ${themeColors.dark.text.primary};
    }
  }
  
  h1 {
    font-size: ${fontSizes.xxxl};
    
    ${mediaQueries.sm} {
      font-size: 2.25rem; /* 36px */
    }
    
    ${mediaQueries.lg} {
      font-size: 2.5rem; /* 40px */
    }
  }
  
  h2 {
    font-size: ${fontSizes.xxl};
    
    ${mediaQueries.sm} {
      font-size: 1.75rem; /* 28px */
    }
    
    ${mediaQueries.lg} {
      font-size: 2rem; /* 32px */
    }
  }
  
  h3 {
    font-size: ${fontSizes.xl};
    font-weight: ${fontWeights.semibold};
    
    ${mediaQueries.sm} {
      font-size: 1.375rem; /* 22px */
    }
    
    ${mediaQueries.lg} {
      font-size: 1.5rem; /* 24px */
    }
  }
  
  h4 {
    font-size: ${fontSizes.lg};
    font-weight: ${fontWeights.semibold};
    
    ${mediaQueries.lg} {
      font-size: 1.25rem; /* 20px */
    }
  }
  
  h5 {
    font-size: ${fontSizes.md};
    font-weight: ${fontWeights.semibold};
  }
  
  h6 {
    font-size: ${fontSizes.sm};
    font-weight: ${fontWeights.semibold};
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }
  
  p {
    margin-top: 0;
    margin-bottom: 1rem;
  }
  
  /* Links */
  a {
    color: ${colors.primary[500]};
    text-decoration: none;
    transition: color 0.2s ease-in-out, text-decoration 0.2s ease-in-out;
    
    &:hover {
      color: ${colors.primary[700]};
      text-decoration: underline;
    }
    
    ${focusOutline}
    
    .dark-theme & {
      color: ${colors.primary[300]};
      
      &:hover {
        color: ${colors.primary[200]};
      }
    }
  }
  
  /* Lists */
  ul, ol {
    margin-top: 0;
    margin-bottom: 1rem;
    padding-left: 2rem;
  }
  
  li {
    margin-bottom: 0.5rem;
  }
  
  /* Make images and embedded objects responsive */
  img,
  video,
  object,
  iframe {
    max-width: 100%;
    height: auto;
  }
  
  /* Form elements */
  input,
  button,
  select,
  textarea {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
  }
  
  button,
  input,
  select,
  textarea {
    margin: 0;
  }
  
  button {
    cursor: pointer;
    
    &:disabled {
      cursor: not-allowed;
    }
    
    ${focusOutline}
  }
  
  input[type="text"],
  input[type="email"],
  input[type="password"],
  input[type="search"],
  input[type="url"],
  input[type="tel"],
  input[type="number"],
  input[type="date"],
  textarea,
  select {
    display: block;
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: ${fontSizes.md};
    line-height: 1.5;
    color: ${themeColors.light.text.primary};
    background-color: ${themeColors.light.background.primary};
    border: 1px solid ${themeColors.light.border.default};
    border-radius: 4px;
    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    
    &:focus {
      border-color: ${colors.primary[500]};
      outline: 0;
      box-shadow: 0 0 0 0.2rem ${themeColors.light.action.focus};
    }
    
    &:disabled,
    &[readonly] {
      background-color: ${themeColors.light.background.tertiary};
      opacity: 1;
    }
    
    .dark-theme & {
      color: ${themeColors.dark.text.primary};
      background-color: ${themeColors.dark.background.primary};
      border-color: ${themeColors.dark.border.default};
      
      &:focus {
        border-color: ${colors.primary[400]};
        box-shadow: 0 0 0 0.2rem ${themeColors.dark.action.focus};
      }
      
      &:disabled,
      &[readonly] {
        background-color: ${themeColors.dark.background.tertiary};
      }
    }
  }
  
  /* Checkboxes and radios */
  input[type="checkbox"],
  input[type="radio"] {
    box-sizing: border-box;
    padding: 0;
    margin-right: 0.5rem;
  }
  
  /* Focus styles for accessibility */
  :focus-visible {
    outline: 2px solid ${themeColors.light.action.focus};
    outline-offset: 2px;
    
    .dark-theme & {
      outline-color: ${themeColors.dark.action.focus};
    }
  }
  
  /* Skip to content links for keyboard accessibility */
  .skip-to-content {
    position: absolute;
    left: -9999px;
    z-index: 999;
    padding: 1rem;
    background-color: ${themeColors.light.background.primary};
    color: ${themeColors.light.text.primary};
    text-decoration: none;
    
    &:focus {
      left: 0;
      top: 0;
    }
    
    .dark-theme & {
      background-color: ${themeColors.dark.background.primary};
      color: ${themeColors.dark.text.primary};
    }
  }
  
  /* Text selection styling */
  ::selection {
    background-color: ${colors.primary[200]};
    color: ${themeColors.light.text.primary};
    
    .dark-theme & {
      background-color: ${colors.primary[700]};
      color: ${themeColors.dark.text.primary};
    }
  }
  
  /* Tables */
  table {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 1rem;
  }
  
  caption {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
    color: ${themeColors.light.text.tertiary};
    text-align: left;
    caption-side: bottom;
    
    .dark-theme & {
      color: ${themeColors.dark.text.tertiary};
    }
  }
  
  th {
    text-align: inherit;
    font-weight: ${fontWeights.semibold};
  }
  
  th, td {
    padding: 0.75rem;
    vertical-align: top;
    border-top: 1px solid ${themeColors.light.border.light};
    
    .dark-theme & {
      border-top-color: ${themeColors.dark.border.light};
    }
  }
  
  thead th {
    vertical-align: bottom;
    border-bottom: 2px solid ${themeColors.light.border.default};
    
    .dark-theme & {
      border-bottom-color: ${themeColors.dark.border.default};
    }
  }
  
  /* Code blocks */
  code, pre {
    font-family: ${fontFamilies.mono};
    font-size: 0.875em;
  }
  
  code {
    padding: 0.2em 0.4em;
    background-color: ${themeColors.light.background.tertiary};
    border-radius: 3px;
    
    .dark-theme & {
      background-color: ${themeColors.dark.background.tertiary};
    }
  }
  
  pre {
    margin-top: 0;
    margin-bottom: 1rem;
    overflow: auto;
    padding: 1rem;
    background-color: ${themeColors.light.background.tertiary};
    border-radius: 4px;
    
    .dark-theme & {
      background-color: ${themeColors.dark.background.tertiary};
    }
    
    code {
      padding: 0;
      background-color: transparent;
      border-radius: 0;
    }
  }
  
  /* Blockquotes */
  blockquote {
    margin: 0 0 1rem;
    padding: 0.5rem 1rem;
    border-left: 4px solid ${themeColors.light.border.default};
    color: ${themeColors.light.text.secondary};
    
    .dark-theme & {
      border-left-color: ${themeColors.dark.border.default};
      color: ${themeColors.dark.text.secondary};
    }
  }
  
  /* Horizontal rule */
  hr {
    margin: 2rem 0;
    border: 0;
    border-top: 1px solid ${themeColors.light.border.default};
    
    .dark-theme & {
      border-top-color: ${themeColors.dark.border.default};
    }
  }
  
  /* Helper classes for accessibility */
  .visually-hidden,
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  .sr-only-focusable:active,
  .sr-only-focusable:focus {
    position: static;
    width: auto;
    height: auto;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }
  
  /* Responsive containers */
  .container {
    width: 100%;
    padding-right: 1rem;
    padding-left: 1rem;
    margin-right: auto;
    margin-left: auto;
    
    ${mediaQueries.sm} {
      max-width: 540px;
    }
    
    ${mediaQueries.md} {
      max-width: 720px;
    }
    
    ${mediaQueries.lg} {
      max-width: 960px;
    }
    
    ${mediaQueries.xl} {
      max-width: 1140px;
    }
  }
  
  .container-fluid {
    width: 100%;
    padding-right: 1rem;
    padding-left: 1rem;
    margin-right: auto;
    margin-left: auto;
  }
  
  /* Print styles */
  @media print {
    *,
    *::before,
    *::after {
      text-shadow: none !important;
      box-shadow: none !important;
    }
    
    a:not(.btn) {
      text-decoration: underline;
    }
    
    abbr[title]::after {
      content: " (" attr(title) ")";
    }
    
    pre {
      white-space: pre-wrap !important;
    }
    
    pre,
    blockquote {
      border: 1px solid ${themeColors.light.border.default};
      page-break-inside: avoid;
    }
    
    thead {
      display: table-header-group;
    }
    
    tr,
    img {
      page-break-inside: avoid;
    }
    
    p,
    h2,
    h3 {
      orphans: 3;
      widows: 3;
    }
    
    h2,
    h3 {
      page-break-after: avoid;
    }
    
    /* Hide elements when printing */
    .d-print-none {
      display: none !important;
    }
  }
`;

export default GlobalStyles;