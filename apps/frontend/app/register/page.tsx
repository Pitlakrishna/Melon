'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { registerFormSchema } from '@/lib/validations';
import styles from '../(auth)/auth.module.css';

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isAuthenticated, isLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const redirectUrl = rawRedirect && !rawRedirect.startsWith('/login') && !rawRedirect.startsWith('/register') ? rawRedirect : '/category';

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectUrl);
    }
  }, [isLoading, isAuthenticated, router, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    // Client-side validation with Zod
    const validation = registerFormSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await register(name, email, password);
      if (res.success) {
        toast.success('Account created successfully! Welcome.');
        router.replace(redirectUrl);
      } else {
        setServerError(res.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authCard}>
      <div className={styles.brandHeader}>
        <div className={styles.brandBadge}>
          <UserPlus size={14} /> Create Account
        </div>
        <h1 className={styles.title}>Get Started</h1>
        <p className={styles.subtitle}>
          Sign up to manage your dashboard
        </p>
      </div>

      {serverError && (
        <div className={styles.alertBox} style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {/* Full Name Field */}
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="name">
            Full Name
          </label>
          <div className={styles.inputWrapper}>
            <User className={styles.inputIcon} size={14} />
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="e.g. John Doe"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              autoComplete="name"
              disabled={isSubmitting}
            />
          </div>
          {errors.name && <span className={styles.errorText}>{errors.name}</span>}
        </div>

        {/* Email Field */}
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="email">
            Email Address
          </label>
          <div className={styles.inputWrapper}>
            <Mail className={styles.inputIcon} size={14} />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="name@example.com"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>
          {errors.email && <span className={styles.errorText}>{errors.email}</span>}
        </div>

        {/* Password Field */}
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <div className={styles.inputWrapper}>
            <Lock className={styles.inputIcon} size={14} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="At least 6 characters"
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              autoComplete="new-password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              className={styles.togglePasswordBtn}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {errors.password && <span className={styles.errorText}>{errors.password}</span>}
        </div>

        {/* Confirm Password Field */}
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="confirmPassword">
            Confirm Password
          </label>
          <div className={styles.inputWrapper}>
            <Lock className={styles.inputIcon} size={14} />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              placeholder="Re-enter password"
              className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
              autoComplete="new-password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              className={styles.togglePasswordBtn}
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            'Creating account...'
          ) : (
            <>
              <UserPlus size={14} /> Create Account
            </>
          )}
        </button>
      </form>

      <div className={styles.footerText}>
        Already have an account?
        <Link
          href={redirectUrl !== '/category' ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
          className={styles.footerLink}
        >
          Sign in
        </Link>
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link href="/" className={styles.backHomeLink}>
          <ArrowLeft size={14} /> Return to Home
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className={styles.pageContainer}>
      <Suspense fallback={<div className={styles.authCard}>Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
