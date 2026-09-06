'use client';

import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IoMdAdd } from "react-icons/io";
import Link from "next/link";
import {
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiUser,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiPhone,
  FiMapPin,
  FiMail,
  FiFolder,
  FiAlertCircle,
  FiCheck,
  FiShoppingBag,
} from "react-icons/fi";
import Form from "@/components/PopUp";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useToast } from "@/context/ToastContext";
import { buyerFormSchema } from "@/lib/validations";
import styles from "./buyer.module.css";

interface CategoryOption {
  id: string;
  name: string;
  slug?: string;
}

interface Buyer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category?: { id: string; name: string; slug?: string } | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface BuyersApiResponse {
  status: string;
  results: number;
  pagination?: PaginationMeta;
  data: Buyer[];
}

const initialForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  categoryId: '',
  status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
};

export default function BuyerPage() {
  const [openModal, setOpenModal] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);

  // Form state & touched/error tracking
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof initialForm, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof typeof initialForm, boolean>>>({});
  const [serverError, setServerError] = useState("");

  // Filters, search & pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  const queryClient = useQueryClient();
  const toast = useToast();

  // Validate single field using Zod
  const validateField = (field: keyof typeof initialForm, value: string) => {
    const candidate = { ...formData, [field]: value };
    const res = buyerFormSchema.safeParse(candidate);
    const err = !res.success ? res.error.flatten().fieldErrors[field]?.[0] || '' : '';
    setErrors((prev) => ({ ...prev, [field]: err }));
    return err;
  };

  const handleFieldChange = (field: keyof typeof initialForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (serverError) setServerError('');
    if (touched[field]) validateField(field, value);
  };

  const handleFieldBlur = (field: keyof typeof initialForm) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Categories
  const { data: categoriesResponse } = useQuery<{ status: string; data: CategoryOption[] }>({
    queryKey: ['categories'],
    queryFn: () => axios.get(`${API_URL}/categories`).then((r) => r.data),
  });
  const categories = useMemo(() => categoriesResponse?.data || [], [categoriesResponse]);

  // Fetch Paginated Buyers
  const { data: responseData, isLoading, isError, error, refetch } = useQuery<BuyersApiResponse>({
    queryKey: ['buyers', { page, limit, search: debouncedSearch, status: statusFilter, category: categoryFilter }],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      return axios.get(`${API_URL}/buyers?${params.toString()}`).then((r) => r.data);
    },
  });

  const buyers = useMemo(() => responseData?.data || [], [responseData]);
  const pagination: PaginationMeta = useMemo(() => {
    if (responseData?.pagination) return responseData.pagination;
    const total = responseData?.results || buyers.length;
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    };
  }, [responseData, buyers, page, limit]);

  // TanStack Mutation: Create Buyer
  const createMutation = useMutation({
    mutationFn: (payload: any) => axios.post(`${API_URL}/buyers`, payload).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
      toast.success(`Buyer "${data?.data?.name || formData.name}" created successfully!`, 'Buyer Created');
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create buyer.';
      setServerError(msg);
      toast.error(msg, 'Creation Failed');
      if (msg.toLowerCase().includes('email')) {
        setErrors((p) => ({ ...p, email: 'Email already exists.' }));
        setTouched((p) => ({ ...p, email: true }));
      }
    },
  });

  // TanStack Mutation: Edit Buyer
  const editMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      axios.patch(`${API_URL}/buyers/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
      toast.success('Buyer details updated successfully!', 'Buyer Updated');
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update buyer.';
      setServerError(msg);
      toast.error(msg, 'Update Failed');
      if (msg.toLowerCase().includes('email')) {
        setErrors((p) => ({ ...p, email: 'Email already in use.' }));
        setTouched((p) => ({ ...p, email: true }));
      }
    },
  });

  // TanStack Mutation: Delete Buyer
  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`${API_URL}/buyers/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
      toast.success('Buyer deleted successfully.', 'Deleted');
      if (buyers.length === 1 && page > 1) setPage((p) => p - 1);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete buyer.', 'Delete Failed');
    },
  });

  // Modal open & close helpers
  const openCreateModal = () => {
    setEditingBuyer(null);
    setFormData({ ...initialForm, categoryId: categories[0]?.id || '' });
    setErrors({});
    setTouched({});
    setServerError('');
    setOpenModal(true);
  };

  const openEditModal = (buyer: Buyer) => {
    setEditingBuyer(buyer);
    setFormData({
      name: buyer.name,
      email: buyer.email,
      phone: buyer.phone || '',
      address: buyer.address || '',
      categoryId: buyer.category?.id || '',
      status: buyer.status || 'ACTIVE',
    });
    setErrors({});
    setTouched({});
    setServerError('');
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditingBuyer(null);
    setFormData(initialForm);
    setErrors({});
    setTouched({});
    setServerError('');
  };

  // Form submit handler with full Zod validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    const res = buyerFormSchema.safeParse(formData);
    if (!res.success) {
      const fieldErrors = res.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        phone: fieldErrors.phone?.[0],
        address: fieldErrors.address?.[0],
        categoryId: fieldErrors.categoryId?.[0],
        status: fieldErrors.status?.[0],
      });
      setTouched({ name: true, email: true, phone: true, address: true, categoryId: true, status: true });
      toast.error('Please resolve the highlighted errors in the form.', 'Validation Error');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === formData.categoryId);
    if (!selectedCategory) {
      setErrors((p) => ({ ...p, categoryId: 'Please select a valid category.' }));
      setTouched((p) => ({ ...p, categoryId: true }));
      return;
    }

    const payload = {
      ...res.data,
      category: { id: selectedCategory.id, name: selectedCategory.name },
    };

    if (editingBuyer) {
      editMutation.mutate({ id: editingBuyer.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (buyer: Buyer) => {
    if (confirm(`Are you sure you want to delete buyer "${buyer.name}"?`)) {
      deleteMutation.mutate(buyer.id);
    }
  };

  const hasActiveFilters = Boolean(debouncedSearch || statusFilter !== 'ALL' || categoryFilter !== 'ALL');
  const showControls = pagination.total !== 0 || hasActiveFilters;
  const startRecord = (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  // Compact page numbers
  const pageNumbers = useMemo(() => {
    const total = pagination.totalPages;
    const cur = pagination.page;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 3) return [1, 2, 3, 4, 5];
    if (cur >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
    return [cur - 2, cur - 1, cur, cur + 1, cur + 2];
  }, [pagination.totalPages, pagination.page]);

  const isSubmitting = createMutation.isPending || editMutation.isPending;

  return (
    <main
      className="flex-1 p-6 md:p-10 min-h-screen transition-colors duration-300"
      style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b transition-colors duration-300"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Buyers</h1>
              <span className={styles.badgePill}>
                {pagination.total} {pagination.total === 1 ? 'Buyer' : 'Buyers'}
              </span>
            </div>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)', width: "80%" }}>
              Represents a business entity (such as a distributor, supermarket, or retailer) that purchases products in bulk from your business for commercial distribution or resale.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/history"
              className={`${styles.btnSecondary} h-9`}
              title="View all buyer orders history"
            >
              <FiShoppingBag className="text-base" />
              <span className="whitespace-nowrap">All Orders</span>
            </Link>
            {pagination.total !== 0 && (
              <button type="button" onClick={openCreateModal} className={`${styles.btnPrimary} h-9`}>
                <IoMdAdd className="text-lg" />
                <span>Add Buyer</span>
              </button>
            )}
            <ThemeSwitcher />
          </div>
        </div>

        {/* Filter and Search Controls */}
        {showControls && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none opacity-60" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${styles.inputSearch} h-9`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 h-9 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                    aria-label="Clear search"
                  >
                    <FiX className="text-sm" />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className={`${styles.selectField} h-9`}
                aria-label="Filter by category"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
                className={`${styles.selectField} h-9`}
                aria-label="Filter by status"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setCategoryFilter('ALL'); setPage(1); }}
                  className={styles.btnSecondary}
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                >
                  <FiX className="text-xs" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            {/* Rows Per Page */}
            <div className="flex items-center gap-2 text-sm self-end sm:self-auto" style={{ color: 'var(--text-secondary)' }}>
              <span>Rows:</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className={`${styles.selectField} h-9 py-1 px-2`}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-6 bg-red-950/40 border border-red-800/60 rounded-2xl text-red-200">
            <h3 className="font-semibold text-lg mb-1">Failed to load buyers</h3>
            <p className="text-sm text-red-300/80 mb-3">
              {error instanceof Error ? error.message : 'An unexpected error occurred.'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-800 hover:bg-red-700 text-white cursor-pointer transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className={`${styles.tableWrapper} p-6 space-y-4 animate-pulse`}>
            <div className="h-6 w-1/4 rounded" style={{ background: 'var(--border-subtle)' }} />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="h-12 w-full rounded-lg" style={{ background: 'var(--border-subtle)' }} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && buyers.length === 0 && (
          <div
            className="text-center py-16 border rounded-3xl max-w-lg mx-auto p-8"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 border"
              style={{ background: 'var(--accent-subtle)', borderColor: 'var(--accent-subtle-border)', color: 'var(--text-accent)' }}
            >
              {hasActiveFilters ? <FiSearch /> : <FiUser />}
            </div>
            <h3 className="text-lg font-bold mb-1">
              {hasActiveFilters ? 'No matching buyers' : 'No buyers found'}
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              {hasActiveFilters
                ? 'No buyers found matching your search or selected filters.'
                : 'Get started by adding your first buyer to the system.'}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setCategoryFilter('ALL'); setPage(1); }}
                className={styles.btnSecondary}
              >
                Clear filters
              </button>
            ) : (
              <button type="button" onClick={openCreateModal} className={`${styles.btnPrimary} h-9`}>
                <IoMdAdd className="text-lg" />
                <span>Add First Buyer</span>
              </button>
            )}
          </div>
        )}

        {/* Paginated Buyer Table */}
        {!isLoading && !isError && buyers.length > 0 && (
          <div className={styles.tableWrapper}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Buyer</th>
                    <th>Category</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {buyers.map((buyer) => (
                    <tr key={buyer.id}>
                      {/* Name & Email */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-7 h-7 rounded-[100%] flex items-center justify-center font-bold text-sm border flex-shrink-0"
                            style={{ background: 'var(--accent-subtle)', borderColor: 'var(--accent-subtle-border)', color: 'var(--text-accent)' }}
                          >
                            {buyer.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate" title={buyer.name}>{buyer.name}</div>
                            <div className="text-xs flex items-center gap-1.5 truncate mt-0.5 opacity-70" title={buyer.email}>
                              <FiMail className="flex-shrink-0" />
                              <span className="truncate">{buyer.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        {buyer.category?.name ? (
                          <span className={styles.badgeCategory} title={buyer.category.name}>
                            <FiFolder className="opacity-70 text-xs flex-shrink-0" />
                            <span className="truncate">{buyer.category.name}</span>
                          </span>
                        ) : (
                          <span className="text-xs opacity-40">—</span>
                        )}
                      </td>

                      {/* Phone */}
                      <td>
                        {buyer.phone ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <FiPhone className="opacity-60 flex-shrink-0" />
                            <span className="flex whitespace-nowrap" >{buyer.phone}</span>
                          </div>
                        ) : (
                          <span className="text-xs opacity-40">—</span>
                        )}
                      </td>

                      {/* Address */}
                      <td>
                        {buyer.address ? (
                          <div className="flex items-center gap-1.5 text-xs max-w-xs truncate" title={buyer.address}>
                            <FiMapPin className="opacity-60 flex-shrink-0" />
                            <span className="truncate">{buyer.address}</span>
                          </div>
                        ) : (
                          <span className="text-xs opacity-40">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={buyer.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive}>
                          <span className={`${styles.statusDot} ${buyer.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {buyer.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="text-xs whitespace-nowrap opacity-70">
                        {new Date(buyer.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>

                      {/* Action Buttons */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="inline-flex items-center gap-1">
                          <Link
                            href={`/history?buyerId=${buyer.id}&buyerName=${encodeURIComponent(buyer.name)}`}
                            className={styles.btnIcon}
                            title="View order history for this buyer"
                            aria-label={`View orders for ${buyer.name}`}
                          >
                            <FiShoppingBag className="text-sm" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEditModal(buyer)}
                            className={styles.btnIcon}
                            title="Edit buyer"
                            aria-label={`Edit ${buyer.name}`}
                          >
                            <FiEdit2 className="text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(buyer)}
                            className={styles.btnIconDanger}
                            title="Delete buyer"
                            aria-label={`Delete ${buyer.name}`}
                            disabled={deleteMutation.isPending && deleteMutation.variables === buyer.id}
                          >
                            {deleteMutation.isPending && deleteMutation.variables === buyer.id ? (
                              <span className="inline-block w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FiTrash2 className="text-sm" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className={styles.paginationBar}>
              <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Showing <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>{startRecord}</strong> to{' '}
                <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>{endRecord}</strong> of{' '}
                <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>{pagination.total}</strong> buyers
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage}
                  className={styles.pageBtn}
                  aria-label="Previous page"
                >
                  <FiChevronLeft className="text-base" />
                </button>

                {pageNumbers.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPage(num)}
                    className={`${styles.pageBtn} ${num === pagination.page ? styles.pageBtnActive : ''}`}
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={!pagination.hasNextPage}
                  className={styles.pageBtn}
                  aria-label="Next page"
                >
                  <FiChevronRight className="text-base" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Buyer Modal Form */}
      <Form modelOpen={openModal} setModelOpen={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
          <div className="border-b pb-2 mb-1" style={{ borderColor: 'var(--border-subtle)' }}>
            <h2 className="text-lg font-bold tracking-tight">
              {editingBuyer ? 'Edit Buyer' : 'Create New Buyer'}
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {editingBuyer ? 'Update buyer contact information and category' : 'Enter buyer details to add a new commercial account'}
            </p>
          </div>

          {/* Server / API Error Banner */}
          {serverError && (
            <div className={styles.alertBanner} role="alert">
              <FiAlertCircle className="text-sm flex-shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Text Inputs: Full Name, Email Address, Phone Number */}
          {[
            { id: 'name' as const, label: 'Full Name *', type: 'text', placeholder: 'e.g. Acme Corporation or John Doe' },
            { id: 'email' as const, label: 'Email Address *', type: 'email', placeholder: 'buyer@example.com' },
            { id: 'phone' as const, label: 'Phone Number *', type: 'tel', placeholder: 'e.g. 9876543210' },
          ].map((field) => (
            <div key={field.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {field.label}
                </label>
                {touched[field.id] && errors[field.id] && (
                  <span className={styles.fieldError}>{errors[field.id]}</span>
                )}
              </div>
              <input
                type={field.type}
                placeholder={field.placeholder}
                value={formData[field.id]}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                onBlur={() => handleFieldBlur(field.id)}
                className={`${styles.inputField} ${touched[field.id] && errors[field.id] ? styles.inputError : ''}`}
                disabled={isSubmitting}
                aria-invalid={Boolean(touched[field.id] && errors[field.id])}
              />
            </div>
          ))}

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Category Selector */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Category *
                </label>
                {touched.categoryId && errors.categoryId && (
                  <span className={styles.fieldError}>{errors.categoryId}</span>
                )}
              </div>
              <select
                value={formData.categoryId}
                onChange={(e) => handleFieldChange('categoryId', e.target.value)}
                onBlur={() => handleFieldBlur('categoryId')}
                className={`${styles.selectField} w-full h-9 ${touched.categoryId && errors.categoryId ? styles.inputError : ''}`}
                disabled={isSubmitting}
                aria-invalid={Boolean(touched.categoryId && errors.categoryId)}
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Status Selector */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Status *
                </label>
                {touched.status && errors.status && (
                  <span className={styles.fieldError}>{errors.status}</span>
                )}
              </div>
              <select
                name="status"
                id="status"
                value={formData.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                onBlur={() => handleFieldBlur('status')}
                className={`${styles.selectField} w-full h-9 ${touched.status && errors.status ? styles.inputError : ''}`}
                disabled={isSubmitting}
                aria-invalid={Boolean(touched.status && errors.status)}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Address *
              </label>
              {touched.address && errors.address && (
                <span className={styles.fieldError}>{errors.address}</span>
              )}
            </div>
            <input
              type="text"
              placeholder="123 Market St, Suite 400, City, State"
              value={formData.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              onBlur={() => handleFieldBlur('address')}
              className={`${styles.inputField} ${touched.address && errors.address ? styles.inputError : ''}`}
              disabled={isSubmitting}
              aria-invalid={Boolean(touched.address && errors.address)}
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              type="button"
              onClick={closeModal}
              className={styles.btnSecondary}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.btnPrimary}
            >
              {isSubmitting ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiCheck className="text-sm" />
              )}
              <span>{isSubmitting ? 'Saving...' : editingBuyer ? 'Save Changes' : 'Create Buyer'}</span>
            </button>
          </div>
        </form>
      </Form>
    </main>
  );
}