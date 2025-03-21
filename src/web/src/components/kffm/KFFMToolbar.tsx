import React, { useState, useCallback } from 'react'; // version ^19.x
import styled from 'styled-components'; // version ^5.x
import { FaEdit, FaEye, FaSave, FaUndo, FaRedo, FaPlus, FaMinus, FaExpand, FaTrash, FaDownload, FaShare } from 'react-icons/fa'; // version ^4.x

import { KFFMEditorMode } from '../../types/kffm.types';
import Button from '../common/Button';
import IconButton from '../common/IconButton';
import Tooltip from '../common/Tooltip';
import useKFFM from '../../hooks/useKFFM';
import useResponsive from '../../hooks/useResponsive';

/**
 * Interface defining the props for the KFFMToolbar component
 */
interface KFFMToolbarProps {
  kffmId: string;
  editorMode: KFFMEditorMode;
  onModeChange: (mode: KFFMEditorMode) => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onExport: () => void;
  onShare: () => void;
  onDelete: () => void;
  hasSelection: boolean;
}

/**
 * Styled component for the toolbar container
 */
const ToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f9f9f9;
  padding: 8px 16px;
  border-bottom: 1px solid #ddd;
`;

/**
 * Styled component for grouping toolbar buttons
 */
const ToolbarGroup = styled.div`
  display: flex;
  align-items: center;
`;

/**
 * Styled component for a vertical divider between toolbar button groups
 */
const ToolbarDivider = styled.div`
  width: 1px;
  height: 24px;
  background-color: #ddd;
  margin: 0 8px;
`;

/**
 * Styled component to display the current zoom level
 */
const ZoomDisplay = styled.div`
  font-size: 14px;
  margin: 0 8px;
`;

/**
 * Styled component for responsive icon buttons
 */
const ResponsiveIconButton = styled(IconButton)`
  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
`;

/**
 * The main component that renders a toolbar for the KFFM editor
 */
const KFFMToolbar: React.FC<KFFMToolbarProps> = ({
  kffmId,
  editorMode,
  onModeChange,
  onSave,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onExport,
  onShare,
  onDelete,
  hasSelection,
}) => {
  // Get responsive breakpoint information using useResponsive hook
  const { isMobileView } = useResponsive();

  // Determine which buttons to show based on screen size and editor mode
  const showFullToolbar = !isMobileView;

  // Render toolbar container with appropriate styling
  return (
    <ToolbarContainer>
      <ToolbarGroup>
        {/* Render mode toggle button (Edit/View) */}
        <Tooltip content={editorMode === KFFMEditorMode.EDIT ? 'View Mode' : 'Edit Mode'}>
          <IconButton
            icon={editorMode === KFFMEditorMode.EDIT ? <FaEye /> : <FaEdit />}
            onClick={() =>
              onModeChange(
                editorMode === KFFMEditorMode.EDIT
                  ? KFFMEditorMode.VIEW
                  : KFFMEditorMode.EDIT
              )
            }
          />
        </Tooltip>

        {/* Render save button when in edit mode */}
        {editorMode === KFFMEditorMode.EDIT && (
          <Tooltip content="Save Changes">
            <IconButton icon={<FaSave />} onClick={onSave} />
          </Tooltip>
        )}
      </ToolbarGroup>

      {showFullToolbar && (
        <>
          <ToolbarDivider />

          <ToolbarGroup>
            {/* Render undo/redo buttons when in edit mode */}
            {editorMode === KFFMEditorMode.EDIT && (
              <>
                <Tooltip content="Undo">
                  <IconButton
                    icon={<FaUndo />}
                    onClick={onUndo}
                    disabled={!canUndo}
                  />
                </Tooltip>
                <Tooltip content="Redo">
                  <IconButton
                    icon={<FaRedo />}
                    onClick={onRedo}
                    disabled={!canRedo}
                  />
                </Tooltip>
              </>
            )}
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup>
            {/* Render zoom controls (zoom in, zoom out, reset zoom) */}
            <Tooltip content="Zoom In">
              <IconButton icon={<FaPlus />} onClick={onZoomIn} />
            </Tooltip>
            <Tooltip content="Zoom Out">
              <IconButton icon={<FaMinus />} onClick={onZoomOut} />
            </Tooltip>
            <ZoomDisplay>{Math.round(zoom * 100)}%</ZoomDisplay>
            <Tooltip content="Reset Zoom">
              <IconButton icon={<FaExpand />} onClick={onZoomReset} />
            </Tooltip>
          </ToolbarGroup>

          <ToolbarDivider />
        </>
      )}

      <ToolbarGroup>
        {/* Render delete button when an element is selected and in edit mode */}
        {editorMode === KFFMEditorMode.EDIT && hasSelection && (
          <Tooltip content="Delete Selected Element">
            <IconButton icon={<FaTrash />} onClick={onDelete} severity="danger" />
          </Tooltip>
        )}

        {/* Render export and share buttons */}
        <Tooltip content="Export KFFM">
          <IconButton icon={<FaDownload />} onClick={onExport} />
        </Tooltip>
        <Tooltip content="Share KFFM">
          <IconButton icon={<FaShare />} onClick={onShare} />
        </Tooltip>
      </ToolbarGroup>
    </ToolbarContainer>
  );
};

export default KFFMToolbar;

/**
 * Styled component for the toolbar container
 */
const ToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f9f9f9;
  padding: 8px 16px;
  border-bottom: 1px solid #ddd;
`;

/**
 * Styled component for grouping toolbar buttons
 */
const ToolbarGroup = styled.div`
  display: flex;
  align-items: center;
`;

/**
 * Styled component for a vertical divider between toolbar button groups
 */
const ToolbarDivider = styled.div`
  width: 1px;
  height: 24px;
  background-color: #ddd;
  margin: 0 8px;
`;

/**
 * Styled component to display the current zoom level
 */
const ZoomDisplay = styled.div`
  font-size: 14px;
  margin: 0 8px;
`;

/**
 * Styled component for responsive icon buttons
 */
const ResponsiveIconButton = styled(IconButton)`
  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
`;