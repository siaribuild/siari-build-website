import logo from '../../imports/logo-black-200-2.png'
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useSanity } from '../hooks/useSanity';
import { NAVIGATION_QUERY } from '../lib/queries';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { data: nav } = useSanity<any>(NAVIGATION_QUERY);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (slug: string) => location.pathname === (slug === 'home' ? '/' : `/${slug}`);

  const menuItems = nav?.headerMenu || [];
  const ctaEnabled = nav?.headerCtaEnabled && menuItems.length > 0;
  const regularItems = ctaEnabled ? menuItems.slice(0, -1) : menuItems;
  const ctaItem = ctaEnabled ? menuItems[menuItems.length - 1] : null;

  const hrefFor = (slug: string) => (slug === 'home' ? '/' : `/${slug}`);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#111111]/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="SIARI BUILD" className="h-16 w-auto brightness-0 invert" />
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

          <button
            className="lg:hidden text-[#F5F3EF]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#111111] text-[#F5F3EF] border-t border-[#B8946A]/20">
          <nav className="flex flex-col px-6 py-8 gap-6">
            {regularItems.map((item: any) => (
              <Link
                key={item.pageSlug}
                to={hrefFor(item.pageSlug)}
                className="text-sm tracking-wider uppercase"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label || item.pageTitle}
              </Link>
            ))}
            {ctaItem && (
              <Link
                to={hrefFor(ctaItem.pageSlug)}
                className="bg-[#B8946A] text-[#F5F3EF] px-8 py-3 text-sm tracking-wider uppercase w-full text-center"
                style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {ctaItem.label || ctaItem.pageTitle}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
