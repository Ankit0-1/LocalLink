import { Badge, EmptyState, SkeletonList, Table, Tbody, Td, Th, Thead, Tr } from '../../../components/ui';
import { useAdminData } from '../AdminDataContext';

export function StoresPage() {
  const { stores, isLoading } = useAdminData();

  return (
    <section>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Stores ({stores.length})</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">Every store on the platform.</p>

      {isLoading ? (
        <SkeletonList rows={5} />
      ) : stores.length === 0 ? (
        <EmptyState title="No stores yet" />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Store</Th>
              <Th>Vendor</Th>
              <Th>Address</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {stores.map((store) => (
              <Tr key={store.id}>
                <Td className="font-medium">{store.name}</Td>
                <Td className="text-[var(--text-secondary)]">{store.vendor.name}</Td>
                <Td className="text-[var(--text-secondary)]">{store.address ?? 'No address listed'}</Td>
                <Td>
                  <Badge tone={store.isActive ? 'success' : 'neutral'}>{store.isActive ? 'Active' : 'Inactive'}</Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </section>
  );
}
