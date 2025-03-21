import React, { useState, useRef, useEffect, useCallback } from 'react'; // react@^18.2.0
import styled from 'styled-components'; // styled-components@^5.3.10
import { useDrop, useDragLayer } from 'react-dnd'; // react-dnd@^16.0.0
import { HTML5Backend } from 'react-dnd-html5-backend'; // react-dnd-html5-backend@^16.0.0
import { DndProvider } from 'react-dnd'; // react-dnd@^16.0.0
import { FaPlus, FaMinus, FaExpand, FaArrowsAlt, FaLink } from 'react-icons/fa'; // react-icons/fa@^4.0.0

import {
  KFFMNode,
  KFFMConnection,
  NodeType,
  KFFMEditorMode,
  DragItem,
  ConnectionPoint,
  CanvasPosition
} from '../../types/kffm.types';
import { useKFFM } from '../../hooks/useKFFM';
import Button from '../common/Button';
import IconButton from '../common/IconButton';
import NodePalette from './NodePalette';

/**
 * Interface defining the props for the DragAndDropCanvas component
 */
interface DragAndDropCanvasProps {
  kffmId: string;
  nodes: KFFMNode[];
  connections: KFFMConnection[];
  editorMode: KFFMEditorMode;
  onNodeAdd: (nodeType: NodeType, position: { x: number, y: number }) => void;
  onNodeSelect: (nodeId: string) => void;
  onNodeMove: (nodeId: string, position: { x: number, y: number }) => void;
  onConnectionSelect: (connectionId: string) => void;
  onConnectionCreate: (sourceNodeId: string, targetNodeId: string) => void;
  selectedNodeId: string;
  selectedConnectionId: string;
}

/**
 * Interface defining the props for the CanvasNode component
 */
interface CanvasNodeProps {
  node: KFFMNode;
  isSelected: boolean;
  editorMode: KFFMEditorMode;
  position: { x: number, y: number };
  onClick: (nodeId: string) => void;
  onDrag: (nodeId: string, position: { x: number, y: number }) => void;
  onConnectionStart: (nodeId: string, position: { x: number, y: number }) => void;
  onConnectionEnd: (nodeId: string) => void;
}

/**
 * Interface defining the props for the CanvasConnection component
 */
interface CanvasConnectionProps {
  connection: KFFMConnection;
  isSelected: boolean;
  editorMode: KFFMEditorMode;
  sourcePosition: { x: number, y: number };
  targetPosition: { x: number, y: number };
  onClick: (connectionId: string) => void;
}

/**
 * Interface defining the props for the CanvasControls component
 */
interface CanvasControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onTogglePanMode: () => void;
  isPanModeActive: boolean;
}

/**
 * Styled component for the canvas container
 */
const CanvasContainer = styled.div`
  position: relative;
  width: 100%;
  height: 800px;
  overflow: hidden;
  background: #f0f0f0;
  cursor: grab;
`;

/**
 * Styled component for the inner canvas content
 */
const CanvasContent = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-origin: top left;
  transform: scale(1);
`;

/**
 * Styled component for a node container
 */
const NodeContainer = styled.div<{ type: NodeType; isSelected: boolean }>`
  position: absolute;
  border: 2px solid ${props => props.isSelected ? 'blue' : 'transparent'};
  border-radius: 5px;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  cursor: pointer;
`;

/**
 * Styled component for a node header
 */
const NodeHeader = styled.div<{ type: NodeType }>`
  padding: 8px;
  background-color: ${props =>
    props.type === NodeType.DEPARTMENT ? 'lightblue' :
    props.type === NodeType.FUNCTION ? 'lightgreen' :
    'lightcoral'};
  border-radius: 3px 3px 0 0;
`;

/**
 * Styled component for a node title
 */
const NodeTitle = styled.h4`
  margin: 0;
  font-size: 14px;
`;

/**
 * Styled component for a node content
 */
const NodeContent = styled.div`
  padding: 8px;
`;

/**
 * Styled component for a node description
 */
const NodeDescription = styled.p`
  margin: 0;
  font-size: 12px;
`;

/**
 * Styled component for a node owner
 */
const NodeOwner = styled.div`
  font-size: 10px;
  color: gray;
`;

/**
 * Styled component for a connection point
 */
const ConnectionPoint = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: black;
  position: absolute;
  cursor: crosshair;
`;

