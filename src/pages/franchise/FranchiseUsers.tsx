import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Users,
  Trophy,
  ChevronRight,
  X,
  Mail,
  Phone,
} from 'lucide-react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { UserStatusBadge } from '@/components/ui/Badge';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Pagination, usePagination } from '@/components/ui/Pagination';

import { userService } from '@/services/user.service';
import { groupService } from '@/services/group.service';
import { planService } from '@/services/plan.service';

import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/uiStore';

import type {
  FranchiseUser,
  Group,
  NewUserInput,
} from '@/types';

import { formatDate } from '@/lib/utils';

// =============================================================================
// Validation
// =============================================================================

const userSchema = z.object({
  name: z.string().min(2, 'Name required'),

  dob: z
    .string()
    .min(1, 'Date of birth required')
    .refine(
      (d) => {
        const age =
          (Date.now() - new Date(d).getTime()) /
          (365.25 * 24 * 3600 * 1000);

        return age >= 18 && age <= 100;
      },
      'Member must be 18 or older',
    ),

  gender: z.enum(['male', 'female', 'other'], {
    message: 'Select gender',
  }),

  email: z.string().email('Valid email required'),

  phone: z
    .string()
    .regex(/^\d{10}$/, 'Enter a 10-digit phone'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),

  altPhone: z
    .string()
    .regex(/^\d{10}$/, 'Enter a 10-digit number')
    .or(z.literal(''))
    .optional(),

  address: z.string().min(5, 'Address required'),

  city: z.string().min(2, 'City required'),

  state: z.string().min(2, 'State required'),

  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Enter a 6-digit PIN'),

  pan: z
    .string()
    .regex(
      /^[A-Z]{5}\d{4}[A-Z]$/,
      'Enter a valid PAN (ABCDE1234F)',
    ),

  idLast4: z
    .string()
    .regex(/^\d{4}$/, 'Last 4 digits of Aadhaar'),

  nomineeName: z
    .string()
    .min(2, 'Nominee name required'),

  nomineeRelation: z
    .string()
    .min(2, 'Relationship required'),

  groupId: z.string().min(1, 'Select a group'),

  planId: z.string().min(1, 'Select a plan'),
});

type UserFormData = z.infer<typeof userSchema>;

const RELATIONS = [
  'Spouse',
  'Parent',
  'Child',
  'Sibling',
  'Other',
];

const STATES = [
  'Andhra Pradesh',
  'Delhi',
  'Gujarat',
  'Karnataka',
  'Kerala',
  'Maharashtra',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
];

// =============================================================================
// Page
// =============================================================================

