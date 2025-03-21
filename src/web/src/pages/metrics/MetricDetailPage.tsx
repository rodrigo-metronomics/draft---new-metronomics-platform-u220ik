import React, { useState, useEffect, useCallback, useMemo } from 'react'; // React library for UI components // v18.2.0
import { useParams, useNavigate } from 'react-router-dom'; // React Router for navigation // v6.10.0
import styled from 'styled-components'; // Styling components with CSS-in-JS // v5.3.9
import { TabPanel } from 'primereact/tabview'; // PrimeReact tab panel component // v10.0.0
import { DataTable } from 'primereact/datatable'; // PrimeReact data table component // v10.0.0
import { Column } from 'primereact/column'; // PrimeReact column component for data table // v10.0.0
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'; // PrimeReact confirmation dialog // v10.0.0
import { Toast } from 'primereact/toast'; // PrimeReact toast component for notifications // v10.0.0

import DashboardLayout from '../../layouts/DashboardLayout'; // Layout for dashboard pages
import Card from '../../components/common/Card'; // Container for sections of the page
import Button from '../../components/common/Button'; // Button component for actions
import Tabs from '../../components/common/Tabs'; // Tab navigation for different sections
import Modal from '../../components/common/Modal'; // Modal component for forms and confirmations
import Spinner from '../../components/common/Spinner'; // Loading indicator
import MetricChart from '../../components/metrics/MetricChart'; // Chart component for visualizing metric data
import MetricValueEditor from '../../components/metrics/MetricValueEditor'; // Form for adding new metric values
import MetricThresholdEditor from '../../components/metrics/MetricThresholdEditor'; // Component for editing metric thresholds
import useMetrics from '../../hooks/useMetrics'; // Custom hook for metric operations
import useOrganizationContext from '../../contexts/OrganizationContext'; // Access current organization context
import useAuth from '../../hooks/useAuth'; // Authentication and permission checking
import {
  MetricWithRelations,
  MetricValue,
  MetricThreshold,
  CreateMetricThresholdDto,
  TimeRange,
  ChartType,
  ColorScheme,
} from '../../types/metric.types'; // Type definitions for metrics
import { DateRange } from '../../types/common.types'; // Common type definitions
import { PERMISSIONS } from '../../utils/constants/permissions'; // Permission constants for access control
import { ROUTES } from '../../utils/constants/routes'; // Route constants for navigation
import { formatMetricValue, formatDate } from '../../utils/helpers/formatHelper'; // Utility functions for formatting values and dates

// Styled component for the metric detail page
const MetricDetailPageContainer = styled.div`
  padding: 20px;
`;

// Interface for the MetricDetailPage component props
interface MetricDetailPageProps {}

/**
 * Main component for displaying detailed information about a specific metric
 */
