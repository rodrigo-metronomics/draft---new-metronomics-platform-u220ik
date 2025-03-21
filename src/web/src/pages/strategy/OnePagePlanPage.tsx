import React, { useState, useRef, useCallback } from 'react'; // React core functionality and hooks // v18.2.0
import styled from 'styled-components'; // Styling the component with CSS-in-JS // v5.3.10
import { Button } from 'primereact/button'; // UI button component for actions // v10.0.0
import { Toast } from 'primereact/toast'; // Display toast notifications // v10.0.0
import jsPDF from 'jspdf'; // Generate PDF exports of the One-Page Plan // v2.5.1
import html2canvas from 'html2canvas'; // Convert HTML content to canvas for PDF export // v1.4.1

import DashboardLayout from '../../layouts/DashboardLayout'; // Layout wrapper for authenticated dashboard pages
import OnePagePlan from '../../components/strategy/OnePagePlan'; // Component that renders the consolidated view of strategic goals and metrics
import { ROUTES } from '../../utils/constants/routes'; // Route constants for navigation
import useGoals from '../../hooks/useGoals'; // Hook for fetching and managing strategic goals
import useMetrics from '../../hooks/useMetrics'; // Hook for fetching and managing metrics
import { useOrganizationContext } from '../../contexts/OrganizationContext'; // Access current organization context

// Styled components using styled-components library
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  height: 100%;
  overflow-y: auto;
  @media print {
    padding: 0;
    overflow: visible;
  }
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  @media print {
    display: none;
  }
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  @media print {
    font-size: 1.5rem;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  @media print {
    margin: 0;
    padding: 0;
  }
`;

const PrintContainer = styled.div`
  display: none;
  @media print {
    display: block;
    width: 100%;
  }
`;

/**
 * Page component that renders the One-Page Plan view
 */
const OnePagePlanPage: React.FC = () => {
  // Initialize state for edit mode, print mode, and loading state
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Create refs for the OnePagePlan component and Toast component
  const planRef = useRef<any>(null);
  const toast = useRef<Toast>(null);

  // Get current organization from context
  const { currentOrganization } = useOrganizationContext();

  // Initialize goals and metrics hooks
  const { goals, getGoalsByType } = useGoals();
  const { metrics, getDashboardMetrics } = useMetrics();

  // Define handleEdit function to toggle edit mode
  const handleEdit = useCallback(() => {
    setIsEditMode(!isEditMode);
  }, [isEditMode]);

  // Define handlePrint function to trigger printing
  const handlePrint = useCallback(() => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  }, []);

  // Define handleExport function to generate PDF export
  const handleExport = useCallback(() => {
    setIsExporting(true);
    exportToPdf().finally(() => setIsExporting(false));
  }, []);

  // Define exportToPdf function to convert the plan to PDF using jsPDF and html2canvas
  const exportToPdf = async () => {
    try {
      if (!planRef.current) {
        console.error('OnePagePlan component ref is not available.');
        return;
      }

      const element = planRef.current;
      const canvas = await html2canvas(element, {
        useCORS: true, // Enable cross-origin image support
        scale: 2, // Increase resolution for better quality
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${currentOrganization?.name || 'Metronomics'} - One-Page Plan - ${new Date().toLocaleDateString()}.pdf`);

      if (toast.current) {
        toast.current.show({ severity: 'success', summary: 'Export Successful', detail: 'One-Page Plan exported to PDF' });
      }
    } catch (error: any) {
      console.error('Error exporting to PDF:', error);
      if (toast.current) {
        toast.current.show({ severity: 'error', summary: 'Export Failed', detail: 'Failed to export One-Page Plan to PDF', life: 5000 });
      }
    }
  };

  // Render the DashboardLayout with the OnePagePlan component
  return (
    <DashboardLayout showBreadcrumbs={true}>
      <PageContainer>
        <PageHeader>
          <PageTitle>One-Page Plan</PageTitle>
          <ActionButtons>
            <Button label="Edit" icon="pi pi-pencil" onClick={handleEdit} disabled={isEditMode} />
            <Button label="Print" icon="pi pi-print" onClick={handlePrint} disabled={isPrintMode || isExporting} />
            <Button label="Export" icon="pi pi-file-pdf" onClick={handleExport} disabled={isPrintMode || isExporting} />
          </ActionButtons>
        </PageHeader>
        <ContentContainer>
          <OnePagePlan
            ref={planRef}
            editable={isEditMode}
            printable={isPrintMode}
            onEdit={handleEdit}
            onPrint={handlePrint}
            onExport={handleExport}
          />
        </ContentContainer>
      </PageContainer>
      <Toast ref={toast} />
    </DashboardLayout>
  );
};

export default OnePagePlanPage;