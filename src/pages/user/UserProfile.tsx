// =============================================================================
// User Profile — View and edit profile details
// =============================================================================
import React from 'react';
import { Mail, Phone, Building2, MapPin, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { UserStatusBadge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/stores/uiStore';

export default function UserProfile() {
  const { user, logout } = useAuthStore();
  const toast = useToast();

  if (!user) return null;

  const handleEdit = () => {
    toast.info('Profile editing is disabled in this demo.');
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
    <section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {/* Avatar */}
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

          <Button
            variant="secondary"
            size="sm"
            onClick={handleEdit}
            className="shrink-0"
          >
            Edit profile
          </Button>
        </div>
      </div>

      {/* Contact Details */}
      <div className="border-t border-neutral-100">
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Email */}
          <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-500 ring-1 ring-neutral-100">
              <Mail className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">
                Email
              </p>
              <p className="mt-0.5 truncate text-sm font-medium text-neutral-900">
                {user.email}
              </p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3 border-t border-neutral-100 px-5 py-4 sm:border-l sm:border-t-0 sm:px-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-500 ring-1 ring-neutral-100">
              <Phone className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">
                Phone
              </p>
              <p className="mt-0.5 truncate text-sm font-medium text-neutral-900">
                {user.phone || "Not provided"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Organization */}
    <section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
      <div className="px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
            <Building2 className="h-4 w-4" />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-neutral-950">
              Franchise & Group
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              Your account's organization details.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-neutral-100 sm:grid-cols-2">
        {/* Franchise */}
        <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-400">
            <Building2 className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">
              Franchise
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-neutral-900">
              {user.franchiseId}
            </p>
          </div>
        </div>

        {/* Group */}
        <div className="flex items-center gap-3 border-t border-neutral-100 px-5 py-4 sm:border-l sm:border-t-0 sm:px-6">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-400">
            <MapPin className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">
              Group
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-neutral-900">
              {user.groupName || user.groupId}
            </p>
          </div>
        </div>
      </div>
    </section>

        {/* Sign out */}
    <section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100 sm:px-6"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-500 ring-1 ring-neutral-100">
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-900">
            Sign out
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Sign out of your account on this device.
          </p>
        </div>

        <LogOut
          className="h-4 w-4 shrink-0 text-neutral-400"
          aria-hidden="true"
        />
      </button>
    </section>
  </div>
);
}
