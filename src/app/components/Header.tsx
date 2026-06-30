import logo from '../../imports/logo-black-200-2.png'
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useSanity } from '../hooks/useSanity';
import { NAVIGATION_QUERY, SITE_SETTINGS_QUERY } from '../lib/queries';
import { ObfuscatedEmail } from './ObfuscatedEmail';

const EASE = 'cubic-bezier(0.22,1,0.36,1)';

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { data: nav } = useSanity<any>(NAVIGATION_QUERY);
  const { data: settings } = useSanity<any>(SITE_SETTINGS_QUERY);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close on navigation
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Close when crossing up to the desktop breakpoint (drawer is lg:hidden)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => { if (e.matches) setOpen(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Keep the closed (off-screen) drawer out of the tab order
  useEffect(() => {
    if (panelRef.current) (panelRef.current as any).inert = !open;
  }, [open]);

  // Focus the close button on open, trap Tab within the panel, Escape to close,
  // and restore focus to the trigger on close.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const inPanel = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])') ?? []);

    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key !== 'Tab') return;
      const items = inPanel();
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      triggerRef.current?.focus();
    };
  }, [open]);

  const isActive = (slug: string) => location.pathname === (slug === 'home' ? '/' : `/${slug}`);
  const hrefFor = (slug: string) => (slug === 'home' ? '/' : `/${slug}`);

  const menuItems = nav?.headerMenu || [];
  const ctaEnabled = nav?.headerCtaEnabled && menuItems.length > 0;
  const regularItems = ctaEnabled ? menuItems.slice(0, -1) : menuItems;
  const ctaItem = ctaEnabled ? menuItems[menuItems.length - 1] : null;

  const line = 'absolute left-0.5 right-0.5 h-[2px] rounded bg-[#F5F3EF]';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#111111]/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="SIARI BUILD" width={200} height={200} className="h-16 w-auto brightness-0 invert" />
          </Link>

          <nav className="hidden lg:flex items-center gap-12">
            {regularItems.map((item: any) => (
              <Link key={item.pageSlug} to={hrefFor(item.pageSlug)} className="relative group">
                <span className={`text-sm tracking-wider uppercase transition-colors text-[#F5F3EF] ${isActive(item.pageSlug) ? 'text-[#B8946A]' : ''}`}>
                  {item.label || item.pageTitle}
                </span>
                <span className={`absolute bottom-0 left-0 h-[2px] bg-[#B8946A] transition-all ${isActive(item.pageSlug) ? 'w-full' : 'w-0 group-hover:w-full'}`}
                      style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 100%, 0 100%)' }}></span>
              </Link>
            ))}
            {ctaItem && (
              <Link
                to={hrefFor(ctaItem.pageSlug)}
                className="bg-[#B8946A] text-[#F5F3EF] px-8 py-3 text-sm tracking-wider uppercase transition-all hover:bg-[#F5F3EF] hover:text-[#111111]"
                style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
              >
                {ctaItem.label || ctaItem.pageTitle}
              </Link>
            )}
          </nav>

          {/* Open trigger (hamburger). The drawer carries its own close (X). */}
          <button
            ref={triggerRef}
            className="lg:hidden relative w-6 h-6"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-drawer"
          >
            <span className={`${line} top-[6px]`} />
            <span className={`${line} top-1/2 -translate-y-1/2`} />
            <span className={`${line} top-[16px]`} />
          </button>
        </div>
      </div>

      {/* Scrim — above the header so the drawer's own X is never covered */}
      <div
        className={`lg:hidden fixed inset-0 z-[60] bg-black/55 transition-opacity duration-[440ms] motion-reduce:transition-none ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        ref={panelRef}
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`lg:hidden fixed top-0 right-0 z-[70] h-[100dvh] w-[85vw] sm:w-[400px] flex flex-col pt-24 px-7 pb-9 bg-[#141414] border-l-4 border-[#B8946A] shadow-2xl transition-transform duration-[440ms] motion-reduce:transition-none ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ transitionTimingFunction: EASE, clipPath: 'polygon(26px 0, 100% 0, 100% 100%, 0 100%, 0 26px)' }}
      >
        {/* Explicit close */}
        <button
          ref={closeRef}
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="absolute top-5 right-5 w-11 h-11 flex items-center justify-center text-[#F5F3EF] hover:text-[#B8946A] transition-colors"
        >
          <X size={26} strokeWidth={2} />
        </button>

        <nav className="flex flex-col">
          {regularItems.map((item: any, i: number) => (
            <Link
              key={item.pageSlug}
              to={hrefFor(item.pageSlug)}
              onClick={() => setOpen(false)}
              className={`group text-right py-4 border-b border-[#F5F3EF]/10 transition-all duration-[400ms] motion-reduce:transition-none ${
                open ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'
              }`}
              style={{ transitionTimingFunction: EASE, transitionDelay: open ? `${0.1 + i * 0.06}s` : '0s' }}
            >
              <span className="block text-[0.62rem] tracking-[0.25em] text-[#B8946A] mb-1.5">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className={`text-3xl font-bold transition-colors group-hover:text-[#B8946A] ${
                  isActive(item.pageSlug) ? 'text-[#B8946A]' : 'text-[#F5F3EF]'
                }`}
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {item.label || item.pageTitle}
              </span>
            </Link>
          ))}
        </nav>

        {/* CTA — right after the links, in the attention zone (not buried at the bottom) */}
        {ctaItem && (
          <div
            className={`mt-9 flex justify-end transition-all duration-[400ms] motion-reduce:transition-none ${
              open ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'
            }`}
            style={{ transitionTimingFunction: EASE, transitionDelay: open ? `${0.1 + regularItems.length * 0.06}s` : '0s' }}
          >
            <Link
              to={hrefFor(ctaItem.pageSlug)}
              onClick={() => setOpen(false)}
              className="bg-[#B8946A] text-[#F5F3EF] px-9 py-4 text-sm tracking-wider uppercase transition-colors hover:bg-[#F5F3EF] hover:text-[#111111]"
              style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
            >
              {ctaItem.label || ctaItem.pageTitle}
            </Link>
          </div>
        )}

        {/* Contact — anchored to the bottom */}
        {(settings?.phone || settings?.email) && (
          <div
            className={`mt-auto pt-8 flex flex-col items-end gap-2 text-right transition-opacity duration-[400ms] motion-reduce:transition-none ${
              open ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transitionDelay: open ? '0.42s' : '0s' }}
          >
            <div className="text-[0.6rem] tracking-[0.25em] uppercase text-[#B8946A]/70">Get in touch</div>
            {settings.phone && (
              <a
                href={`tel:${String(settings.phone).replace(/[^\d+]/g, '')}`}
                className="text-[#F5F3EF] hover:text-[#B8946A] transition-colors"
              >
                {settings.phone}
              </a>
            )}
            {settings.email && (
              <ObfuscatedEmail email={settings.email} className="text-[#F5F3EF] hover:text-[#B8946A] transition-colors" />
            )}
          </div>
        )}
      </aside>
    </header>
  );
}
