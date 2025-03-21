# src/web/src/components/common/tests/Badge.test.tsx
```typescript
import { render, screen } from '@testing-library/react'; // @testing-library/react@^14.0.0
import { describe, it, expect } from 'vitest'; // vitest@^0.34.0
import Badge from '../Badge';
import { Severity, Size } from '../../../types/common.types';
import { renderWithProviders } from '../../../../tests/testUtils';

describe('Badge', () => {
  it('renders with default props', () => {
    // Arrange
    const value = 'Test Badge';

    // Act
    render(<Badge value={value} />);

    // Assert
    const badgeElement = screen.getByText(value);
    expect(badgeElement).toBeInTheDocument();
    expect(badgeElement).toHaveClass('p-badge');
  });

  it('renders with different severity levels', () => {
    // Arrange
    const severities = [Severity.SUCCESS, Severity.INFO, Severity.WARNING, Severity.ERROR];

    // Act
    severities.forEach(severity => {
      render(<Badge value={severity} severity={severity} />);
    });

    // Assert
    expect(screen.getByText(Severity.SUCCESS)).toHaveClass('p-badge-success');
    expect(screen.getByText(Severity.INFO)).toHaveClass('p-badge-info');
    expect(screen.getByText(Severity.WARNING)).toHaveClass('p-badge-warning');
    expect(screen.getByText(Severity.ERROR)).toHaveClass('p-badge-danger');
  });

  it('renders with different sizes', () => {
    // Arrange
    const sizes = [Size.SMALL, Size.MEDIUM, Size.LARGE];

    // Act
    sizes.forEach(size => {
      render(<Badge value={size} size={size} />);
    });

    // Assert
    const smallBadge = screen.getByText(Size.SMALL);
    expect(smallBadge).toBeInTheDocument();

    const mediumBadge = screen.getByText(Size.MEDIUM);
    expect(mediumBadge).toBeInTheDocument();

    const largeBadge = screen.getByText(Size.LARGE);
    expect(largeBadge).toBeInTheDocument();
  });

  it('renders with pill shape when pill prop is true', () => {
    // Act
    render(<Badge value="Pill" pill />);

    // Assert
    const badgeElement = screen.getByText('Pill');
    expect(badgeElement).toHaveClass('p-badge-pill');
  });

  it('renders with outlined style when outlined prop is true', () => {
    // Act
    renderWithProviders(<Badge value="Outlined" outlined />);

    // Assert
    const badgeElement = screen.getByText('Outlined');
    expect(badgeElement).toHaveStyle('background-color: transparent');
  });

  it('renders as a dot when dot prop is true', () => {
    // Act
    render(<Badge dot severity={Severity.ERROR} />);

    // Assert
    const badgeElement = screen.getByRole('status');
    expect(badgeElement).toHaveClass('p-badge-dot');
    expect(badgeElement).toHaveStyle('padding: 0px;');
    expect(badgeElement).toHaveTextContent('');
  });

  it('applies custom className when provided', () => {
    // Arrange
    const className = 'custom-badge-class';

    // Act
    render(<Badge value="Custom Class" className={className} />);

    // Assert
    const badgeElement = screen.getByText('Custom Class');
    expect(badgeElement).toHaveClass(className);
  });

  it('applies custom style when provided', () => {
    // Arrange
    const customStyle = { backgroundColor: 'purple', color: 'white' };

    // Act
    render(<Badge value="Custom Style" style={customStyle} />);

    // Assert
    const badgeElement = screen.getByText('Custom Style');
    expect(badgeElement).toHaveStyle(customStyle);
  });

  it('renders with numeric value', () => {
    // Arrange
    const numericValue = 123;

    // Act
    render(<Badge value={numericValue} />);

    // Assert
    const badgeElement = screen.getByText(String(numericValue));
    expect(badgeElement).toBeInTheDocument();
  });

  it('renders with different positions', () => {
    // Arrange
    const positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];

    // Act
    positions.forEach(position => {
      renderWithProviders(<div style={{ position: 'relative', width: '100px', height: '100px' }}><Badge value="Pos" position={position} /></div>);
    });

    // Assert
    const topRightBadge = screen.getByText('Pos');
    expect(topRightBadge).toBeInTheDocument();
  });
});