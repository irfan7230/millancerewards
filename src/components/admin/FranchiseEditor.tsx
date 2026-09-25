// =============================================================================
// FranchiseEditor — one dialog for BOTH creating and editing a franchise.
// - No `franchise` prop  → create mode  (franchiseService.createFranchise)
// - `franchise` provided → edit mode    (franchiseService.updateFranchise)
// Emits the created/updated franchise via onSaved so parents update reactively.
// Business logic stays in the service; this component only handles the form.
// =============================================================================
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { franchiseService } from '@/services/franchise.service';
import { useToast } from '@/stores/uiStore';
import type { Franchise, NewFranchiseInput } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Franchise name required'),
  ownerName: z.string().min(2, 'Owner name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().regex(/^\d{10}$/, 'Enter a 10-digit phone'),
  city: z.string().min(2, 'City required'),
  ownerPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
  status: z.enum(['active', 'suspended']),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  franchise?: Franchise | null; // present → edit mode
  onClose: () => void;
  onSaved: (franchise: Franchise, mode: 'create' | 'edit') => void;
}

export function FranchiseEditor({ open, franchise, onClose, onSaved }: Props) {
  const toast = useToast();
  const isEdit = !!franchise;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active' },
  });

  // Sync the form with the target franchise whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    if (franchise) {
      reset({
        name: franchise.name,
        ownerName: franchise.ownerName,
        email: franchise.email,
        phone: franchise.phone,
        city: franchise.city,
        status: franchise.status,
      });
    } else {
      reset({ name: '', ownerName: '', email: '', phone: '', city: '', status: 'active' });
    }
  }, [open, franchise, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit && franchise) {
        const updated = await franchiseService.updateFranchise(franchise.id, data);
        toast.success('Franchise updated', updated.name);
        onSaved(updated, 'edit');
      } else {
        // Create mode: password is required
        if (!data.ownerPassword) {
          toast.error('Create failed', 'Owner password is required');
          return;
        }
        const created = await franchiseService.createFranchise(data as NewFranchiseInput);
        // status defaults to active on create; apply chosen status if suspended.
        const final = data.status === 'suspended'
          ? await franchiseService.updateFranchise(created.id, { status: 'suspended' })
          : created;
        toast.success('Franchise created', final.name);
        onSaved(final, 'create');
      }
      onClose();
    } catch (e) {
      toast.error(isEdit ? 'Update failed' : 'Create failed', e instanceof Error ? e.message : 'Unknown');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Franchise' : 'Create New Franchise'}
      description={isEdit ? 'Update this franchise’s details and status.' : 'Register a new franchise tenant.'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input {...register('name')} label="Franchise Name" placeholder="Millance Mumbai" error={errors.name?.message} />
          <Input {...register('ownerName')} label="Owner Name" placeholder="Rajesh Mehta" error={errors.ownerName?.message} />
        </div>
        <Input {...register('email')} type="email" label="Email" placeholder="franchise@example.com" error={errors.email?.message} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input {...register('phone')} label="Phone" placeholder="9876543210" error={errors.phone?.message} />
          <Input {...register('city')} label="City" placeholder="Mumbai" error={errors.city?.message} />
        </div>
        {!isEdit && (
          <Input
            {...register('ownerPassword')}
            type="password"
            label="Owner Password"
            placeholder="Minimum 8 characters"
            helperText="The owner will use this to log in"
            error={errors.ownerPassword?.message}
          />
        )}
        <Select {...register('status')} label="Status" error={errors.status?.message}>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </Select>
      </form>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
          {isEdit ? 'Save Changes' : 'Create Franchise'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
