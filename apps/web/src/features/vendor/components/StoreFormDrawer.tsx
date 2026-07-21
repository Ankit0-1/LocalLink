import type { FormEvent } from 'react';
import { Button, Drawer, Input, Label, Textarea } from '../../../components/ui';
import type { StorePayload } from '../types';

interface StoreFormDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  values: StorePayload;
  onChange: (values: StorePayload) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  submitLabel: string;
}

export function StoreFormDrawer({ open, onClose, title, values, onChange, onSubmit, isSubmitting, submitLabel }: StoreFormDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="store-form" isLoading={isSubmitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id="store-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="store-name">Store name</Label>
          <Input id="store-name" value={values.name} onChange={(event) => onChange({ ...values, name: event.target.value })} required />
        </div>
        <div>
          <Label htmlFor="store-description">Description</Label>
          <Textarea id="store-description" value={values.description} onChange={(event) => onChange({ ...values, description: event.target.value })} />
        </div>
        <div>
          <Label htmlFor="store-address">Address</Label>
          <Textarea id="store-address" value={values.address} onChange={(event) => onChange({ ...values, address: event.target.value })} />
        </div>
        <div>
          <Label htmlFor="store-image">Image URL</Label>
          <Input id="store-image" type="url" value={values.image} onChange={(event) => onChange({ ...values, image: event.target.value })} />
        </div>
      </form>
    </Drawer>
  );
}
