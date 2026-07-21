import { useEffect, useState } from 'react';
import { Button, EmptyState, SkeletonList, useToast } from '../../../components/ui';
import { PackageIcon } from '../../../components/ui/icons';
import { ApiError } from '../../../lib/apiClient';
import { getSocket } from '../../../lib/socket';
import { acceptJob, listJobs, listMyOrders } from '../api';
import type { Job } from '../types';

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function AvailablePage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  function loadJobs() {
    return listJobs().then(({ jobs: nextJobs }) => setJobs(nextJobs));
  }

  useEffect(() => {
    loadJobs()
      .catch((err) => toast({ title: 'Could not load available jobs', description: messageFor(err, 'Please try again.'), variant: 'error' }))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    function handleChanged() {
      loadJobs().catch(() => {});
    }
    socket.on('delivery:job-offered', handleChanged);
    socket.on('delivery:job-claimed', handleChanged);
    return () => {
      socket.off('delivery:job-offered', handleChanged);
      socket.off('delivery:job-claimed', handleChanged);
    };
  }, []);

  async function handleAccept(job: Job) {
    setAcceptingId(job.id);
    try {
      await acceptJob(job.id);
      await Promise.all([loadJobs(), listMyOrders()]);
      toast({ title: `Accepted the delivery for order ${job.order.id.slice(0, 8)}.`, variant: 'success' });
    } catch (err) {
      toast({ title: 'Could not accept this job', description: messageFor(err, 'It may already be taken.'), variant: 'error' });
      await loadJobs();
    } finally {
      setAcceptingId(null);
    }
  }

  return (
    <section>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Available deliveries</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">Accept a job to start a delivery.</p>

      {isLoading ? (
        <SkeletonList rows={4} />
      ) : jobs.length === 0 ? (
        <EmptyState icon={<PackageIcon className="h-8 w-8" />} title="No jobs waiting" description="No jobs waiting for pickup right now. New jobs will appear here automatically." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <div key={job.id} className="flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-4 shadow-sm">
              <div>
                <strong className="text-sm font-medium text-[var(--text-primary)]">{job.order.store.name}</strong>
                <div className="mt-1 text-sm text-[var(--text-secondary)]">{job.order.store.address ?? 'No address listed'}</div>
                <div className="mt-1 text-sm font-medium text-[var(--text-primary)]">₹{Number(job.order.total).toFixed(2)}</div>
              </div>
              <Button size="sm" isLoading={acceptingId === job.id} onClick={() => void handleAccept(job)}>
                Accept
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
