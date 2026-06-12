// L1, L2, L3 screens for SC hierarchy — routed by params
import { useNavigate, useParams } from 'react-router-dom';
import HierarchyLevel from './HierarchyLevel';
import { L1_NODES, L2_NODES, L3_NODES, L4_NODES } from '../../data/hierarchy';

export function L1Screen() {
  const navigate = useNavigate();
  const { accountId } = useParams();
  const nodes = L1_NODES.filter(n => n.account === accountId);

  return (
    <HierarchyLevel
      title="United Kingdom & Germany"
      levelLabel="Country · L1"
      breadcrumbs={[
        { label: 'Systems', path: '/systems' },
        { label: accountId?.toUpperCase(), path: null },
      ]}
      nodes={nodes}
      onNodeClick={node => navigate(`/systems/${accountId}/${node.id}`)}
    />
  );
}

export function L2Screen() {
  const navigate = useNavigate();
  const { accountId, l1id } = useParams();
  const l1 = L1_NODES.find(n => n.id === l1id);
  const nodes = L2_NODES.filter(n => n.parent === l1id);

  return (
    <HierarchyLevel
      title={l1?.label || 'Region'}
      levelLabel="Region · L2"
      breadcrumbs={[
        { label: 'Systems', path: '/systems' },
        { label: accountId?.toUpperCase(), path: `/systems/${accountId}` },
        { label: l1?.label, path: null },
      ]}
      nodes={nodes}
      onNodeClick={node => navigate(`/systems/${accountId}/${l1id}/${node.id}`)}
    />
  );
}

export function L3Screen() {
  const navigate = useNavigate();
  const { accountId, l1id, l2id } = useParams();
  const l2 = L2_NODES.find(n => n.id === l2id);
  const nodes = L3_NODES.filter(n => n.parent === l2id);

  return (
    <HierarchyLevel
      title={l2?.label || 'Campus'}
      levelLabel="Campus · L3"
      breadcrumbs={[
        { label: 'Systems', path: '/systems' },
        { label: accountId?.toUpperCase(), path: `/systems/${accountId}` },
        { label: l2?.label, path: null },
      ]}
      nodes={nodes}
      onNodeClick={node => navigate(`/systems/${accountId}/${l1id}/${l2id}/${node.id}`)}
    />
  );
}

export function L3toL4Screen() {
  const navigate = useNavigate();
  const { accountId, l1id, l2id, l3id } = useParams();
  const l3 = L3_NODES.find(n => n.id === l3id);
  const nodes = L4_NODES.filter(n => n.parent === l3id);

  return (
    <HierarchyLevel
      title={l3?.label || 'Building'}
      levelLabel="Building · L4"
      breadcrumbs={[
        { label: 'Systems', path: '/systems' },
        { label: accountId?.toUpperCase(), path: `/systems/${accountId}` },
        { label: l3?.label, path: null },
      ]}
      nodes={nodes}
      onNodeClick={node => navigate(`/l4/${node.id}`)}
    />
  );
}
