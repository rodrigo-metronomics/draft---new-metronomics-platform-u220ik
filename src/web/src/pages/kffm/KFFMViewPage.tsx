import React, { useState, useEffect, useCallback } from 'react'; // React, { useState, useEffect, useCallback } // v18.2.0
import styled from 'styled-components'; // styled-components // v5.3.10
import { useParams, useNavigate } from 'react-router-dom'; // { useParams, useNavigate } // v6.8.0
import { DndProvider } from 'react-dnd'; // { DndProvider } // v16.0.0
import { HTML5Backend } from 'react-dnd-html5-backend'; // { HTML5Backend } // v16.0.0

import DashboardLayout from '../../layouts/DashboardLayout'; // DashboardLayout
import KFFMToolbar from '../../components/kffm/KFFMToolbar'; // KFFMToolbar
import DragAndDropCanvas from '../../components/kffm/DragAndDropCanvas'; // DragAndDropCanvas
import FunctionNodeDetails from '../../components/kffm/FunctionNodeDetails'; // FunctionNodeDetails
import Spinner from '../../components/common/Spinner'; // Spinner
import useKFFM from '../../hooks/useKFFM'; // useKFFM, getKFFMById, getKFFMNodes, getKFFMConnections, useCanvasState
import { KFFMNode, KFFMConnection, KFFMEditorMode } from '../../types/kffm.types'; // { KFFMNode, KFFMConnection, KFFMEditorMode }
import { ROUTES } from '../../utils/constants/routes'; // ROUTES, KFFM

// Styled Components
const ViewContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

const CanvasContainer = styled.div`
  flex: 1;
  position: relative;
`;

const SidebarContainer = styled.div`
  width: 300px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ErrorContainer = styled.div`
  color: red;
`;

interface KFFMViewPageProps {
}

/**
 * Main component for the KFFM view page
 */
const KFFMViewPage: React.FC<KFFMViewPageProps> = () => {
  // LD1: Extract kffmId from URL parameters using useParams
  const { id: kffmId } = useParams<{ id: string }>();

  // LD1: Initialize navigate function using useNavigate
  const navigate = useNavigate();

  // LD1: Initialize state for selected node and connection
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  // LD1: Initialize state for canvas zoom level
  const [zoom, setZoom] = useState<number>(1);

  // LD1: Fetch KFFM data using getKFFMById query from useKFFM hook
  const { getKFFM, getKFFMNodes, getKFFMConnections, useCanvasState } = useKFFM();
  const { data: kffm, isLoading: isKFFMLoading, isError: isKFFMError, error: KFFMError } = getKFFM(kffmId || '');

  // LD1: Fetch KFFM nodes using getKFFMNodes query from useKFFM hook
  const { data: nodes, isLoading: isNodesLoading, isError: isNodesError, error: nodesError } = getKFFMNodes(kffmId || '');

  // LD1: Fetch KFFM connections using getKFFMConnections query from useKFFM hook
  const { data: connections, isLoading: isConnectionsLoading, isError: isConnectionsError, error: connectionsError } = getKFFMConnections(kffmId || '');

  // LD1: Initialize canvas state using useCanvasState hook
  const { position, zoom: canvasZoom, pan, zoomFn, reset } = useCanvasState({ x: 0, y: 0 });

  // LD1: Implement handleNodeSelect function to select a node
  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedConnectionId(null);
  }, []);

  // LD1: Implement handleConnectionSelect function to select a connection
  const handleConnectionSelect = useCallback((connectionId: string) => {
    setSelectedConnectionId(connectionId);
    setSelectedNodeId(null);
  }, []);

  // LD1: Implement handleZoomIn, handleZoomOut, and handleZoomReset functions
  const handleZoomIn = useCallback(() => {
    zoomFn(1.1);
  }, [zoomFn]);

  const handleZoomOut = useCallback(() => {
    zoomFn(0.9);
  }, [zoomFn]);

  const handleZoomReset = useCallback(() => {
    reset();
  }, [reset]);

  // LD1: Implement handleExport function to export KFFM
  const handleExport = useCallback(() => {
    // Implement export logic here
    console.log('Export KFFM');
  }, []);

  // LD1: Implement handleShare function to share KFFM
  const handleShare = useCallback(() => {
    // Implement share logic here
    console.log('Share KFFM');
  }, []);

  // LD1: Implement handleEditRedirect function to navigate to edit page
  const handleEditRedirect = useCallback(() => {
    navigate(ROUTES.KFFM.EDIT.replace(':id', kffmId || ''));
  }, [navigate, kffmId]);

  const handleDelete = useCallback(() => {
    // Implement delete logic here
    console.log('Delete KFFM');
  }, []);

  const handleNodeAdd = useCallback((nodeType: string, position: { x: number; y: number; }) => {
    // Implement node add logic here
    console.log('Add Node');
  }, []);

  // Render loading state
  if (isKFFMLoading || isNodesLoading || isConnectionsLoading) {
    return (
      <DashboardLayout title="KFFM View" showBreadcrumbs={true}>
        <LoadingContainer>
          <Spinner size="large" />
        </LoadingContainer>
      </DashboardLayout>
    );
  }

  // Render error state
  if (isKFFMError || isNodesError || isConnectionsError) {
    return (
      <DashboardLayout title="KFFM View" showBreadcrumbs={true}>
        <ErrorContainer>
          Error: {(KFFMError || nodesError || connectionsError)?.message}
        </ErrorContainer>
      </DashboardLayout>
    );
  }

  // LD1: Render DashboardLayout with appropriate title and breadcrumbs
  // LD1: Render DndProvider to enable drag and drop functionality
  // LD1: Render KFFMToolbar with view-only actions
  // LD1: Render ViewContainer with appropriate layout
  // LD1: Render DragAndDropCanvas with nodes, connections, and event handlers in VIEW mode
  // LD1: Render FunctionNodeDetails when a node is selected with readOnly set to true
  // LD1: Render loading spinner when data is loading
  // LD1: Render error message when data loading fails
  return (
    <DashboardLayout title="KFFM View" showBreadcrumbs={true}>
      <ViewContainer>
        <CanvasContainer>
          {nodes && connections && kffm && (
            <DragAndDropCanvas
              kffmId={kffmId || ''}
              nodes={nodes}
              connections={connections}
              editorMode={KFFMEditorMode.VIEW}
              onNodeAdd={handleNodeAdd}
              onNodeSelect={handleNodeSelect}
              onNodeMove={() => { }}
              onConnectionSelect={handleConnectionSelect}
              onConnectionCreate={() => { }}
              selectedNodeId={selectedNodeId || ''}
              selectedConnectionId={selectedConnectionId || ''}
            />
          )}
        </CanvasContainer>
        <SidebarContainer>
          {selectedNodeId && nodes ? (
            <FunctionNodeDetails
              node={nodes.find(node => node.id === selectedNodeId) as KFFMNode}
              onEdit={handleEditRedirect}
              onDelete={handleDelete}
              readOnly={true}
            />
          ) : (
            <div>Select a node to view details</div>
          )}
        </SidebarContainer>
      </ViewContainer>
    </DashboardLayout>
  );
};

export default KFFMViewPage;