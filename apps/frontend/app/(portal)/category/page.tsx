'use client';

import Form from "@/components/PopUp";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IoMdAdd } from "react-icons/io";
import { FiEdit2, FiTrash2, FiSearch, FiFolder, FiX, FiCheck } from "react-icons/fi";
import axios from "axios";
import { useState, useMemo } from "react";
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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  const clientQuery = useQueryClient();

  // Fetch Categories
  const { data: categoriesData, isLoading, isError, error } = useQuery<{ status: string; data: Category[] }>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/categories`);
      return res.data;
    },
  });

  const createCategory = useMutation({
    mutationFn: async (name: string) => {
      const res = await axios.post(`${API_URL}/categories`, { name });
      return res.data;
    },
    onSuccess: () => {
      clientQuery.invalidateQueries({ queryKey: ['categories'] });
      handleCloseModal();
    },
  });

  const editCategory = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await axios.patch(`${API_URL}/categories/${id}`, { name });
      return res.data;
    },
    onSuccess: () => {
      clientQuery.invalidateQueries({ queryKey: ['categories'] });
      handleCloseModal();
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`${API_URL}/categories/${id}`);
      return res.data;
    },
    onSuccess: () => {
      clientQuery.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const openCreateModel = () => {
    setEditingId(null);
    setCategoryName('');
    setOpenModel(true);
  };

  const openEditModel = (cat: Category) => {
    setEditingId(cat.id);
    setCategoryName(cat.name);
    setOpenModel(true);
  };

  const handleCloseModal = () => {
    setOpenModel(false);
    setEditingId(null);
    setCategoryName('');
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = categoryName.trim();
    if (!trimmed) return;

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
                  className="absolute right-3  top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ color: 'var(--text-primary)' }}
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
            <p className="text-sm text-red-300/80">
              {error instanceof Error ? error.message : 'An unexpected error occurred.'}
            </p>
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
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No categories found matching &ldquo;<span className="font-medium" style={{ color: 'var(--text-primary)' }}>{searchQuery}</span>&rdquo;
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-sm font-medium cursor-pointer"
              style={{ color: 'var(--text-accent)' }}
            >
              Clear search filter
            </button>
          </div>
        )}

        {/* Categories Grid */}
        {!isLoading && !isError && filteredCategories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {/* Create Category Dashed Card */}
            <div onClick={openCreateModel} className={styles.cardDashed}>
              <div className={styles.cardDashedIcon}>
                <IoMdAdd />
              </div>
              <span className="text-sm font-semibold hover:opacity-90 transition-opacity">
                Add New Category
              </span>
              <span className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Click to configure
              </span>
            </div>

            {/* Category Cards */}
            {filteredCategories.map((cat) => (
              <div key={cat.id} className={styles.cardCategory}>
                {/* Ambient Top Glow Border on hover */}
                <div className={styles.topGlow} />

                {/* Card Header & Controls */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={styles.cardAvatar}>
                        {cat.name.charAt(0).toUpperCase()}
                      </div>
                      <h2
                        className={styles.cardTitle}
                        title={cat.name}
                      >
                        {cat.name}
                      </h2>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
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
                        disabled={deleteCategory.isPending}
                        className={styles.btnIconDanger}
                        title="Delete Category"
                      >
                        <FiTrash2 className="text-sm" />
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
          <form onSubmit={handleCategorySubmit} className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={styles.cardAvatar} style={{ width: '2.5rem', height: '2.5rem', fontSize: '1.1rem' }}>
                <FiFolder />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {editingId ? 'Edit Category' : 'Create Category'}
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {editingId ? 'Modify category naming' : 'Add a new category classification'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Category Name
              </label>
              <input
                placeholder="e.g. Sparkling Drinks"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className={styles.inputField}
                autoFocus
              />
              {categoryName.trim() && (
                <p className="text-xs font-mono pt-1" style={{ color: 'var(--text-secondary)' }}>
                  Slug: <span style={{ color: 'var(--text-accent)' }}>/{slugPreview}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseModal}
                className={styles.btnSecondary}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !categoryName.trim()}
                className={styles.btnPrimary}
              >
                <FiCheck className="text-sm" />
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