export default function FranchiseUsers() {
  const { user } = useAuthStore();

  const franchiseId = user?.franchiseId ?? '';

  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  // ===========================================================================
  // Group → Plan relationship
  // ===========================================================================

  const selectedGroupId = watch('groupId');

  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['franchiseUsers', franchiseId],
    queryFn: () => userService.getFranchiseUsers(franchiseId),
    staleTime: 15_000,
    retry: 2,
    enabled: !!franchiseId,
  });

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['franchiseGroups', franchiseId],
    queryFn: () => groupService.getFranchiseGroups(franchiseId),
    staleTime: 15_000,
    retry: 2,
    enabled: !!franchiseId,
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['franchisePlans', franchiseId],
    queryFn: () => planService.getFranchisePlans(franchiseId),
    staleTime: 15_000,
    retry: 2,
    enabled: !!franchiseId,
  });

  const { data: groupTypes = [], isLoading: groupTypesLoading } = useQuery({
    queryKey: ['groupTypes'],
    queryFn: () => groupService.getGroupTypes(),
    staleTime: 15_000,
    retry: 2,
  });

  const loading = usersLoading || groupsLoading || plansLoading || groupTypesLoading;
  const error = usersError
    ? usersError instanceof Error
      ? usersError.message
      : 'Failed to load members'
    : null;

  const availablePlans = useMemo(
    () =>
      plans.filter(
        (plan) => plan.groupId === selectedGroupId,
      ),
    [plans, selectedGroupId],
  );

  React.useEffect(() => {
    const currentPlan = watch('planId');

    if (
      currentPlan &&
      !availablePlans.some(
        (plan) => plan.id === currentPlan,
      )
    ) {
      setValue('planId', '');
    }
  }, [selectedGroupId, availablePlans, setValue, watch]);

  // ===========================================================================
  // Create member mutation with optimistic update
  // ===========================================================================

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const group = groups.find(
        (g) => g.id === data.groupId,
      );

      const groupType = groupTypes.find(
        (type) =>
          type.id === group?.groupTypeId,
      );

      if (
        group &&
        groupType &&
        group.memberCount >= groupType.capacity
      ) {
        throw new Error(
          `${group.name} is at full capacity (${groupType.capacity}).`,
        );
      }

      const newUser = await userService.createUser({
        ...data,
        pan: data.pan.toUpperCase(),
        franchiseId,
      } as NewUserInput);

      await groupService.incrementMemberCount(
        data.groupId,
      );

      return { newUser, groupId: data.groupId };
    },
    onMutate: async (data: UserFormData) => {
      await queryClient.cancelQueries({ queryKey: ['franchiseUsers', franchiseId] });
      await queryClient.cancelQueries({ queryKey: ['franchiseGroups', franchiseId] });

      const previousUsers = queryClient.getQueryData<FranchiseUser[]>(['franchiseUsers', franchiseId]);
      const previousGroups = queryClient.getQueryData<Group[]>(['franchiseGroups', franchiseId]);

      const tempId = `temp-${Date.now()}`;
      const optimisticUser: FranchiseUser = {
        id: tempId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        groupId: data.groupId,
        planId: data.planId,
        franchiseId,
        status: 'ACTIVE',
        hasWon: false,
        joinedAt: new Date().toISOString(),
        dob: data.dob,
        gender: data.gender,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        pan: data.pan.toUpperCase(),
        idLast4: data.idLast4,
        nomineeName: data.nomineeName,
        nomineeRelation: data.nomineeRelation,
        altPhone: data.altPhone,
      };

      queryClient.setQueryData<FranchiseUser[]>(
        ['franchiseUsers', franchiseId],
        (old) => (old ? [...old, optimisticUser] : [optimisticUser]),
      );

      queryClient.setQueryData<Group[]>(
        ['franchiseGroups', franchiseId],
        (old) =>
          old
            ? old.map((g) =>
                g.id === data.groupId
                  ? { ...g, memberCount: g.memberCount + 1 }
                  : g,
              )
            : old,
      );

      return { previousUsers, previousGroups };
    },
    onSuccess: ({ newUser }) => {
      queryClient.setQueryData<FranchiseUser[]>(
        ['franchiseUsers', franchiseId],
        (old) =>
          old
            ? old.map((u) => (u.id.startsWith('temp-') ? newUser : u))
            : [newUser],
      );

      queryClient.invalidateQueries({ queryKey: ['franchiseGroups', franchiseId] });

      toast.success(
        'Member added',
        newUser.name,
      );

      setDialogOpen(false);
      reset();
    },
    onError: (err, _variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(['franchiseUsers', franchiseId], context.previousUsers);
      }
      if (context?.previousGroups) {
        queryClient.setQueryData(['franchiseGroups', franchiseId], context.previousGroups);
      }
      toast.error(
        'Failed',
        err instanceof Error
          ? err.message
          : 'Unknown error',
      );
    },
  });

  const onSubmit = (data: UserFormData) => {
    void createUserMutation.mutate(data);
  };

  const openDialog = () => {
    reset();
    setDialogOpen(true);
  };

  // ===========================================================================
  // Search
  // ===========================================================================

  const groupMap = useMemo(
    () =>
      new Map(
        groups.map((group) => [
          group.id,
          group,
        ]),
      ),
    [groups],
  );

  const normalizedSearch =
    search.trim().toLowerCase();

  const filtered = useMemo(() => {
    return users.filter((member) => {
      // Status filter
      if (statusFilter !== 'all' && member.status !== statusFilter) return false;
      // Text search
      if (!normalizedSearch) return true;
      const groupName = groupMap.get(member.groupId)?.name ?? '';
      return (
        member.name.toLowerCase().includes(normalizedSearch) ||
        member.email.toLowerCase().includes(normalizedSearch) ||
        member.phone.toLowerCase().includes(normalizedSearch) ||
        groupName.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [
    users,
    normalizedSearch,
    statusFilter,
    groupMap,
  ]);

  // Distinct statuses present, for the filter dropdown.
  const statusOptions = useMemo(
    () => Array.from(new Set(users.map((u) => u.status))).sort(),
    [users],
  );

  const { page, setPage, pageItems, pageCount, total, range } = usePagination(filtered, 12);

  const noGroups = groups.length === 0;
  const noPlans = plans.length === 0;

  // ===========================================================================
  // Render
  // ===========================================================================

  return (
    <div className="w-full space-y-5 sm:space-y-6">

      {/* =====================================================================
          Header
      ====================================================================== */}

      <section className="space-y-3">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
              Members
            </h1>

            <p className="mt-0.5 text-sm text-neutral-500">
              {users.length}{' '}
              {users.length === 1
                ? 'member'
                : 'members'}
            </p>
          </div>

          <Button
            variant="primary"
            leftIcon={
              <Plus className="h-4 w-4" />
            }
            onClick={openDialog}
            disabled={noGroups || noPlans}
            className="w-full sm:w-auto"
          >
            Add Member
          </Button>

        </div>

        {/* Setup warning */}

        {(noGroups || noPlans) && !loading && (
          <div className="rounded-xl border border-warning-200 bg-warning-50 px-3.5 py-3 text-sm leading-5 text-warning-700 sm:px-4">
            {noGroups ? (
              <>
                Create a{' '}
                <a
                  href="/franchise/groups"
                  className="font-semibold underline underline-offset-2"
                >
                  group
                </a>{' '}
                and a{' '}
                <a
                  href="/franchise/plans"
                  className="font-semibold underline underline-offset-2"
                >
                  plan
                </a>{' '}
                before adding members.
              </>
            ) : (
              <>
                Create a{' '}
                <a
                  href="/franchise/plans"
                  className="font-semibold underline underline-offset-2"
                >
                  plan
                </a>{' '}
                before adding members.
              </>
            )}
          </div>
        )}

      </section>

      {/* =====================================================================
          Main member area
      ====================================================================== */}

      <Card
        padding="none"
        className="overflow-hidden"
      >

                {/* Search */}

        <div className="border-b border-neutral-100 bg-white p-3 sm:p-4">

          {/* Search + status filter — stacked on mobile, balanced columns on desktop */}
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_12rem] sm:gap-3">

            {/* Search */}
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

              <input
                type="text"
                placeholder="Search by name, phone or group"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="block w-full min-w-0 rounded-md border border-neutral-300 bg-white py-2 pl-9 pr-9 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status filter */}
            <div className="min-w-0">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="w-full min-w-0"
              >
                <option value="all">All statuses</option>

                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </Select>
            </div>

          </div>

          {(search || statusFilter !== 'all') && !loading && (
            <p className="mt-2 px-1 text-xs text-neutral-400">
              {filtered.length}{' '}
              {filtered.length === 1 ? 'member' : 'members'} found
            </p>
          )}

        </div>

        {/* ===================================================================
            Loading
        ==================================================================== */}

        {loading && <SkeletonTable />}

        {/* ===================================================================
            Error
        ==================================================================== */}

        {!loading && error && (
          <ErrorState
            description={error}
            onRetry={() => {
              void queryClient.invalidateQueries({ queryKey: ['franchiseUsers', franchiseId] });
              void queryClient.invalidateQueries({ queryKey: ['franchiseGroups', franchiseId] });
              void queryClient.invalidateQueries({ queryKey: ['franchisePlans', franchiseId] });
              void queryClient.invalidateQueries({ queryKey: ['groupTypes'] });
            }}
          />
        )}

        {/* ===================================================================
            Empty
        ==================================================================== */}

        {!loading &&
          !error &&
          filtered.length === 0 && (
            <EmptyState
              title={
                search
                  ? 'No members found'
                  : 'No members'
              }
              icon={
                <Users className="h-6 w-6" />
              }
              description={
                search
                  ? 'Try another name, phone number or group.'
                  : 'Members you add will appear here.'
              }
              action={
                !search &&
                !noGroups &&
                !noPlans
                  ? {
                      label: 'Add Member',
                      onClick: openDialog,
                    }
                  : undefined
              }
            />
          )}

        {/* ===================================================================
            MOBILE MEMBER CARDS
            < 640px
        ==================================================================== */}

        {!loading &&
          !error &&
          filtered.length > 0 && (
            <>
              <div className="block sm:hidden">

                <div className="divide-y divide-neutral-100">

                  {pageItems.map((member) => (
                    <MobileMemberCard
                      key={member.id}
                      member={member}
                      groupName={
                        groupMap.get(
                          member.groupId,
                        )?.name
                      }
                    />
                  ))}

                </div>

              </div>

              {/* =============================================================
                  TABLET MEMBER CARDS
                  640px - 1279px
              ============================================================== */}

              <div className="hidden sm:block xl:hidden">

                <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 md:p-4">

                  {pageItems.map((member) => (
                    <TabletMemberCard
                      key={member.id}
                      member={member}
                      groupName={
                        groupMap.get(
                          member.groupId,
                        )?.name
                      }
                    />
                  ))}

                </div>

              </div>

              {/* =============================================================
                  DESKTOP TABLE
                  1280px+
              ============================================================== */}

              <div className="hidden xl:block overflow-x-auto">

                <table className="w-full text-sm">

                  <thead className="border-b border-neutral-200 bg-neutral-50">

                    <tr>
                      {[
                        'Name',
                        'Email',
                        'Group',
                        'Status',
                        'Won?',
                        'Joined',
                        '',
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>

                  </thead>

                  <tbody className="divide-y divide-neutral-100">

                    {pageItems.map((member) => (
                      <tr
                        key={member.id}
                        className="transition-colors hover:bg-neutral-50"
                      >

                        <td className="px-4 py-3 font-medium text-neutral-800">
                          {member.name}
                        </td>

                        <td className="px-4 py-3 text-neutral-500">
                          {member.email}
                        </td>

                        <td className="px-4 py-3 text-neutral-500">
                          {groupMap.get(
                            member.groupId,
                          )?.name ?? '—'}
                        </td>

                        <td className="px-4 py-3">
                          <UserStatusBadge
                            status={member.status}
                          />
                        </td>

                        <td className="px-4 py-3">

                          {member.hasWon ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-600">
                              <Trophy className="h-3.5 w-3.5" />
                              Yes
                            </span>
                          ) : (
                            <span className="text-xs text-neutral-400">
                              No
                            </span>
                          )}

                        </td>

                        <td className="px-4 py-3 text-neutral-400">
                          {formatDate(
                            member.joinedAt,
                          )}
                        </td>

                        <td className="px-4 py-3">

                          <Link
                            to={`/franchise/users/${member.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
                          >
                            View
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>

                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} range={range} total={total} itemLabel="members" />
            </>
          )}

      </Card>

      {/* =====================================================================
          Add Member Dialog
      ====================================================================== */}

      <Dialog
        open={dialogOpen}
        onClose={() =>
          setDialogOpen(false)
        }
        title="Add Member"
        description="Complete onboarding for KYC, prize delivery, nominee and plan assignment."
        size="xl"
      >

        <form
          className="space-y-6"
          onSubmit={handleSubmit(onSubmit)}
        >

          <FormSection title="Identity">

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

              <Input
                {...register('name')}
                label="Full Name"
                placeholder="Priya Sharma"
                error={errors.name?.message}
              />

              <Input
                {...register('dob')}
                type="date"
                label="Date of Birth"
                error={errors.dob?.message}
              />

              <Select
                {...register('gender')}
                label="Gender"
                placeholder="Select"
                error={errors.gender?.message}
              >
                <option value="male">
                  Male
                </option>
                <option value="female">
                  Female
                </option>
                <option value="other">
                  Other
                </option>
              </Select>

            </div>

          </FormSection>

          <FormSection title="Contact">

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

              <Input
                {...register('email')}
                type="email"
                label="Email"
                placeholder="member@example.com"
                error={errors.email?.message}
              />

              <Input
                {...register('phone')}
                label="Phone"
                placeholder="9876543210"
                error={errors.phone?.message}
              />

              <Input
                {...register('altPhone')}
                label="WhatsApp (optional)"
                placeholder="9876543210"
                error={errors.altPhone?.message}
              />

            </div>

            <div className="mt-3">
              <Input
                {...register('password')}
                type="password"
                label="Login Password"
                placeholder="Minimum 8 characters"
                helperText="Member will use this to log in to their account"
                error={errors.password?.message}
              />
            </div>

          </FormSection>

          <FormSection title="Address">

            <div className="space-y-3">

              <Input
                {...register('address')}
                label="Address"
                placeholder="Flat / House, Street, Area"
                error={errors.address?.message}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                <Input
                  {...register('city')}
                  label="City"
                  placeholder="Mumbai"
                  error={errors.city?.message}
                />

                <Select
                  {...register('state')}
                  label="State"
                  placeholder="Select state"
                  error={errors.state?.message}
                >
                  {STATES.map((state) => (
                    <option
                      key={state}
                      value={state}
                    >
                      {state}
                    </option>
                  ))}
                </Select>

                <Input
                  {...register('pincode')}
                  label="PIN Code"
                  placeholder="400001"
                  error={errors.pincode?.message}
                />

              </div>

            </div>

          </FormSection>

          <FormSection title="KYC Verification">

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              <Input
                {...register('pan')}
                label="PAN"
                placeholder="ABCDE1234F"
                className="uppercase"
                error={errors.pan?.message}
                helperText="Required for reward payouts"
              />

              <Input
                {...register('idLast4')}
                label="Aadhaar (last 4 digits)"
                placeholder="1234"
                error={errors.idLast4?.message}
                helperText="We only store the last 4 digits"
              />

            </div>

          </FormSection>

          <FormSection title="Nominee">

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              <Input
                {...register('nomineeName')}
                label="Nominee Name"
                placeholder="Rahul Sharma"
                error={errors.nomineeName?.message}
              />

              <Select
                {...register('nomineeRelation')}
                label="Relationship"
                placeholder="Select"
                error={errors.nomineeRelation?.message}
              >
                {RELATIONS.map((relation) => (
                  <option
                    key={relation}
                    value={relation}
                  >
                    {relation}
                  </option>
                ))}
              </Select>

            </div>

          </FormSection>

          <FormSection title="Plan & Group">

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              <Select
                {...register('groupId')}
                label="Group"
                placeholder="Select group"
                error={errors.groupId?.message}
              >
                {groups.map((group) => (
                  <option
                    key={group.id}
                    value={group.id}
                  >
                    {group.name}
                  </option>
                ))}
              </Select>

              <Select
                {...register('planId')}
                label="Plan"
                placeholder={
                  selectedGroupId
                    ? availablePlans.length
                      ? 'Select plan'
                      : 'No plans in this group'
                    : 'Select a group first'
                }
                error={errors.planId?.message}
                disabled={
                  !selectedGroupId ||
                  availablePlans.length === 0
                }
              >
                {availablePlans.map((plan) => (
                  <option
                    key={plan.id}
                    value={plan.id}
                  >
                    {plan.name}
                  </option>
                ))}
              </Select>

            </div>

            {selectedGroupId &&
              availablePlans.length === 0 && (
                <p className="mt-2 text-xs text-warning-600">
                  This group has no plans yet.
                  Create one on the Plans page
                  first.
                </p>
              )}

          </FormSection>

        </form>

        <DialogFooter>

          <Button
            variant="ghost"
            onClick={() =>
              setDialogOpen(false)
            }
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            loading={createUserMutation.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            Add Member
          </Button>

        </DialogFooter>

      </Dialog>

    </div>
  );
}

// =============================================================================
// Mobile Member Card
// =============================================================================

function MobileMemberCard({
  member,
  groupName,
}: {
  member: FranchiseUser;
  groupName?: string;
}) {
  return (
    <Link
      to={`/franchise/users/${member.id}`}
      className="group block bg-white px-3 py-3.5 transition-colors active:bg-neutral-50"
    >

      <div className="flex items-start gap-3">

        {/* Avatar */}

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {member.name.charAt(0).toUpperCase()}
        </div>

        {/* Main content */}

        <div className="min-w-0 flex-1">

          <div className="flex items-start justify-between gap-2">

            <div className="min-w-0 flex-1">

              <p className="break-words text-sm font-semibold leading-5 text-neutral-900">
                {member.name}
              </p>

              {groupName && (
                <p className="mt-0.5 break-words text-[11px] leading-4 text-neutral-400">
                  {groupName}
                </p>
              )}

            </div>

            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />

          </div>

          {/* Contact information */}

          <div className="mt-2 flex min-w-0 flex-col gap-1">

            <div className="flex min-w-0 items-start gap-1.5 text-[11px] leading-4 text-neutral-400">

              <Mail className="mt-0.5 h-3 w-3 shrink-0" />

              <span className="break-all">
                {member.email}
              </span>

            </div>

            <div className="flex items-center gap-1.5 text-[11px] leading-4 text-neutral-400">

              <Phone className="h-3 w-3 shrink-0" />

              <span>
                {member.phone}
              </span>

            </div>

          </div>

          {/* Status */}

          <div className="mt-2.5 flex flex-wrap items-center gap-2">

            <UserStatusBadge
              status={member.status}
            />

            {member.hasWon && (
              <span className="inline-flex items-center gap-1 rounded-full border border-accent-100 bg-accent-50 px-2 py-0.5 text-[10px] font-medium text-accent-700">
                <Trophy className="h-3 w-3" />
                Winner
              </span>
            )}

            <span className="text-[10px] text-neutral-400">
              Joined {formatDate(member.joinedAt)}
            </span>

          </div>

        </div>

      </div>

    </Link>
  );
}

// =============================================================================
// Tablet Member Card
// =============================================================================

function TabletMemberCard({
  member,
  groupName,
}: {
  member: FranchiseUser;
  groupName?: string;
}) {
  return (
    <Link
      to={`/franchise/users/${member.id}`}
      className="group rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:border-neutral-300 hover:shadow-md active:scale-[0.995]"
    >

      <div className="flex items-start gap-3">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {member.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">

          <div className="flex items-start justify-between gap-3">

            <div className="min-w-0">

              <p className="break-words text-sm font-semibold leading-5 text-neutral-900">
                {member.name}
              </p>

              {groupName && (
                <p className="mt-0.5 break-words text-xs leading-4 text-neutral-400">
                  {groupName}
                </p>
              )}

            </div>

            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />

          </div>

          <div className="mt-3 grid grid-cols-1 gap-1.5">

            <div className="flex items-start gap-2 text-xs text-neutral-500">

              <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />

              <span className="break-all">
                {member.email}
              </span>

            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-500">

              <Phone className="h-3.5 w-3.5 shrink-0 text-neutral-400" />

              <span>
                {member.phone}
              </span>

            </div>

          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">

            <UserStatusBadge
              status={member.status}
            />

            {member.hasWon && (
              <span className="inline-flex items-center gap-1 rounded-full border border-accent-100 bg-accent-50 px-2.5 py-1 text-[11px] font-medium text-accent-700">
                <Trophy className="h-3 w-3" />
                Winner
              </span>
            )}

            <span className="text-[11px] text-neutral-400">
              Joined {formatDate(member.joinedAt)}
            </span>

          </div>

        </div>

      </div>

    </Link>
  );
}

// =============================================================================
// Form Section
// =============================================================================

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t border-neutral-100 pt-4 first:border-t-0 first:pt-0">

      <legend className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-400">
        {title}
      </legend>

      {children}

    </fieldset>
  );
}