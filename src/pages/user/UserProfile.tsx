// =============================================================================
// User Profile — View and edit profile details
// =============================================================================
import { useState, useEffect } from 'react';
import { Mail, Phone, Building2, MapPin, LogOut, User as UserIcon, Calendar, Contact, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { UserStatusBadge } from '@/components/ui/Badge';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { Input, Select } from '@/components/ui/Input';
import { SkeletonUserHome } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/uiStore';
import { userService } from '@/services/user.service';
import { formatDate } from '@/lib/utils';
import type { FranchiseUser } from '@/types';

export default function UserProfile() {
  const { user: authUser, logout, updateUser: updateAuthUser } = useAuthStore();
  const toast = useToast();

  const [user, setUser] = useState<FranchiseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<FranchiseUser>>({});

  useEffect(() => {
    if (!authUser?.id) return;
    userService.getUser(authUser.id)
      .then(setUser)
      .catch((err) => toast.error('Failed to load profile', err.message))
      .finally(() => setLoading(false));
  }, [authUser?.id, toast]);

  if (!authUser) return null;
  if (loading) return <SkeletonUserHome />;
  if (!user) return <div className="p-8 text-center text-neutral-500">Profile not found.</div>;

  const handleEditOpen = () => {
    setFormData({
      name: user.name,
      phone: user.phone || '',
      dob: user.dob || '',
      gender: user.gender || 'other',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      pincode: user.pincode || '',
      pan: user.pan || '',
      nomineeName: user.nomineeName || '',
      nomineeRelation: user.nomineeRelation || '',
    });
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await userService.updateUser(user.id, formData);
      setUser(updated);
      
      // Sync auth session if name or phone changed
      updateAuthUser({ name: updated.name, phone: updated.phone });
      
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to update profile', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="max-w-4xl space-y-6 pb-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-[26px] font-semibold tracking-[-0.025em] text-neutral-950 lg:text-3xl">
          Profile
        </h1>
        <p className="text-sm text-neutral-500">
          Your personal information and account details.
        </p>
      </div>

      {/* Profile Overview */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-xl font-semibold text-brand-700 ring-1 ring-brand-100">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold tracking-tight text-neutral-950">
                  {user.name}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {user.status && <UserStatusBadge status={user.status} />}
                  {user.joinedAt && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-neutral-300" />
                      <span className="text-xs text-neutral-500">
                        Member since {formatDate(user.joinedAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleEditOpen} className="shrink-0">
              Edit profile
            </Button>
          </div>
        </div>

        {/* Contact Details */}
        <div className="border-t border-neutral-100">
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-500 ring-1 ring-neutral-100">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">Email</p>
                <p className="mt-0.5 truncate text-sm font-medium text-neutral-900">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-t border-neutral-100 px-5 py-4 sm:border-l sm:border-t-0 sm:px-6">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-500 ring-1 ring-neutral-100">
                <Phone className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">Phone</p>
                <p className="mt-0.5 truncate text-sm font-medium text-neutral-900">{user.phone || "Not provided"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KYC & Extended Profile */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
        <div className="px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <UserIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-950">Extended Information</h2>
              <p className="mt-0.5 text-xs text-neutral-500">Demographics and compliance details.</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 border-t border-neutral-100 sm:grid-cols-2">
          <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-400">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">Date of Birth</p>
              <p className="mt-0.5 truncate text-sm font-medium text-neutral-900">{user.dob ? formatDate(user.dob) : '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-neutral-100 px-5 py-4 sm:border-l sm:border-t-0 sm:px-6">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-400">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">Location</p>
              <p className="mt-0.5 truncate text-sm font-medium text-neutral-900">{user.city ? `${user.city}, ${user.state}` : '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-neutral-100 px-5 py-4 sm:px-6">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">PAN Number</p>
              <p className="mt-0.5 truncate text-sm font-medium text-neutral-900 font-mono">{user.pan || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-neutral-100 px-5 py-4 sm:border-l sm:px-6">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-400">
              <Contact className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">Nominee</p>
              <p className="mt-0.5 truncate text-sm font-medium text-neutral-900">{user.nomineeName ? `${user.nomineeName} (${user.nomineeRelation})` : '—'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Organization */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
        <div className="px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-950">Franchise & Group</h2>
              <p className="mt-0.5 text-xs text-neutral-500">Your account's organization details.</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 border-t border-neutral-100 sm:grid-cols-2">
          <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-400">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">Franchise</p>
              <p className="mt-0.5 truncate text-sm font-medium text-neutral-900">{user.franchiseId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-neutral-100 px-5 py-4 sm:border-l sm:border-t-0 sm:px-6">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-400">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">Group</p>
              <p className="mt-0.5 truncate text-sm font-medium text-neutral-900">{authUser.groupName || user.groupId}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sign out */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100 sm:px-6"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-500 ring-1 ring-neutral-100">
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-900">Sign out</p>
            <p className="mt-0.5 text-xs text-neutral-500">Sign out of your account on this device.</p>
          </div>
          <LogOut className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
        </button>
      </section>

      {/* Edit Profile Dialog */}
      <Dialog 
        open={isEditing} 
        onClose={() => !isSaving && setIsEditing(false)} 
        title="Edit Profile"
        description="Update your personal and contact details."
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Phone Number"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            />
            <Select
              label="Gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male'|'female'|'other' })}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
          </div>

          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
            <Input
              label="PIN Code"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="PAN Number"
              placeholder="ABCDE1234F"
              value={formData.pan}
              onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
            />
            <div />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-neutral-100 pt-4 mt-2">
            <Input
              label="Nominee Name"
              value={formData.nomineeName}
              onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
            />
            <Input
              label="Nominee Relation"
              placeholder="e.g. Spouse, Child"
              value={formData.nomineeRelation}
              onChange={(e) => setFormData({ ...formData, nomineeRelation: e.target.value })}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSaving}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
