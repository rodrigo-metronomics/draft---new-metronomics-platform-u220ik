import React, { useState, useEffect } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.10

import { KFFMNode, NodeType, MetricReference, KFFMConnection } from '../../types/kffm.types'; // Type definitions for KFFM nodes and related entities
import Card from '../common/Card'; // UI component for containing the node details
import Badge from '../common/Badge'; // UI component for displaying node type and metric types
import Button from '../common/Button'; // UI component for action buttons
import useKFFM from '../../hooks/useKFFM'; // Custom hook for KFFM operations

/**
 * Interface defining the props for the FunctionNodeDetails component
 */
interface FunctionNodeDetailsProps {
  /** KFFMNode object to display details for */
  node: KFFMNode;
  /** Callback function when Edit button is clicked */
  onEdit: () => void;
  /** Callback function when Delete button is clicked */
  onDelete: () => void;
  /** Boolean flag indicating if the node is in read-only mode */
  readOnly: boolean;
}

/**
 * Component that displays detailed information about a selected KFFM node
 */
const FunctionNodeDetails: React.FC<FunctionNodeDetailsProps> = ({ node, onEdit, onDelete, readOnly }) => {
  // Destructure props to access node data and callbacks
  const { title, description, type, owner, metrics, outgoingConnections, incomingConnections } = node;

  // Use useKFFM hook to access KFFM operations
  const {  } = useKFFM();

  /**
   * Helper function to determine badge color based on node type
   * @param nodeType 
   * @returns 
   */
  const getNodeTypeBadgeColor = (nodeType: NodeType): string => {
    switch (nodeType) {
      case NodeType.DEPARTMENT:
        return 'primary';
      case NodeType.FUNCTION:
        return 'secondary';
      case NodeType.PROCESS:
        return 'success';
      default:
        return 'info';
    }
  };

  /**
   * Helper function to format connections list for display
   * @param connections 
   * @returns 
   */
  const formatConnectionsList = (connections: KFFMConnection[]): string => {
    if (!connections || connections.length === 0) {
      return 'None';
    }
    const connectionTitles = connections.map(conn => conn.label);
    return connectionTitles.join(', ');
  };

  // Render Card component with node title as header
  return (
    <Card title={title}
      actions={
        !readOnly && (
          <ButtonGroup>
            <Button label="Edit" onClick={onEdit} />
            <Button label="Delete" severity="danger" outlined onClick={onDelete} />
          </ButtonGroup>
        )
      }
    >
      <DetailsContainer>
        {/* Display node type badge in the header */}
        <DetailSection>
          <SectionTitle>Type</SectionTitle>
          <SectionContent>
            <Badge value={type} severity={getNodeTypeBadgeColor(type)} />
          </SectionContent>
        </DetailSection>

        {/* Display node description in the content section */}
        <DetailSection>
          <SectionTitle>Description</SectionTitle>
          <SectionContent>{description || 'No description available.'}</SectionContent>
        </DetailSection>

        {/* Display node owner information if available */}
        {owner && (
          <DetailSection>
            <SectionTitle>Owner</SectionTitle>
            <SectionContent>
              <OwnerInfo>
                {owner.name}
              </OwnerInfo>
            </SectionContent>
          </DetailSection>
        )}

        {/* Display associated metrics list if available */}
        {metrics && metrics.length > 0 && (
          <DetailSection>
            <SectionTitle>Metrics</SectionTitle>
            <SectionContent>
              <MetricsList>
                {metrics.map(metric => (
                  <MetricItem key={metric.id}>
                    {metric.name}
                  </MetricItem>
                ))}
              </MetricsList>
            </SectionContent>
          </DetailSection>
        )}

        {/* Display incoming and outgoing connections if available */}
        <DetailSection>
          <SectionTitle>Incoming Connections</SectionTitle>
          <SectionContent>
            <ConnectionsList>
              <ConnectionItem>{formatConnectionsList(incomingConnections)}</ConnectionItem>
            </ConnectionsList>
          </SectionContent>
        </DetailSection>

        <DetailSection>
          <SectionTitle>Outgoing Connections</SectionTitle>
          <SectionContent>
            <ConnectionsList>
              <ConnectionItem>{formatConnectionsList(outgoingConnections)}</ConnectionItem>
            </ConnectionsList>
          </SectionContent>
        </DetailSection>
      </DetailsContainer>
    </Card>
  );
};

export default FunctionNodeDetails;

/**
 * Styled components for the FunctionNodeDetails component
 */
const DetailsContainer = styled.div`
  padding: 16px;
`;

const DetailSection = styled.div`
  margin-bottom: 16px;
`;

const SectionTitle = styled.h4`
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 8px;
`;

const SectionContent = styled.div`
  font-size: 0.875rem;
`;

const MetricsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const MetricItem = styled.li`
  margin-bottom: 4px;
`;

const ConnectionsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ConnectionItem = styled.li`
  margin-bottom: 4px;
`;

const OwnerInfo = styled.div`
  display: flex;
  align-items: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;