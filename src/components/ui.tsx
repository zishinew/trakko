'use client';
import { useEffect, useRef, useId, isValidElement, cloneElement, type ReactElement } from 'react';
import { X, Loader2, AudioLines } from 'lucide-react';
import Link from 'next/link';
import { brand } from '@/lib/brand';
export function Logo({ small = false }: { small?: boolean }) {
  return (
    <Link href="/" className={`logo ${small ? 'small' : ''}`} aria-label={`${brand.name} home`}>
      <span className="logo-mark">
        <AudioLines size={20} />
      </span>
      <span>
        {brand.name}
        <span className="logo-period">.</span>
      </span>
    </Link>
  );
}
export function Button({
  children,
  busy = false,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  return (
    <button
      {...props}
      disabled={busy || props.disabled}
      aria-busy={busy}
      className={`button ${className}`}
    >
      {busy ? <Loader2 size={16} className="spin" /> : null}
      {children}
    </button>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (dialog)
      dialog.dataset.motion = document.activeElement?.matches(':focus-visible')
        ? 'instant'
        : 'enter';
    dialog?.showModal();
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`modal ${wide ? 'wide' : ''}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  const id = useId();
  const control =
    isValidElement(children) && ['input', 'select', 'textarea'].includes(String(children.type));
  return (
    <div className="field">
      {control ? <label htmlFor={id}>{label}</label> : <span>{label}</span>}
      {control ? cloneElement(children as ReactElement<{ id?: string }>, { id }) : children}
      {hint && <small>{hint}</small>}
    </div>
  );
}
export function Empty({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <AudioLines size={30} />
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div className={`notice ${error ? 'error' : ''}`} role={error ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
