'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IoMdAdd } from 'react-icons/io';
import {
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiDollarSign,
  FiPackage,
  FiCalendar,
  FiShoppingBag,
  FiTrendingUp,
  FiUser,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
} from 'react-icons/fi';
import Form from '@/components/PopUp';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { useToast } from '@/context/ToastContext';
import { orderFormSchema } from '@/lib/validations';
import styles from './history.module.css';

interface BuyerOption {
  id: string;
  name: string;
  email: string;
}

interface Order {
  id: string;
  buyerId?: string | null;
  buyerName: string;
  quantity: number;
  amount: number;
  description: string;
  orderDate: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  createdAt: string;
  buyer?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
  } | null;
}

interface OrderSummary {
  totalOrders: number;
  completedOrders?: number;
  totalAmount: number;
  totalQuantity: number;
  averageOrderValue?: number;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface OrdersApiResponse {
  status: string;
  results: number;
  summary?: OrderSummary;
  pagination?: PaginationMeta;
  data: Order[];
}

const todayFormatted = () => new Date().toISOString().split('T')[0];

const initialForm = {
  buyerId: '',
  buyerName: '',
  quantity: '1',
  amount: '',
  description: '',
  orderDate: todayFormatted(),
  status: 'COMPLETED' as 'COMPLETED' | 'PENDING' | 'CANCELLED',
};

function OrderHistoryContent() {
  const searchParams = useSearchParams();
  const initialBuyerId = searchParams.get('buyerId') || 'ALL';
  const initialBuyerName = searchParams.get('buyerName') || '';

  const [openModal, setOpenModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Form State
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof initialForm, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof typeof initialForm, boolean>>>({});
  const [serverError, setServerError] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [buyerFilter, setBuyerFilter] = useState<string>(initialBuyerId);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING' | 'CANCELLED'>('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  const queryClient = useQueryClient();
  const toast = useToast();

  // Keep filter in sync if query param changes
  useEffect(() => {
    if (initialBuyerId && initialBuyerId !== 'ALL') {
      setBuyerFilter(initialBuyerId);
    }
  }, [initialBuyerId]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Buyers list for dropdown & selection
  const { data: buyersResponse } = useQuery<{ status: string; data: BuyerOption[] }>({
    queryKey: ['buyers-options'],
    queryFn: () => axios.get(`${API_URL}/buyers?limit=100`).then((r) => r.data),
  });
  const buyersList = useMemo(() => buyersResponse?.data || [], [buyersResponse]);

  // Fetch Orders with pagination, search, and filters
  const { data: responseData, isLoading, isError, error, refetch } = useQuery<OrdersApiResponse>({
    queryKey: ['orders', { page, limit, search: debouncedSearch, buyerId: buyerFilter, status: statusFilter }],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      if (buyerFilter !== 'ALL') params.append('buyerId', buyerFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      return axios.get(`${API_URL}/orders?${params.toString()}`).then((r) => r.data);
    },
  });

  const orders = useMemo(() => responseData?.data || [], [responseData]);
  const summary = useMemo(
    () => responseData?.summary || { totalOrders: 0, totalAmount: 0, totalQuantity: 0 },
    [responseData]
  );
  const pagination: PaginationMeta = useMemo(() => {
    if (responseData?.pagination) return responseData.pagination;
    const total = responseData?.results || orders.length;
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    };
  }, [responseData, orders, page, limit]);

  // TanStack Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => axios.post(`${API_URL}/orders`, payload).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Order for "${data?.data?.buyerName || formData.buyerName}" created!`, 'Order Created');
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create order.';
      setServerError(msg);
      toast.error(msg, 'Creation Failed');
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      axios.patch(`${API_URL}/orders/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order details updated successfully!', 'Order Updated');
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update order.';
      setServerError(msg);
      toast.error(msg, 'Update Failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`${API_URL}/orders/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order deleted successfully.', 'Deleted');
      if (orders.length === 1 && page > 1) setPage((p) => p - 1);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete order.', 'Delete Failed');
    },
  });

  // Modal helpers
  const openCreateModal = () => {
    setEditingOrder(null);
    const defaultBuyer = buyersList.length > 0 ? buyersList[0] : null;
    setFormData({
      ...initialForm,
      buyerId: defaultBuyer ? defaultBuyer.id : '',
      buyerName: defaultBuyer ? defaultBuyer.name : '',
      orderDate: todayFormatted(),
    });
    setErrors({});
    setTouched({});
    setServerError('');
    setOpenModal(true);
  };

