import { Badge, EmptyState, SkeletonList, Table, Tbody, Td, Th, Thead, Tr } from '../../../components/ui';
import { useAdminData } from '../AdminDataContext';

export function DeliveryPartnersPage() {
  const { users, orders, isLoading } = useAdminData();
  const partners = users.filter((user) => user.role === 'DELIVERY_PARTNER');

  return (
    <section>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Delivery partners ({partners.length})</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">Registered delivery partners and their delivered order counts.</p>

      {isLoading ? (
        <SkeletonList rows={4} />
      ) : partners.length === 0 ? (
        <EmptyState title="No delivery partners yet" />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Deliveries completed</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {partners.map((partner) => (
              <Tr key={partner.id}>
                <Td className="font-medium">{partner.name}</Td>
                <Td className="text-[var(--text-secondary)]">{partner.email}</Td>
                <Td>{orders.filter((order) => order.deliveryPartner?.id === partner.id && order.status === 'DELIVERED').length}</Td>
                <Td>
                  <Badge tone={partner.isActive ? 'success' : 'neutral'}>{partner.isActive ? 'Active' : 'Inactive'}</Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </section>
  );
}
