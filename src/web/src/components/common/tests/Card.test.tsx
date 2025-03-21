import React from 'react';
import { screen, fireEvent } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0
import Card from '../Card';
import { renderWithProviders } from '../../../tests/testUtils';

describe('Card', () => {
  it('should render with default props', () => {
    renderWithProviders(<Card>Test Content</Card>);

    expect(screen.getByText('Test Content')).toBeInTheDocument();
    const cardElement = screen.getByText('Test Content').closest('.p-card');
    expect(cardElement).toHaveClass('p-card');
    expect(cardElement).not.toHaveClass('p-card-shadow');
  });

  it('should render with title', () => {
    renderWithProviders(<Card title="Test Title">Test Content</Card>);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toHaveClass('p-card-title');
  });

  it('should render with custom header', () => {
    const customHeader = <h3>Custom Header</h3>;
    renderWithProviders(<Card header={customHeader}>Test Content</Card>);

    expect(screen.getByText('Custom Header')).toBeInTheDocument();
  });

  it('should render with actions', () => {
    const actions = <button>Action</button>;
    renderWithProviders(<Card title="Test Title" actions={actions}>Test Content</Card>);

    expect(screen.getByText('Action')).toBeInTheDocument();
    const actionsContainer = screen.getByText('Action').closest('.p-card-header');
    expect(actionsContainer).toBeInTheDocument();
  });

  it('should render with footer', () => {
    const footer = <div>Test Footer</div>;
    renderWithProviders(<Card footer={footer}>Test Content</Card>);

    expect(screen.getByText('Test Footer')).toBeInTheDocument();
    const footerContainer = screen.getByText('Test Footer').closest('.p-card-footer');
    expect(footerContainer).toBeInTheDocument();
  });

  it('should render with different variants', () => {
    renderWithProviders(<Card variant="primary">Test Content</Card>);
    const cardElement = screen.getByText('Test Content').closest('.p-card');
    expect(cardElement).toHaveStyleRule('border-left', expect.stringContaining('4px solid'));

    renderWithProviders(<Card variant="secondary">Test Content</Card>);
    const cardElementSecondary = screen.getByText('Test Content').closest('.p-card');
    expect(cardElementSecondary).toHaveStyleRule('border-left', expect.stringContaining('4px solid'));
  });

  it('should render with elevated style', () => {
    renderWithProviders(<Card elevated>Test Content</Card>);

    const cardElement = screen.getByText('Test Content').closest('.p-card');
    expect(cardElement).toHaveStyleRule('box-shadow', expect.stringContaining('rgba(0, 0, 0, 0.12)'));
  });

  it('should render without border', () => {
    renderWithProviders(<Card bordered={false}>Test Content</Card>);

    const cardElement = screen.getByText('Test Content').closest('.p-card');
    expect(cardElement).toHaveStyleRule('border', 'none');
  });

  it('should render with full height', () => {
    renderWithProviders(<Card fullHeight>Test Content</Card>);

    const cardElement = screen.getByText('Test Content').closest('.p-card');
    expect(cardElement).toHaveStyleRule('height', '100%');
  });

  it('should render as interactive', () => {
    renderWithProviders(<Card interactive>Test Content</Card>);

    const cardElement = screen.getByText('Test Content').closest('.p-card');
    expect(cardElement).toHaveStyleRule('cursor', 'pointer');
  });

  it('should call onClick handler when interactive and clicked', () => {
    const onClick = vi.fn();
    renderWithProviders(<Card interactive onClick={onClick}>Test Content</Card>);

    const cardElement = screen.getByText('Test Content').closest('.p-card');
    fireEvent.click(cardElement as Element);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick handler when not interactive', () => {
    const onClick = vi.fn();
    renderWithProviders(<Card onClick={onClick}>Test Content</Card>);

    const cardElement = screen.getByText('Test Content').closest('.p-card');
    fireEvent.click(cardElement as Element);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should be accessible via keyboard when interactive', async () => {
    const onClick = vi.fn();
    renderWithProviders(<Card interactive onClick={onClick}>Test Content</Card>);

    const cardElement = screen.getByText('Test Content').closest('.p-card');
    await userEvent.tab();
    expect(cardElement).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);

    await userEvent.keyboard('{Space}');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('should render with custom className', () => {
    renderWithProviders(<Card className="custom-class">Test Content</Card>);

    const cardElement = screen.getByText('Test Content').closest('.p-card');
    expect(cardElement).toHaveClass('custom-class');
  });

  it('should render with custom style', () => {
    renderWithProviders(<Card style={{ backgroundColor: 'red' }}>Test Content</Card>);

    const cardElement = screen.getByText('Test Content').closest('.p-card');
    expect(cardElement).toHaveStyle('background-color: red');
  });
});