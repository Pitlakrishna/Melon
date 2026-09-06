'use client';

import Form from "@/components/PopUp";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IoMdAdd } from "react-icons/io";
import { FiEdit2, FiTrash2, FiSearch, FiFolder, FiX, FiCheck, FiAlertCircle } from "react-icons/fi";
import axios from "axios";
import { useState, useMemo } from "react";
import { useToast } from "@/context/ToastContext";
import { categoryFormSchema } from "@/lib/validations";
import styles from "./category.module.css";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function CategoryPage() {
  const [openModel, setOpenModel] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Validation State
  const [categoryError, setCategoryError] = useState("");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [serverError, setServerError] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  const clientQuery = useQueryClient();
  const toast = useToast();

  // Validate single category field using Zod
  const validateWithZod = (val: string): string => {
    const result = categoryFormSchema.safeParse({ name: val });
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      return fieldErrors.name?.[0] || 'Invalid category name.';
    }
    return '';
  };

  // Fetch Categories
  const { data: categoriesData, isLoading, isError, error, refetch } = useQuery<{ status: string; data: Category[] }>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/categories`);
      return res.data;
    },
  });

  // Create Category Mutation (using TanStack Query status)
  const createCategory = useMutation({
    mutationFn: async (name: string) => {
      const res = await axios.post(`${API_URL}/categories`, { name });
      return res.data;
    },
    onSuccess: (data) => {
      clientQuery.invalidateQueries({ queryKey: ['categories'] });
      toast.success(`Category "${data?.data?.name || categoryName}" created successfully!`, 'Category Created');
      handleCloseModal();
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to create category. Please check your input.';
      setServerError(message);
      toast.error(message, 'Creation Failed');
    },
  });

  // Edit Category Mutation (using TanStack Query status)
  const editCategory = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await axios.patch(`${API_URL}/categories/${id}`, { name });
      return res.data;
    },
    onSuccess: (data) => {
      clientQuery.invalidateQueries({ queryKey: ['categories'] });
      toast.success(`Category updated successfully!`, 'Category Updated');
      handleCloseModal();
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to update category.';
      setServerError(message);
      toast.error(message, 'Update Failed');
    },
  });

  // Delete Category Mutation
  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`${API_URL}/categories/${id}`);
      return res.data;
    },
    onSuccess: () => {
      clientQuery.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully.', 'Deleted');
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to delete category.';
      toast.error(message, 'Delete Failed');
    },
  });

  const openCreateModel = () => {
    setEditingId(null);
    setCategoryName('');
    setCategoryError('');
    setCategoryTouched(false);
    setServerError('');
    setOpenModel(true);
  };

  const openEditModel = (cat: Category) => {
    setEditingId(cat.id);
    setCategoryName(cat.name);
    setCategoryError('');
    setCategoryTouched(false);
    setServerError('');
    setOpenModel(true);
  };

  const handleCloseModal = () => {
    setOpenModel(false);
    setEditingId(null);
    setCategoryName('');
    setCategoryError('');
    setCategoryTouched(false);
    setServerError('');
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setCategoryTouched(true);

    // Validate with Zod before triggering TanStack mutation
    const validationErr = validateWithZod(categoryName);
    if (validationErr) {
      setCategoryError(validationErr);
      return;
    }

    const trimmed = categoryName.trim();
    if (editingId) {
      editCategory.mutate({ id: editingId, name: trimmed });
    } else {
      createCategory.mutate(trimmed);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the category "${name}"?`)) {
      deleteCategory.mutate(id);
    }
  };

  const categories = useMemo(() => categoriesData?.data || [], [categoriesData]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(
      (c) => c.name.toLowerCase().includes(query) || c.slug.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  // Derived slug preview for the modal
  const slugPreview = useMemo(() => {
    return categoryName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, [categoryName]);

  // Use TanStack mutation status directly
  const isSubmitting = createCategory.isPending || editCategory.isPending;

  return (
    <main
      className="flex-1 p-6 md:p-10 min-h-screen transition-colors duration-300"
      style={{
        background: 'var(--bg-page)',
        color: 'var(--text-primary)',
      }}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header Section */}
        <div
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b transition-colors duration-300"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Categories
              </h1>
              <span className={styles.badgePill}>
                {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
              </span>
            </div>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
              Organize, explore, and manage product catalog classifications
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none opacity-60" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${styles.inputSearch} h-9`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ color: 'var(--text-primary)' }}
                  aria-label="Clear search"
                >
                  <FiX className="text-sm" />
                </button>
              )}
            </div>

            {/* Theme Switcher Button */}
            <ThemeSwitcher />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className={styles.cardCategory} style={{ opacity: 0.6 }}>
                <div className="space-y-3">
                  <div
                    className="w-10 h-10 rounded-xl"
                    style={{ background: 'var(--border-subtle)' }}
                  />
                  <div
                    className="h-5 w-3/4 rounded"
                    style={{ background: 'var(--border-subtle)' }}
                  />
                </div>
                <div
                  className="h-6 w-1/2 rounded-lg"
                  style={{ background: 'var(--border-subtle)' }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-6 bg-red-950/40 border border-red-800/60 rounded-2xl text-red-200">
            <h3 className="font-semibold text-lg mb-1">Failed to load categories</h3>
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

        {/* Empty State */}
        {!isLoading && !isError && categories.length === 0 && (
          <div
            className="text-center py-20 border rounded-3xl p-8 max-w-lg mx-auto"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className={styles.cardDashedIcon} style={{ margin: '0 auto 1rem auto' }}>
              <FiFolder />
            </div>
            <h3 className="text-lg font-bold mb-1">No categories yet</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Get started by creating your very first product category.
            </p>
            <button
              type="button"
              onClick={openCreateModel}
              className={styles.btnPrimary}
            >
              <IoMdAdd className="text-lg" />
              <span>Create First Category</span>
            </button>
          </div>
        )}

        {/* No Search Results */}
        {!isLoading && !isError && categories.length > 0 && filteredCategories.length === 0 && (
          <div
            className="text-center py-16 border rounded-2xl p-8"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <FiSearch className="text-4xl mx-auto mb-3 opacity-30" />
            <h3 className="text-base font-semibold mb-1">No matching categories</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              No categories found matching &quot;{searchQuery}&quot;.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className={styles.btnSecondary}
            >
              Clear search query
            </button>
          </div>
        )}

        {/* Grid List with Create New Category Card */}
        {!isLoading && !isError && categories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {/* Create Card Trigger */}
            <div
              onClick={openCreateModel}
              className={styles.cardDashed}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') openCreateModel();
              }}
            >
              <div className={styles.cardDashedIcon}>
                <IoMdAdd />
              </div>
              <h3 className="text-base font-semibold mb-1">Add Category</h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Create a new product group
              </p>
            </div>

            {/* Existing Categories */}
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className={styles.cardCategory}
                onClick={() => openEditModel(cat)}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={styles.cardAvatar}>
                        <FiFolder />
                      </div>
                      <div className="min-w-0 pr-2">
                        <h3 className={styles.cardTitle} title={cat.name}>
                          {cat.name}
                        </h3>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModel(cat);
                        }}
                        className={styles.btnIcon}
                        title="Edit Category"
                      >
                        <FiEdit2 className="text-sm" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(cat.id, cat.name);
                        }}
                        disabled={deleteCategory.isPending && deleteCategory.variables === cat.id}
                        className={styles.btnIconDanger}
                        title="Delete Category"
                      >
                        {deleteCategory.isPending && deleteCategory.variables === cat.id ? (
                          <span className="inline-block w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FiTrash2 className="text-sm" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Footer Info */}
                <div
                  className="flex items-center justify-between gap-2 pt-3 border-t"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <span className={styles.badgeSlug}>
                    /{cat.slug}
                  </span>
                  <div className={styles.statusLive}>
                    <span className={styles.statusDot} />
                    <span>Live</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Form */}
        <Form modelOpen={openModel} setModelOpen={handleCloseModal}>
          <form onSubmit={handleCategorySubmit} className="space-y-3" noValidate>
            <div className="flex items-center gap-2.5 mb-1">
              <div className={styles.cardAvatar} style={{ width: '2rem', height: '2rem', fontSize: '0.95rem' }}>
                <FiFolder />
              </div>
              <div>
                <h3 className="text-base font-bold">
                  {editingId ? 'Edit Category' : 'Create Category'}
                </h3>
                <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  {editingId ? 'Modify category naming' : 'Add a new category classification'}
                </p>
              </div>
            </div>

            {/* Server Error Alert Banner */}
            {serverError && (
              <div className={styles.alertBanner} role="alert">
                <FiAlertCircle className="text-sm flex-shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Category Name *
                </label>
                {categoryTouched && categoryError && (
                  <span className={styles.fieldError}>
                    {categoryError}
                  </span>
                )}
              </div>
              <input
                placeholder="e.g. Sparkling Drinks"
                value={categoryName}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  if (categoryTouched) {
                    setCategoryError(validateWithZod(e.target.value));
                  }
                  if (serverError) setServerError('');
                }}
                onBlur={() => {
                  setCategoryTouched(true);
                  setCategoryError(validateWithZod(categoryName));
                }}
                className={`${styles.inputField} ${categoryTouched && categoryError ? styles.inputError : ''}`}
                autoFocus
                disabled={isSubmitting}
                aria-invalid={Boolean(categoryTouched && categoryError)}
              />
              

              {categoryName.trim() && !categoryError && (
                <p className="text-[11px] font-mono pt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Slug preview: <span style={{ color: 'var(--text-accent)' }}>/{slugPreview}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseModal}
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
                <span>
                  {isSubmitting
                    ? 'Saving...'
                    : editingId
                    ? 'Save Changes'
                    : 'Create Category'}
                </span>
              </button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}