/**
 * Styled component for a connection path
 */
const ConnectionPath = styled.path`
  fill: none;
  stroke: black;
  stroke-width: 2;
`;

/**
 * Styled component for a connection label
 */
const ConnectionLabel = styled.text`
  font-size: 10px;
`;

/**
 * Styled component for the controls container
 */
const ControlsContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  padding: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

/**
 * Styled component for the zoom display
 */
const ZoomDisplay = styled.div`
  font-size: 12px;
  margin-top: 5px;
`;

/**
 * Styled component for the drag preview
 */
const DragPreview = styled.div`
  background-color: white;
  padding: 10px;
  border: 1px dashed gray;
`;

/**
 * Helper function to calculate node position considering canvas position and zoom
 */
const calculateNodePosition = (node: KFFMNode, canvasPosition: CanvasPosition, zoom: number) => {
  return {
    x: (node.positionX + canvasPosition.x) * zoom,
    y: (node.positionY + canvasPosition.y) * zoom,
  };
};

/**
 * Helper function to calculate the SVG path for a connection between nodes
 */
const calculateConnectionPath = (sourcePosition: { x: number, y: number }, targetPosition: { x: number, y: number }) => {
  const controlPointDistance = Math.abs(targetPosition.x - sourcePosition.x) / 2;
  const controlPoint1 = { x: sourcePosition.x + controlPointDistance, y: sourcePosition.y };
  const controlPoint2 = { x: targetPosition.x - controlPointDistance, y: targetPosition.y };

  return `M${sourcePosition.x},${sourcePosition.y} C${controlPoint1.x},${controlPoint1.y} ${controlPoint2.x},${controlPoint2.y} ${targetPosition.x},${targetPosition.y}`;
};

/**
 * Component that renders a node on the canvas
 */
const CanvasNode: React.FC<CanvasNodeProps> = ({ node, isSelected, editorMode, position, onClick, onDrag, onConnectionStart, onConnectionEnd }) => {
  const { x, y } = position;

  return (
    <NodeContainer
      type={node.type}
      isSelected={isSelected}
      style={{ left: x, top: y }}
      onClick={() => onClick(node.id)}
    >
      <NodeHeader type={node.type}>
        <NodeTitle>{node.title}</NodeTitle>
      </NodeHeader>
      <NodeContent>
        <NodeDescription>{node.description}</NodeDescription>
        <NodeOwner>Owned by: {node.owner?.name}</NodeOwner>
      </NodeContent>
    </NodeContainer>
  );
};

/**
 * Component that renders a connection between nodes on the canvas
 */
const CanvasConnection: React.FC<CanvasConnectionProps> = ({ connection, isSelected, editorMode, sourcePosition, targetPosition, onClick }) => {
  const path = calculateConnectionPath(sourcePosition, targetPosition);

  return (
    <ConnectionPath d={path} stroke={isSelected ? 'red' : 'black'} />
  );
};

/**
 * Component that renders zoom and pan controls for the canvas
 */
const CanvasControls: React.FC<CanvasControlsProps> = ({ zoom, onZoomIn, onZoomOut, onZoomReset, onTogglePanMode, isPanModeActive }) => {
  return (
    <ControlsContainer>
      <IconButton icon={<FaPlus />} onClick={onZoomIn} tooltip="Zoom In" ariaLabel="Zoom In" />
      <IconButton icon={<FaMinus />} onClick={onZoomOut} tooltip="Zoom Out" ariaLabel="Zoom Out" />
      <IconButton icon={<FaExpand />} onClick={onZoomReset} tooltip="Reset Zoom" ariaLabel="Reset Zoom" />
      <IconButton icon={<FaArrowsAlt />} onClick={onTogglePanMode} tooltip={isPanModeActive ? "Disable Pan Mode" : "Enable Pan Mode"} ariaLabel={isPanModeActive ? "Disable Pan Mode" : "Enable Pan Mode"} />
      <ZoomDisplay>Zoom: {(zoom * 100).toFixed(0)}%</ZoomDisplay>
    </ControlsContainer>
  );
};

/**
 * Component that renders a custom preview for dragged items
 */
const CustomDragLayer = () => {
  return null;
};

/**
 * Main component that renders an interactive canvas for the KFFM editor
 */
