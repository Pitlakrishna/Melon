'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { loginFormSchema } from '@/lib/validations';
import styles from '../(auth)/auth.module.css';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, isLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const redirectUrl = rawRedirect && !rawRedirect.startsWith('/login') ? rawRedirect : '/category';

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectUrl);
    }
  }, [isLoading, isAuthenticated, router, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    // Client-side validation with Zod
    const validation = loginFormSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        toast.success('Successfully logged in! Welcome back.');
        router.replace(redirectUrl);
      } else {
        setServerError(res.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authCard}>
      <div className= {`mb-4 ${styles.brandHeader} `} >
        <div className={styles.brandBadge}>
          <LogIn size={14} /> Account Access
        </div>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>
          Sign in to access your dashboard
        </p>
      </div>

      {serverError && (
        <div className={styles.alertBox} style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {/* Email Field */}
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="email">
            Email Address
          </label>
          <div className={styles.inputWrapper}>
            <Mail className={styles.inputIcon} size={18} />
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
            <Lock className={styles.inputIcon} size={18} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="••••••••"
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              autoComplete="current-password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              className={styles.togglePasswordBtn}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <span className={styles.errorText}>{errors.password}</span>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            'Signing in...'
          ) : (
            <>
              <LogIn size={18} /> Sign In
            </>
          )}
        </button>
      </form>

      <div className={styles.footerText}>
        Don't have an account?
        <Link
          href={redirectUrl !== '/category' ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'}
          className={styles.footerLink}
        >
          Create account
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

export default function LoginPage() {
  return (
    <div className={styles.pageContainer}>
      <Suspense fallback={<div className={styles.authCard}>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