const MetricDetailPage: React.FC<MetricDetailPageProps> = () => {
  // Get metric ID from URL parameters using useParams hook
  const { id: metricId } = useParams<{ id: string }>();

  // Initialize state for active tab, time range, chart type, and modal visibility
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [addValueModalVisible, setAddValueModalVisible] = useState(false);
  const [thresholdModalVisible, setThresholdModalVisible] = useState(false);

  // Get current organization from context
  const { currentOrganization } = useOrganizationContext();

  // Check user permissions for editing and deleting metrics
  const { hasPermission } = useAuth();
  const canEdit = hasPermission(PERMISSIONS.UPDATE_METRIC);
  const canDelete = hasPermission(PERMISSIONS.DELETE_METRIC);

  // Fetch metric data with relations using getMetricWithRelations query
  const {
    getMetricWithValues,
    getMetricValues,
    deleteMetricValue,
    updateMetric,
    deleteMetric,
    exportMetrics,
  } = useMetrics();

  // React toast to display notifications
  const toast = useRef<Toast>(null);

  // Fetch metric data with relations using getMetricWithRelations query
  const {
    data: metric,
    isLoading,
    error,
    refetch,
  } = getMetricWithValues(
    metricId || '',
    { metricId: metricId || '', startDate: null, endDate: null }
  );

  // Fetch metric values using getMetricValues query with time range filter
  const { data: metricValues, refetch: refetchValues } = getMetricValues(
    metricId || '',
    {
      metricId: metricId || '',
      startDate: null,
      endDate: null,
    }
  );

  // React router dom useNavigate function
  const navigate = useNavigate();

  // Handle tab change to switch between overview, values, and settings tabs
  const handleTabChange = (index: number) => {
    setActiveTab(index);
  };

  // Handle time range change to update the chart and values display
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    refetchValues();
  };

  // Handle chart type change to update the visualization
  const handleChartTypeChange = (type: ChartType) => {
    setChartType(type);
  };

  // Handle adding new metric values through the MetricValueEditor modal
  const handleAddValue = () => {
    setAddValueModalVisible(true);
  };

  // Handle successful addition of a new metric value
  const handleValueAdded = () => {
    setAddValueModalVisible(false);
    refetchValues();
    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: 'Metric value added successfully',
    });
  };

  // Handle deletion of a metric value with confirmation dialog
  const handleDeleteValue = (valueId: string) => {
    confirmDialog({
      message: 'Are you sure you want to delete this value?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        deleteMetricValue
          .mutateAsync(valueId)
          .then(() => {
            refetchValues();
            toast.current?.show({
              severity: 'success',
              summary: 'Success',
              detail: 'Metric value deleted successfully',
            });
          })
          .catch((err) => {
            console.error('Failed to delete metric value', err);
            toast.current?.show({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete metric value',
            });
          });
      },
    });
  };

  // Handle opening the threshold editor modal
  const handleEditThresholds = () => {
    setThresholdModalVisible(true);
  };

  // Handle successful update of metric thresholds
  const handleThresholdsUpdated = async (thresholds: CreateMetricThresholdDto[]) => {
    setThresholdModalVisible(false);
    if (metric) {
      updateMetric
        .mutateAsync({ id: metric.id, metricData: { ...metric, thresholds: thresholds } })
        .then(() => {
          refetch();
          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Metric thresholds updated successfully',
          });
        })
        .catch((err) => {
          console.error('Failed to update metric thresholds', err);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update metric thresholds',
          });
        });
    }
  };

  // Handle exporting metric data in various formats
  const handleExport = async (format: string) => {
    if (metric) {
      exportMetrics({ format: format, includeValues: true, dateRange: null, filters: null })
        .then((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${metric.name}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Metric data exported successfully',
          });
        })
        .catch((err) => {
          console.error('Failed to export metric data', err);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to export metric data',
          });
        });
    }
  };

  // Handle metric deletion with confirmation dialog
  const handleDeleteMetric = () => {
    confirmDialog({
      message: 'Are you sure you want to delete this metric?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        deleteMetric
          .mutateAsync(metricId || '')
          .then(() => {
            navigate(ROUTES.METRICS.DASHBOARD);
            toast.current?.show({
              severity: 'success',
              summary: 'Success',
              detail: 'Metric deleted successfully',
            });
          })
          .catch((err) => {
            console.error('Failed to delete metric', err);
            toast.current?.show({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete metric',
            });
          });
      },
    });
  };

  // Render loading state while data is being fetched
  if (isLoading) {
    return (
      <DashboardLayout>
        <Spinner />
      </DashboardLayout>
    );
  }

  // Render error state if data fetching fails
  if (error) {
    return (
      <DashboardLayout>
        <p>Error: {error.message}</p>
      </DashboardLayout>
    );
  }

  // Render the metric detail page with header, tabs, and content sections
  return (
    <DashboardLayout>
      <ConfirmDialog />
      <Toast ref={toast} />
      <MetricDetailPageContainer>
        <h2>{metric?.name}</h2>
        <Tabs activeIndex={activeTab} onTabChange={handleTabChange}>
          <TabPanel header="Overview">{renderOverviewTab()}</TabPanel>
          <TabPanel header="Values">{renderValuesTab()}</TabPanel>
          <TabPanel header="Settings">{renderSettingsTab()}</TabPanel>
        </Tabs>
      </MetricDetailPageContainer>

      {/* Modals */}
      <Modal
        visible={addValueModalVisible}
        onHide={() => setAddValueModalVisible(false)}
        header="Add Metric Value"
      >
        <MetricValueEditor
          metricId={metricId || ''}
          metricType={metric?.type || 'number'}
          metricUnit={metric?.unit || ''}
          onSuccess={handleValueAdded}
          onCancel={() => setAddValueModalVisible(false)}
        />
      </Modal>

      <Modal
        visible={thresholdModalVisible}
        onHide={() => setThresholdModalVisible(false)}
        header="Edit Thresholds"
      >
        <MetricThresholdEditor
          initialThresholds={metric?.thresholds || []}
          onThresholdsChange={handleThresholdsUpdated}
          metricType={metric?.type || 'number'}
        />
      </Modal>
    </DashboardLayout>
  );

  // Renders the overview tab content
  function renderOverviewTab() {
    return (
      <div>
        <p>{metric?.description}</p>
        <Card>
          <MetricChart
            metric={metric}
            chartType={chartType}
            timeRange={timeRange}
            dateRange={{ startDate: '', endDate: '' }}
          />
        </Card>
        <p>Type: {metric?.type}</p>
        <p>Unit: {metric?.unit}</p>
        <p>Comparison Type: {metric?.comparisonType}</p>
      </div>
    );
  }

  // Renders the values tab content
  function renderValuesTab() {
    return (
      <div>
        {canEdit && (
          <Button label="Add Value" onClick={handleAddValue} />
        )}
        <DataTable value={metricValues}>
          <Column field="timestamp" header="Timestamp" body={(rowData) => formatDate(rowData.timestamp, 'MM/DD/YYYY hh:mm:ss')} />
          <Column field="value" header="Value" body={(rowData) => formatMetricValue(rowData.value, metric?.type || 'number', metric?.unit || '')} />
          <Column field="note" header="Note" />
          {canEdit && (
            <Column
              body={(rowData) => (
                <Button
                  label="Delete"
                  onClick={() => handleDeleteValue(rowData.id)}
                />
              )}
            />
          )}
        </DataTable>
      </div>
    );
  }

  // Renders the settings tab content
  function renderSettingsTab() {
    return (
      <div>
        {canEdit && (
          <Button label="Edit Thresholds" onClick={handleEditThresholds} />
        )}
        {canExport && (
          <Button label="Export" onClick={() => handleExport('csv')} />
        )}
        {canDelete && (
          <Button label="Delete Metric" onClick={handleDeleteMetric} />
        )}
      </div>
    );
  }
};

export default MetricDetailPage;