const DragAndDropCanvas: React.FC<DragAndDropCanvasProps> = ({
  kffmId,
  nodes,
  connections,
  editorMode,
  onNodeAdd,
  onNodeSelect,
  onNodeMove,
  onConnectionSelect,
  onConnectionCreate,
  selectedNodeId,
  selectedConnectionId
}) => {
  // Canvas state using custom hook
  const { position, zoom, pan, zoomFn, reset } = useKFFM().useCanvasState({ x: 0, y: 0 });

  // Canvas ref for DOM manipulation
  const canvasRef = useRef<HTMLDivElement>(null);

  // Drop target setup
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'NODE',
    drop: (item: DragItem, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (clientOffset) {
        onNodeAdd(item.nodeType, {
          x: clientOffset.x,
          y: clientOffset.y
        });
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  // Drag layer setup
  const { itemType, isDragging } = useDragLayer((monitor) => ({
    itemType: monitor.getItemType(),
    isDragging: monitor.isDragging(),
  }));

  // Handlers for canvas interactions
  const handleCanvasClick = useCallback(() => {
    onNodeSelect(null);
    onConnectionSelect(null);
  }, [onNodeSelect, onConnectionSelect]);

  const handleNodeClick = useCallback((nodeId: string) => {
    onNodeSelect(nodeId);
    onConnectionSelect(null);
  }, [onNodeSelect, onConnectionSelect]);

  const handleNodeDrag = useCallback((nodeId: string, newPosition: { x: number, y: number }) => {
    onNodeMove(nodeId, newPosition);
  }, [onNodeMove]);

  const handleNodeDrop = useCallback((nodeId: string) => {
    // Implement node drop logic here
  }, []);

  const handleConnectionStart = useCallback((sourceNodeId: string, position: { x: number, y: number }) => {
    // Implement connection start logic here
  }, []);

  const handleConnectionEnd = useCallback((targetNodeId: string) => {
    // Implement connection end logic here
  }, []);

  const handleCanvasPan = useCallback((deltaX: number, deltaY: number) => {
    pan(deltaX, deltaY);
  }, [pan]);

  const handleZoomIn = useCallback(() => {
    zoomFn(1.1);
  }, [zoomFn]);

  const handleZoomOut = useCallback(() => {
    zoomFn(0.9);
  }, [zoomFn]);

  const handleZoomReset = useCallback(() => {
    reset();
  }, [reset]);

  const [isPanModeActive, setIsPanModeActive] = useState(false);

  const handleTogglePanMode = useCallback(() => {
    setIsPanModeActive(prev => !prev);
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: 'flex' }}>
        {editorMode === KFFMEditorMode.EDIT && (
          <NodePalette editorMode={editorMode} onNodeAdd={onNodeAdd} />
        )}

        <CanvasContainer ref={drop} onClick={handleCanvasClick}>
          <CanvasContent style={{ transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)` }}>
            {connections.map(connection => {
              const sourceNode = nodes.find(node => node.id === connection.sourceNodeId);
              const targetNode = nodes.find(node => node.id === connection.targetNodeId);

              if (!sourceNode || !targetNode) return null;

              const sourcePosition = calculateNodePosition(sourceNode, position, zoom);
              const targetPosition = calculateNodePosition(targetNode, position, zoom);

              return (
                <CanvasConnection
                  key={connection.id}
                  connection={connection}
                  isSelected={connection.id === selectedConnectionId}
                  editorMode={editorMode}
                  sourcePosition={sourcePosition}
                  targetPosition={targetPosition}
                  onClick={onConnectionSelect}
                />
              );
            })}

            {nodes.map(node => {
              const nodePosition = calculateNodePosition(node, position, zoom);

              return (
                <CanvasNode
                  key={node.id}
                  node={node}
                  isSelected={node.id === selectedNodeId}
                  editorMode={editorMode}
                  position={nodePosition}
                  onClick={handleNodeClick}
                  onDrag={handleNodeDrag}
                  onConnectionStart={handleConnectionStart}
                  onConnectionEnd={handleConnectionEnd}
                />
              );
            })}
          </CanvasContent>

          <CanvasControls
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
            onTogglePanMode={handleTogglePanMode}
            isPanModeActive={isPanModeActive}
          />
        </CanvasContainer>
      </div>
    </DndProvider>
  );
};

export default DragAndDropCanvas;