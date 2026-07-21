import type { FormEvent } from 'react';
import { Button, Drawer, Input, Label, Textarea } from '../../../components/ui';
import type { ProductPayload } from '../types';

interface ProductFormDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  values: ProductPayload;
  onChange: (values: ProductPayload) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  submitLabel: string;
}

export function ProductFormDrawer({ open, onClose, title, values, onChange, onSubmit, isSubmitting, submitLabel }: ProductFormDrawerProps) {
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
          <Button type="submit" form="product-form" isLoading={isSubmitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="product-name">Product name</Label>
          <Input id="product-name" value={values.name} onChange={(event) => onChange({ ...values, name: event.target.value })} required />
        </div>
        <div>
          <Label htmlFor="product-price">Price</Label>
          <Input
            id="product-price"
            type="number"
            min="0.01"
            step="0.01"
            value={values.price || ''}
            onChange={(event) => onChange({ ...values, price: Number(event.target.value) })}
            required
          />
        </div>
        <div>
          <Label htmlFor="product-description">Description</Label>
          <Textarea id="product-description" value={values.description} onChange={(event) => onChange({ ...values, description: event.target.value })} />
        </div>
        <div>
          <Label htmlFor="product-image">Image URL</Label>
          <Input id="product-image" type="url" value={values.image} onChange={(event) => onChange({ ...values, image: event.target.value })} />
        </div>
      </form>
    </Drawer>
  );
}
