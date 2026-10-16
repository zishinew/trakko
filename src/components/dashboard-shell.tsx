'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Disc3,
  ShoppingBag,
  Store,
  Settings,
  ArrowUpRight,
  Plus,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  Tag,
  Users,
  BarChart3,
  Handshake,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Logo } from './ui';
import { post } from '@/lib/client';
import type { Store as StoreType } from '@/lib/types';
const links = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Beats', href: '/dashboard/beats', icon: Disc3 },
  { label: 'Orders', href: '/dashboard/orders', icon: ShoppingBag },
  { label: 'Promotions', href: '/dashboard/promotions', icon: Tag },
  { label: 'Audience', href: '/dashboard/audience', icon: Users },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Collaborators', href: '/dashboard/collaborators', icon: Handshake },
  { label: 'Store', href: '/dashboard/store', icon: Store },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];
export function DashboardShell({
  store,
  demo,
  children,
}: {
  store: StoreType;
  demo: boolean;
  children: React.ReactNode;
}) {
  const path = usePathname(),
    [open, setOpen] = useState(false),
    [navMotion, setNavMotion] = useState(false),
    [error, setError] = useState('');
  const sidebarRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const menuButton = menuRef.current;
    document.body.style.overflow = 'hidden';
    sidebarRef.current
      ?.querySelector<HTMLButtonElement>('button[aria-label="Close navigation"]')
      ?.focus();
    function keydown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
      if (e.key !== 'Tab') return;
      const controls = Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)') || [],
      ).filter((el) => el.getClientRects().length);
      const first = controls[0],
        last = controls.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    const desktop = window.matchMedia('(min-width: 761px)');
    const onResize = () => {
      if (desktop.matches) setOpen(false);
    };
    document.addEventListener('keydown', keydown);
    desktop.addEventListener('change', onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', keydown);
      desktop.removeEventListener('change', onResize);
      menuButton?.focus();
    };
  }, [open]);
  async function logout() {
    try {
      const result = await post<{ url: string }>('/api/auth', { action: 'logout' });
      window.location.assign(result.url);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="dashboard">
      <aside
        ref={sidebarRef}
        data-motion={navMotion ? 'enter' : 'instant'}
        aria-label="Producer navigation"
        role={open ? 'dialog' : undefined}
        aria-modal={open || undefined}
        className={`sidebar ${open ? 'open' : ''}`}
      >
        <div className="sidebar-logo">
          <Logo />
          <button
            className="icon-button mobile-only"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X size={19} />
          </button>
        </div>
        <div className="workspace-identity">
          <img src={store.avatar_url || '/demo/avatar.svg'} alt="" />
          <div>
            <strong>{store.display_name}</strong>
            <span>Producer workspace</span>
          </div>
          <span className="status-dot" />
        </div>
        <nav aria-label="Producer workspace">
          {links.map(({ label, href, icon: Icon }, index) => (
            <div key={href}>
              {[0, 3, 7].includes(index) && (
                <span className="sidebar-label">
                  {index === 0 ? 'YOUR MUSIC' : index === 3 ? 'GROW YOUR BUSINESS' : 'YOUR STORE'}
                </span>
              )}
              <Link
                href={href}
                aria-current={path === href ? 'page' : undefined}
                className={path === href ? 'active' : ''}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                {label}
                {path === href && <span className="nav-dot" />}
              </Link>
            </div>
          ))}
        </nav>
        <Link className="sidebar-store" href={`/${store.username}`} target="_blank">
          Visit your store <ArrowUpRight size={16} />
        </Link>
        <div className="sidebar-bottom">
          <div className="free-plan">
            <span className="status-dot" />
            <strong>Free. Always.</strong>
            <p>No plans. Just possibilities.</p>
          </div>
          <button onClick={logout}>
            <LogOut size={16} /> Log out
          </button>
          <Link href="/">
            <ArrowLeft size={16} /> Back to home
          </Link>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
        </div>
      </aside>
      {open && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="dashboard-main" inert={open}>
        <header className="dashboard-top">
          <div>
            <button
              className="icon-button mobile-only"
              ref={menuRef}
              aria-label="Open navigation"
              aria-expanded={open}
              onClick={(e) => {
                setNavMotion(e.detail > 0);
                setOpen(true);
              }}
            >
              <Menu size={21} />
            </button>
            <span>{links.find((l) => l.href === path)?.label || 'Workspace'}</span>
            <span className="top-divider">/</span>
            <span className="muted">{store.display_name}</span>
          </div>
          <div>
            {demo && <span className="demo-badge">DEMO WORKSPACE</span>}
            <a className="text-link" href={`/${store.username}`} target="_blank" rel="noreferrer">
              View store <ArrowUpRight size={14} />
            </a>
            <img src={store.avatar_url || '/demo/avatar.svg'} alt="Your profile" />
          </div>
        </header>
        {demo && (
          <div className="demo-bar">
            <span className="status-dot" /> You’re in a local demo. Changes are saved in this
            browser’s sandbox; purchases are simulated.
          </div>
        )}
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
export function PageHeading({
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function UploadLink() {
  return (
    <Link href="/dashboard/beats?upload=1" className="button primary">
      <Plus size={16} /> Upload beat
    </Link>
  );
}