  const openEditModal = (order: Order) => {
    setEditingOrder(order);
    const dateFormatted = order.orderDate
      ? new Date(order.orderDate).toISOString().split('T')[0]
      : todayFormatted();

    setFormData({
      buyerId: order.buyerId || '',
      buyerName: order.buyerName,
      quantity: String(order.quantity),
      amount: String(order.amount),
      description: order.description,
      orderDate: dateFormatted,
      status: order.status,
    });
    setErrors({});
    setTouched({});
    setServerError('');
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditingOrder(null);
    setFormData(initialForm);
    setErrors({});
    setTouched({});
    setServerError('');
  };

  // Form field change handler
  const handleBuyerSelection = (selectedId: string) => {
    if (selectedId === 'CUSTOM' || !selectedId) {
      setFormData((prev) => ({ ...prev, buyerId: '', buyerName: '' }));
    } else {
      const found = buyersList.find((b) => b.id === selectedId);
      if (found) {
        setFormData((prev) => ({ ...prev, buyerId: found.id, buyerName: found.name }));
        setErrors((prev) => ({ ...prev, buyerName: undefined }));
      }
    }
  };

  const handleFieldChange = (field: keyof typeof initialForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (serverError) setServerError('');
    if (touched[field]) {
      const candidate = { ...formData, [field]: value };
      const res = orderFormSchema.safeParse(candidate);
      const err = !res.success ? res.error.flatten().fieldErrors[field]?.[0] || '' : '';
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleFieldBlur = (field: keyof typeof initialForm) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const res = orderFormSchema.safeParse(formData);
    const err = !res.success ? res.error.flatten().fieldErrors[field]?.[0] || '' : '';
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    const res = orderFormSchema.safeParse(formData);
    if (!res.success) {
      const fieldErrors = res.error.flatten().fieldErrors;
      setErrors({
        buyerName: fieldErrors.buyerName?.[0],
        quantity: fieldErrors.quantity?.[0],
        amount: fieldErrors.amount?.[0],
        description: fieldErrors.description?.[0],
        orderDate: fieldErrors.orderDate?.[0],
        status: fieldErrors.status?.[0],
      });
      setTouched({
        buyerName: true,
        quantity: true,
        amount: true,
        description: true,
        orderDate: true,
        status: true,
      });
      toast.error('Please fill in all required order details correctly.', 'Validation Error');
      return;
    }

    const payload = {
      buyerId: formData.buyerId || null,
      buyerName: formData.buyerName.trim(),
      quantity: Number(formData.quantity),
      amount: Number(formData.amount),
      description: formData.description.trim(),
      orderDate: new Date(formData.orderDate).toISOString(),
      status: formData.status,
    };

    if (editingOrder) {
      editMutation.mutate({ id: editingOrder.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (order: Order) => {
    if (confirm(`Are you sure you want to delete order for "${order.buyerName}"?`)) {
      deleteMutation.mutate(order.id);
    }
  };

  const hasActiveFilters = Boolean(
    debouncedSearch || buyerFilter !== 'ALL' || statusFilter !== 'ALL'
  );
  const showControls = pagination.total !== 0 || hasActiveFilters;

  const startRecord = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const averageOrderValue = useMemo(() => {
    if (summary.averageOrderValue !== undefined) return summary.averageOrderValue;
    const completedCount = summary.completedOrders ?? 0;
    return completedCount > 0 ? summary.totalAmount / completedCount : 0;
  }, [summary]);

  const pageNumbers = useMemo(() => {
    const total = pagination.totalPages;
    const cur = pagination.page;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 3) return [1, 2, 3, 4, 5];
    if (cur >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
    return [cur - 2, cur - 1, cur, cur + 1, cur + 2];
  }, [pagination.totalPages, pagination.page]);

  return (
    <main
      className="flex-1 p-6 md:p-10 min-h-screen transition-colors duration-300"
      style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b transition-colors duration-300"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Order History</h1>
              <span className={styles.badgePill}>
                {pagination.total} {pagination.total === 1 ? 'Order' : 'Orders'}
              </span>
            </div>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)', maxWidth: '720px' }}>
              Historical log of buyer orders including Buyer Name, Quantity, Amount, Description, and Order Date.
              {initialBuyerName && (
                <span className="font-semibold text-emerald-500 ml-1">
                  (Filtered by: {initialBuyerName})
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className={`${styles.btnPrimary} h-9`}
              id="btn-add-order"
            >
              <IoMdAdd className="text-lg" />
              <span>Add Order</span>
            </button>
            <ThemeSwitcher />
          </div>
        </div>

        {/* KPI Metrics Summary */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <FiShoppingBag />
            </div>
            <div>
              <div className={styles.statValue}>{summary.totalOrders}</div>
              <div className={styles.statLabel}>
                Total Orders {summary.completedOrders !== undefined && (
                  <span className="opacity-75 font-normal">({summary.completedOrders})</span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <FiDollarSign />
            </div>
            <div>
              <div className={styles.statValue}>{formatCurrency(summary.totalAmount)}</div>
              <div className={styles.statLabel}>Revenue</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <FiPackage />
            </div>
            <div>
              <div className={styles.statValue}>{summary.totalQuantity.toLocaleString()}</div>
              <div className={styles.statLabel}>Units Sold</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <FiTrendingUp />
            </div>
            <div>
              <div className={styles.statValue}>{formatCurrency(averageOrderValue)}</div>
              <div className={styles.statLabel}>Avg. Value</div>
            </div>
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
                  placeholder="Search buyer name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${styles.inputSearch} h-9`}
                  id="search-orders"
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

              {/* Buyer Filter */}
              <select
                value={buyerFilter}
                onChange={(e) => {
                  setBuyerFilter(e.target.value);
                  setPage(1);
                }}
                className={`${styles.selectField} h-9`}
                aria-label="Filter by buyer"
                id="filter-buyer"
              >
                <option value="ALL">All Buyers</option>
                {buyersList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
                className={`${styles.selectField} h-9`}
                aria-label="Filter by status"
                id="filter-status"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {/* Reset Filters */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setBuyerFilter('ALL');
                    setStatusFilter('ALL');
                    setPage(1);
                  }}
                  className={styles.btnSecondary}
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                >
                  <FiX className="text-xs" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            {/* Rows Per Page */}
            <div
              className="flex items-center gap-2 text-sm self-end sm:self-auto"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span>Rows:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className={`${styles.selectField} h-9 py-1 px-2`}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-6 bg-red-950/40 border border-red-800/60 rounded-2xl text-red-200">
            <h3 className="font-semibold text-lg mb-1">Failed to load order history</h3>
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
                <div
                  key={n}
                  className="h-12 w-full rounded-lg"
                  style={{ background: 'var(--border-subtle)' }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && orders.length === 0 && (
          <div
            className="text-center py-16 border rounded-3xl max-w-lg mx-auto p-8"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 border"
              style={{
                background: 'var(--accent-subtle)',
                borderColor: 'var(--accent-subtle-border)',
                color: 'var(--text-accent)',
              }}
            >
              {hasActiveFilters ? <FiSearch /> : <FiShoppingBag />}
            </div>
            <h3 className="text-lg font-bold mb-1">
              {hasActiveFilters ? 'No matching orders found' : 'No order history yet'}
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              {hasActiveFilters
                ? 'No buyer orders match your filter criteria. Try clearing filters.'
                : 'Create your first buyer order to start tracking purchase history and metrics.'}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setBuyerFilter('ALL');
                  setStatusFilter('ALL');
                  setPage(1);
                }}
                className={styles.btnSecondary}
              >
                Clear filters
              </button>
            ) : (
              <button type="button" onClick={openCreateModal} className={`${styles.btnPrimary} h-9`}>
                <IoMdAdd className="text-lg" />
                <span>Create First Order</span>
              </button>
            )}
          </div>
        )}

        {/* Order History Table */}
        {!isLoading && !isError && orders.length > 0 && (
          <div className={styles.tableWrapper}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Buyer Name</th>
                    <th>Quantity</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      {/* Buyer Name */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border flex-shrink-0"
                            style={{
                              background: 'var(--accent-subtle)',
                              borderColor: 'var(--accent-subtle-border)',
                              color: 'var(--text-accent)',
                            }}
                          >
                            {order.buyerName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate" title={order.buyerName}>
                              {order.buyerName}
                            </div>
                            {order.buyer?.email ? (
                              <div className="text-xs opacity-60 truncate">{order.buyer.email}</div>
                            ) : (
                              <div className="text-xs opacity-40">Direct / Walk-in Buyer</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td>
                        <span className={styles.qtyBadge}>
                          <FiPackage className="text-xs opacity-70" />
                          <span className='flex whitespace-nowrap' >{order.quantity.toLocaleString()} units</span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td>
                        <span className={styles.amountBadge}>{formatCurrency(order.amount)}</span>
                      </td>

                      {/* Description */}
                      <td className="max-w-xs">
                        <div
                          className="text-xs line-clamp-2"
                          title={order.description}
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {order.description}
                        </div>
                      </td>

                      {/* Date */}
                      <td>
                        <div className="flex items-center gap-1.5 text-xs opacity-80 whitespace-nowrap">
                          <FiCalendar className="text-xs opacity-60 flex-shrink-0" />
                          <span>
                            {new Date(order.orderDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        {order.status === 'COMPLETED' && (
                          <span className={styles.badgeSuccess}>
                            <FiCheckCircle className="text-xs" />
                            <span>Completed</span>
                          </span>
                        )}
                        {order.status === 'PENDING' && (
                          <span className={styles.badgePending}>
                            <FiClock className="text-xs" />
                            <span>Pending</span>
                          </span>
                        )}
                        {order.status === 'CANCELLED' && (
                          <span className={styles.badgeCancelled}>
                            <FiAlertCircle className="text-xs" />
                            <span>Cancelled</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(order)}
                            className={styles.btnIcon}
                            title="Edit order"
                            aria-label={`Edit order ${order.id}`}
                          >
                            <FiEdit2 className="text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(order)}
                            className={styles.btnIconDanger}
                            title="Delete order"
                            aria-label={`Delete order ${order.id}`}
                            disabled={deleteMutation.isPending && deleteMutation.variables === order.id}
                          >
                            {deleteMutation.isPending && deleteMutation.variables === order.id ? (
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
                <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>{pagination.total}</strong> orders
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

        {/* Modal: Add or Edit Order */}
        <Form modelOpen={openModal} setModelOpen={setOpenModal}>
          <div className=" space-y-6">
            <div className="border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <h2 className="text-xl font-bold tracking-tight">
                {editingOrder ? 'Edit Buyer Order' : 'Record New Buyer Order'}
              </h2>
            </div>

            {serverError && (
              <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-200">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Buyer Selector & Buyer Name */}
              <div className={styles.formGridTwoCol}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Select Existing Buyer</label>
                  <select
                    value={formData.buyerId}
                    onChange={(e) => handleBuyerSelection(e.target.value)}
                    className={styles.formSelect}
                  >
                    <option value="">-- Custom / Manual Entry --</option>
                    {buyersList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Buyer Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter buyer / organization name"
                    value={formData.buyerName}
                    onChange={(e) => handleFieldChange('buyerName', e.target.value)}
                    onBlur={() => handleFieldBlur('buyerName')}
                    className={styles.formInput}
                  />
                  {touched.buyerName && errors.buyerName && (
                    <span className={styles.formError}>{errors.buyerName}</span>
                  )}
                </div>
              </div>

              {/* Quantity & Amount */}
              <div className={styles.formGridTwoCol}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Quantity (Units) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 50"
                    value={formData.quantity}
                    onChange={(e) => handleFieldChange('quantity', e.target.value)}
                    onBlur={() => handleFieldBlur('quantity')}
                    className={styles.formInput}
                  />
                  {touched.quantity && errors.quantity && (
                    <span className={styles.formError}>{errors.quantity}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Amount ($ USD) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 1250.00"
                    value={formData.amount}
                    onChange={(e) => handleFieldChange('amount', e.target.value)}
                    onBlur={() => handleFieldBlur('amount')}
                    className={styles.formInput}
                  />
                  {touched.amount && errors.amount && (
                    <span className={styles.formError}>{errors.amount}</span>
                  )}
                </div>
              </div>

              {/* Date & Status */}
              <div className={styles.formGridTwoCol}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Order Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => handleFieldChange('orderDate', e.target.value)}
                    onBlur={() => handleFieldBlur('orderDate')}
                    className={styles.formInput}
                  />
                  {touched.orderDate && errors.orderDate && (
                    <span className={styles.formError}>{errors.orderDate}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFieldChange('status', e.target.value as any)}
                    className={styles.formSelect}
                  >
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Description & Products Ordered <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. 50 cases of Classic Sparkling Lemonade (24-pack cans)"
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  onBlur={() => handleFieldBlur('description')}
                  className={styles.formTextarea}
                />
                {touched.description && errors.description && (
                  <span className={styles.formError}>{errors.description}</span>
                )}
              </div>

              {/* Form Action Buttons */}
              <div
                className="flex items-center justify-end gap-3 pt-4 border-t"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <button type="button" onClick={closeModal} className={styles.btnSecondary}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || editMutation.isPending}
                  className={styles.btnPrimary}
                >
                  {createMutation.isPending || editMutation.isPending ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : editingOrder ? (
                    'Update Order'
                  ) : (
                    'Create Order'
                  )}
                </button>
              </div>
            </form>
          </div>
        </Form>
      </div>
    </main>
  );
}

export default function OrderHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 p-10 flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OrderHistoryContent />
    </Suspense>
  );
}