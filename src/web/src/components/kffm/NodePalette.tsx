import React from 'react';
import styled from 'styled-components'; // version ^5.x
import { useDrag } from 'react-dnd'; // version ^16.x
import { FaBuilding, FaCogs, FaProjectDiagram } from 'react-icons/fa'; // version ^4.x

import { NodeType, KFFMEditorMode, DragItem } from '../../types/kffm.types';
import Card from '../common/Card';
import IconButton from '../common/IconButton';
import Tooltip from '../common/Tooltip';

/**
 * Props for the NodePalette component
 */
interface NodePaletteProps {
  /** Current mode of the editor (VIEW or EDIT) */
  editorMode: KFFMEditorMode;
  /** Function to handle adding a new node when dropped on the canvas */
  onNodeAdd: (nodeType: NodeType, position: { x: number, y: number }) => void;
}

/**
 * Props for the DraggableNodeItem component
 */
interface DraggableNodeItemProps {
  /** Type of node (DEPARTMENT, FUNCTION, PROCESS) */
  nodeType: NodeType;
  /** Icon component to display for this node type */
  icon: React.ReactNode;
  /** Text label for this node type */
  label: string;
  /** Tooltip description of this node type */
  description: string;
  /** Whether the node can be dragged */
  isDraggable: boolean;
  /** Function to call when node is dropped on canvas */
  onNodeAdd: (nodeType: NodeType, position: { x: number, y: number }) => void;
}

/**
 * Details for a specific node type
 */
interface NodeTypeDetails {
  /** Icon component to display */
  icon: React.ReactNode;
  /** Text label */
  label: string;
  /** Description for tooltip */
  description: string;
}

// Styled components
const PaletteContainer = styled.div`
  width: 100%;
  background-color: ${props => props.theme.colors?.background?.primary};
`;

const PaletteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const PaletteTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme.colors?.text?.primary};
`;

const PaletteContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const NodeItemContainer = styled.div<{ isDraggable: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  background-color: ${props => props.theme.colors?.surface?.default};
  border: 1px solid ${props => props.theme.colors?.border?.light};
  transition: all 0.2s ease;
  
  ${props => props.isDraggable && `
    cursor: grab;
    
    &:hover {
      background-color: ${props.theme.colors?.surface?.hover};
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    &:active {
      cursor: grabbing;
    }
  `}
  
  ${props => !props.isDraggable && `
    opacity: 0.7;
    cursor: not-allowed;
  `}
`;

const NodeItemIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background-color: ${props => props.theme.colors?.background?.secondary};
  color: ${props => props.theme.colors?.primary[500]};
  font-size: 20px;
`;

const NodeItemLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors?.text?.primary};
`;

const DragPreview = styled.div`
  padding: 8px;
  border-radius: 4px;
  background-color: ${props => props.theme.colors?.primary[500]};
  color: white;
  font-size: 12px;
  opacity: 0.9;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
`;

/**
 * Helper function to get icon, label and description for a node type
 */
const getNodeTypeDetails = (nodeType: NodeType): NodeTypeDetails => {
  switch (nodeType) {
    case NodeType.DEPARTMENT:
      return {
        icon: <FaBuilding />,
        label: 'Department',
        description: 'A major organizational unit like Marketing, Finance, or Operations.'
      };
    case NodeType.FUNCTION:
      return {
        icon: <FaCogs />,
        label: 'Function',
        description: 'A specific function or capability within a department.'
      };
    case NodeType.PROCESS:
      return {
        icon: <FaProjectDiagram />,
        label: 'Process',
        description: 'A workflow that connects multiple functions or departments.'
      };
    default:
      return {
        icon: <FaBuilding />,
        label: 'Unknown',
        description: 'Unknown node type'
      };
  }
};

/**
 * A component that renders a draggable node template for a specific node type
 */
const DraggableNodeItem: React.FC<DraggableNodeItemProps> = ({
  nodeType,
  icon,
  label,
  description,
  isDraggable,
  onNodeAdd
}) => {
  // Generate a unique ID for the drag item
  const id = `node-${nodeType}-${Math.random().toString(36).substring(2, 9)}`;
  
  // Set up drag functionality using useDrag hook
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'NODE',
    item: {
      type: 'NODE',
      id,
      nodeType,
      position: { x: 0, y: 0 }
    } as DragItem,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    }),
    canDrag: isDraggable,
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && dropResult) {
        const clientOffset = monitor.getClientOffset();
        if (clientOffset) {
          onNodeAdd(item.nodeType, {
            x: clientOffset.x,
            y: clientOffset.y
          });
        }
      }
    }
  }), [nodeType, isDraggable, onNodeAdd]);

  return (
    <Tooltip content={description}>
      <NodeItemContainer
        ref={drag}
        isDraggable={isDraggable}
        style={{ opacity: isDragging ? 0.5 : 1 }}
        role="button"
        aria-disabled={!isDraggable}
        aria-label={`Add ${label} node`}
      >
        <NodeItemIcon>{icon}</NodeItemIcon>
        <NodeItemLabel>{label}</NodeItemLabel>
      </NodeItemContainer>
    </Tooltip>
  );
};

/**
 * A component that provides a palette of draggable node types for the KFFM editor
 */
const NodePalette: React.FC<NodePaletteProps> = ({ editorMode, onNodeAdd }) => {
  const isEditMode = editorMode === KFFMEditorMode.EDIT;
  
  return (
    <Card 
      title="FUNCTION PALETTE" 
      actions={
        <IconButton
          icon={<span>?</span>}
          variant="TERTIARY"
          size="SMALL"
          text
          tooltip="Drag items onto the canvas to create new nodes"
          aria-label="Function palette help"
        />
      }
    >
      <PaletteContainer>
        <PaletteContent>
          {Object.values(NodeType).map(nodeType => {
            const { icon, label, description } = getNodeTypeDetails(nodeType);
            return (
              <DraggableNodeItem
                key={nodeType}
                nodeType={nodeType}
                icon={icon}
                label={label}
                description={description}
                isDraggable={isEditMode}
                onNodeAdd={onNodeAdd}
              />
            );
          })}
        </PaletteContent>
      </PaletteContainer>
    </Card>
  );
};

export default NodePalette;