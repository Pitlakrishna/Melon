'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
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
  FiCheck,
  FiCalendar,
  FiAlertTriangle,
  FiClock,
  FiCheckCircle,
  FiList,
  FiFlag,
} from 'react-icons/fi';
import Form from '@/components/PopUp';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { useToast } from '@/context/ToastContext';
import { taskFormSchema } from '@/lib/validations';
import styles from './tasks.module.css';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TaskSummary {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  urgentTasks: number;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface TasksApiResponse {
  status: string;
  results: number;
  summary?: TaskSummary;
  pagination?: PaginationMeta;
  data: Task[];
}

const initialForm = {
  title: '',
  description: '',
  priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
  status: 'TODO' as 'TODO' | 'IN_PROGRESS' | 'COMPLETED',
  dueDate: '',
};

function TasksContent() {
  const [openModal, setOpenModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof initialForm, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof typeof initialForm, boolean>>>({});
  const [serverError, setServerError] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TODO' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  const queryClient = useQueryClient();
  const toast = useToast();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Tasks with query filters
  const { data: responseData, isLoading, isError, error, refetch } = useQuery<TasksApiResponse>({
    queryKey: ['tasks', { page, limit, search: debouncedSearch, status: statusFilter, priority: priorityFilter }],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);
      return axios.get(`${API_URL}/tasks?${params.toString()}`).then((r) => r.data);
    },
  });

  const tasks = useMemo(() => responseData?.data || [], [responseData]);
  const summary = useMemo(
    () =>
      responseData?.summary || {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        todoTasks: 0,
        urgentTasks: 0,
      },
    [responseData]
  );

  const pagination: PaginationMeta = useMemo(() => {
    if (responseData?.pagination) return responseData.pagination;
    const total = responseData?.results || tasks.length;
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    };
  }, [responseData, tasks, page, limit]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => axios.post(`${API_URL}/tasks`, payload).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`Task "${data?.data?.title || formData.title}" added!`, 'Task Created');
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create task.';
      setServerError(msg);
      toast.error(msg, 'Creation Failed');
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      axios.patch(`${API_URL}/tasks/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated successfully!', 'Task Updated');
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update task.';
      setServerError(msg);
      toast.error(msg, 'Update Failed');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => axios.patch(`${API_URL}/tasks/${id}/toggle`).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      const isDone = data?.data?.status === 'COMPLETED';
      toast.info(
        isDone ? 'Marked as completed!' : 'Marked as todo.',
        isDone ? 'Completed' : 'Status Updated'
      );
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to toggle status.', 'Error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`${API_URL}/tasks/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task removed.', 'Deleted');
      if (tasks.length === 1 && page > 1) setPage((p) => p - 1);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete task.', 'Delete Failed');
    },
  });

  // Modal helpers
  const openCreateModal = () => {
    setEditingTask(null);
    setFormData(initialForm);
    setErrors({});
    setTouched({});
    setServerError('');
    setOpenModal(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    const dateFormatted = task.dueDate
      ? new Date(task.dueDate).toISOString().split('T')[0]
      : '';

    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: dateFormatted,
    });
    setErrors({});
    setTouched({});
    setServerError('');
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditingTask(null);
    setFormData(initialForm);
    setErrors({});
    setTouched({});
    setServerError('');
  };

  const handleFieldChange = (field: keyof typeof initialForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (serverError) setServerError('');
    if (touched[field]) {
      const candidate = { ...formData, [field]: value };
      const res = taskFormSchema.safeParse(candidate);
      const err = !res.success ? res.error.flatten().fieldErrors[field]?.[0] || '' : '';
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleFieldBlur = (field: keyof typeof initialForm) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const res = taskFormSchema.safeParse(formData);
    const err = !res.success ? res.error.flatten().fieldErrors[field]?.[0] || '' : '';
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    const res = taskFormSchema.safeParse(formData);
    if (!res.success) {
      const fieldErrors = res.error.flatten().fieldErrors;
      setErrors({
        title: fieldErrors.title?.[0],
        description: fieldErrors.description?.[0],
        priority: fieldErrors.priority?.[0],
        status: fieldErrors.status?.[0],
        dueDate: fieldErrors.dueDate?.[0],
      });
      setTouched({ title: true, description: true, priority: true, status: true, dueDate: true });
      toast.error('Please resolve the highlighted errors in the form.', 'Validation Error');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      priority: formData.priority,
      status: formData.status,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
    };

    if (editingTask) {
      editMutation.mutate({ id: editingTask.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (task: Task) => {
    if (confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      deleteMutation.mutate(task.id);
    }
  };

  const hasActiveFilters = Boolean(
    debouncedSearch || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
  );
  const showControls = pagination.total !== 0 || hasActiveFilters;

  const startRecord = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  const pageNumbers = useMemo(() => {
    const total = pagination.totalPages;
    const cur = pagination.page;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 3) return [1, 2, 3, 4, 5];
    if (cur >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
    return [cur - 2, cur - 1, cur, cur + 1, cur + 2];
  }, [pagination.totalPages, pagination.page]);

  const isOverdue = (dueDateStr?: string | null, status?: string) => {
    if (!dueDateStr || status === 'COMPLETED') return false;
    const due = new Date(dueDateStr);
    const now = new Date();
    return due.getTime() < now.getTime() - 24 * 60 * 60 * 1000;
  };

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
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Tasks</h1>
              <span className={styles.badgePill}>
                {pagination.total} {pagination.total === 1 ? 'Task' : 'Tasks'}
              </span>
            </div>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
              Organize, track, and complete operations, deliveries, stock reorders, and commercial buyer follow-ups.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className={`${styles.btnPrimary} h-9`}
              id="btn-add-task"
            >
              <IoMdAdd className="text-lg" />
              <span>Add Task</span>
            </button>
            <ThemeSwitcher />
          </div>
        </div>

        {/* KPI Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <FiList />
            </div>
            <div>
              <div className={styles.statValue}>{summary.totalTasks}</div>
              <div className={styles.statLabel}>Total Tasks</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <FiCheckCircle />
            </div>
            <div>
              <div className={styles.statValue}>{summary.completedTasks}</div>
              <div className={styles.statLabel}>Completed</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <FiClock />
            </div>
            <div>
              <div className={styles.statValue}>{summary.inProgressTasks}</div>
              <div className={styles.statLabel}>In Progress</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <FiFlag />
            </div>
            <div>
              <div className={styles.statValue}>{summary.urgentTasks}</div>
              <div className={styles.statLabel}>Urgent Priority</div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        {showControls && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none opacity-60" />
                <input
                  type="text"
                  placeholder="Search task title or details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${styles.inputSearch} h-9`}
                  id="search-tasks"
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
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value as any);
                  setPage(1);
                }}
                className={`${styles.selectField} h-9`}
                aria-label="Filter by priority"
                id="filter-priority"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>

              {/* Reset Filters */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setPriorityFilter('ALL');
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
            <h3 className="font-semibold text-lg mb-1">Failed to load tasks</h3>
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
        {!isLoading && !isError && tasks.length === 0 && (
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
              {hasActiveFilters ? <FiSearch /> : <FiList />}
            </div>
            <h3 className="text-lg font-bold mb-1">
              {hasActiveFilters ? 'No matching tasks' : 'No tasks created yet'}
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              {hasActiveFilters
                ? 'No tasks match your search and filter criteria. Try resetting.'
                : 'Create your first task to start organizing operational and delivery activities.'}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setPriorityFilter('ALL');
                  setPage(1);
                }}
                className={styles.btnSecondary}
              >
                Clear filters
              </button>
            ) : (
              <button type="button" onClick={openCreateModal} className={`${styles.btnPrimary} h-9`}>
                <IoMdAdd className="text-lg" />
                <span>Add First Task</span>
              </button>
            )}
          </div>
        )}

        {/* Tasks Table */}
        {!isLoading && !isError && tasks.length > 0 && (
          <div className={styles.tableWrapper}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Task</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => {
                    const overdue = isOverdue(task.dueDate, task.status);
                    const isDone = task.status === 'COMPLETED';

                    return (
                      <tr key={task.id}>
                        {/* Quick Checkbox Toggle */}
                        <td>
                          <button
                            type="button"
                            onClick={() => toggleMutation.mutate(task.id)}
                            className={`${styles.checkboxBtn} ${isDone ? styles.checkboxChecked : ''}`}
                            title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                            aria-label={`Toggle task ${task.title}`}
                          >
                            {isDone && <FiCheck className="text-xs" />}
                          </button>
                        </td>

                        {/* Title & Description */}
                        <td>
                          <div className="min-w-0 max-w-md">
                            <div
                              className={`font-semibold text-sm truncate ${
                                isDone ? 'line-through opacity-50' : ''
                              }`}
                              title={task.title}
                            >
                              {task.title}
                            </div>
                            {task.description && (
                              <div
                                className={`text-xs truncate mt-0.5 opacity-60 ${
                                  isDone ? 'line-through' : ''
                                }`}
                                title={task.description}
                              >
                                {task.description}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Priority Badge */}
                        <td>
                          {task.priority === 'LOW' && (
                            <span className={styles.priorityLow}>Low</span>
                          )}
                          {task.priority === 'MEDIUM' && (
                            <span className={styles.priorityMedium}>Medium</span>
                          )}
                          {task.priority === 'HIGH' && (
                            <span className={styles.priorityHigh}>High</span>
                          )}
                          {task.priority === 'URGENT' && (
                            <span className={styles.priorityUrgent}>Urgent</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td>
                          {task.status === 'TODO' && (
                            <span className={styles.badgeTodo}>To Do</span>
                          )}
                          {task.status === 'IN_PROGRESS' && (
                            <span className={styles.badgeInProgress}>In Progress</span>
                          )}
                          {task.status === 'COMPLETED' && (
                            <span className={styles.badgeCompleted}>Completed</span>
                          )}
                        </td>

                        {/* Due Date */}
                        <td>
                          {task.dueDate ? (
                            <div
                              className={`flex items-center gap-1.5 text-xs whitespace-nowrap ${
                                overdue ? 'text-red-400 font-semibold' : 'opacity-70'
                              }`}
                            >
                              {overdue ? (
                                <FiAlertTriangle className="text-xs text-red-400 flex-shrink-0" />
                              ) : (
                                <FiCalendar className="text-xs opacity-60 flex-shrink-0" />
                              )}
                              <span>
                                {new Date(task.dueDate).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              {overdue && <span className="text-[10px] uppercase font-bold">(Overdue)</span>}
                            </div>
                          ) : (
                            <span className="text-xs opacity-35">—</span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td style={{ textAlign: 'right' }}>
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(task)}
                              className={styles.btnIcon}
                              title="Edit task"
                              aria-label={`Edit ${task.title}`}
                            >
                              <FiEdit2 className="text-sm" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(task)}
                              className={styles.btnIconDanger}
                              title="Delete task"
                              aria-label={`Delete ${task.title}`}
                              disabled={
                                deleteMutation.isPending && deleteMutation.variables === task.id
                              }
                            >
                              {deleteMutation.isPending && deleteMutation.variables === task.id ? (
                                <span className="inline-block w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <FiTrash2 className="text-sm" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className={styles.paginationBar}>
              <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Showing <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>{startRecord}</strong> to{' '}
                <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>{endRecord}</strong> of{' '}
                <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>{pagination.total}</strong> tasks
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

        {/* Modal: Add or Edit Task */}
        <Form modelOpen={openModal} setModelOpen={setOpenModal}>
          <div className=" space-y-5">
            <div className="border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <h2 className="text-xl font-bold tracking-tight">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
            </div>

            {serverError && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-200">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Task Title */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Task Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Coordinate warehouse inventory restock"
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  onBlur={() => handleFieldBlur('title')}
                  className={styles.formInput}
                />
                {touched.title && errors.title && (
                  <span className={styles.formError}>{errors.title}</span>
                )}
              </div>

              {/* Priority & Status */}
              <div className={styles.formGridTwoCol}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleFieldChange('priority', e.target.value as any)}
                    className={styles.formSelect}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFieldChange('status', e.target.value as any)}
                    className={styles.formSelect}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                  onBlur={() => handleFieldBlur('dueDate')}
                  className={styles.formInput}
                />
              </div>

              {/* Description */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description & Notes</label>
                <textarea
                  rows={3}
                  placeholder="Add any context, contact names, or checklist details..."
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  onBlur={() => handleFieldBlur('description')}
                  className={styles.formTextarea}
                />
                {touched.description && errors.description && (
                  <span className={styles.formError}>{errors.description}</span>
                )}
              </div>

              {/* Buttons */}
              <div
                className="flex items-center justify-end gap-3 pt-3 border-t"
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
                  ) : editingTask ? (
                    'Update Task'
                  ) : (
                    'Create Task'
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

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 p-10 flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TasksContent />
    </Suspense>
  );
}
