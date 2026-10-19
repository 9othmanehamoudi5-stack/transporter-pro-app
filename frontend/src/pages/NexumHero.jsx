import React, { useState, useEffect } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';

export const NexumHero = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    document.title = 'Nexum Hero';
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Modules', hasChevron: false },
    { label: 'Clientele', hasChevron: false },
    { label: 'Solutions', hasChevron: true },
    { label: 'Billing', hasChevron: false },
  ];

  return (
    <section 
      className="relative h-screen w-full overflow-hidden antialiased select-none"
      style={{ fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Background video (exact URL + full-bleed object-cover, no overlay gradient) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260803_192301_9231ed6b-c55c-4a48-909c-4ebe11cf2e11.mp4"
      />

      {/* Main container positioned over video at z-10 */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Navigation Bar */}
        <header className="w-full flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 lg:px-12">
          {/* Logo + brand wordmark */}
          <a href="#" className="flex items-center gap-2 group">
            <svg
              width="24"
              height="24"
              viewBox="0 0 256 256"
              className="fill-[#010101] lg:fill-white transition-colors"
            >
              <path d="M 128 128 C 128 198.692 70.692 256 0 256 C 0 185.308 57.308 128 128 128 Z M 128 128 C 198.692 128 256 185.308 256 256 C 185.308 256 128 198.692 128 128 Z M 0 0 C 70.692 0 128 57.308 128 128 C 57.308 128 0 70.692 0 0 Z M 256 0 C 256 70.692 198.692 128 128 128 C 128 57.308 185.308 0 256 0 Z" />
            </svg>
            <span className="text-lg font-semibold lowercase text-[#010101] lg:text-white transition-colors">
              nexum
            </span>
          </a>

          {/* Desktop Navigation (hidden md:flex) */}
          <nav className="hidden md:flex items-center gap-3">
            {/* Glass pill cluster */}
            <div className="rounded-full bg-white/10 px-1.5 py-1.5 backdrop-blur-lg flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={`#${link.label.toLowerCase()}`}
                  className="rounded-full px-4 py-1.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1"
                >
                  {link.label}
                  {link.hasChevron && <ChevronDown className="w-3.5 h-3.5" />}
                </a>
              ))}
            </div>

            {/* Separate Get started pill */}
            <button
              className="rounded-full px-5 text-sm font-medium text-white self-stretch flex items-center justify-center transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(to bottom, #2B2B2B, #101010)' }}
            >
              Get started
            </button>
          </nav>

          {/* Mobile hamburger (md:hidden) */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="md:hidden h-10 w-10 rounded-full bg-white/10 backdrop-blur-lg z-50 flex items-center justify-center relative focus:outline-none"
          >
            <Menu
              className={`w-5 h-5 text-[#010101] lg:text-white transition-all duration-300 absolute ${
                mobileMenuOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
              }`}
            />
            <X
              className={`w-5 h-5 text-[#010101] lg:text-white transition-all duration-300 absolute ${
                mobileMenuOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
              }`}
            />
          </button>
        </header>

        {/* Mobile menu glass overlay + drawer */}
        <div
          onClick={() => setMobileMenuOpen(false)}
          className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-md transition-opacity duration-300 md:hidden ${
            mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        />

        <div
          className={`fixed right-0 top-0 z-40 h-full w-72 bg-black/90 backdrop-blur-xl flex flex-col md:hidden transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Mobile links */}
          <div className="px-6 pt-24 flex flex-col gap-2">
            {navLinks.map((link, idx) => (
              <a
                key={link.label}
                href={`#${link.label.toLowerCase()}`}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  transitionDelay: mobileMenuOpen ? `${(idx + 1) * 60}ms` : '0ms',
                }}
                className={`rounded-xl px-4 py-3.5 text-base font-medium text-white/80 hover:bg-white/10 hover:text-white flex items-center justify-between transition-all duration-300 ${
                  mobileMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'
                }`}
              >
                <span>{link.label}</span>
                {link.hasChevron && <ChevronDown className="w-4 h-4 text-white/60" />}
              </a>
            ))}
          </div>

          {/* Bottom CTA in drawer */}
          <div className="mt-auto px-6 pb-10">
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{
                background: 'linear-gradient(to bottom, #2B2B2B, #101010)',
                transitionDelay: mobileMenuOpen ? '300ms' : '0ms',
              }}
              className={`w-full rounded-full py-3.5 text-sm font-medium text-white text-center hover:opacity-90 transition-all duration-400 ${
                mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              Get started
            </button>
          </div>
        </div>

        {/* Main Content (mt-auto bottom-anchored) */}
        <div className="mt-auto px-5 pb-8 sm:px-8 sm:pb-12 lg:px-12 lg:pb-16 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 sm:gap-8">
          {/* Left: headline + email CTA */}
          <div className="max-w-xl">
            <h1 className="text-3xl sm:text-4xl lg:text-[3.5rem] font-semibold leading-[1.1] tracking-tight text-[#010101] lg:text-white transition-colors">
              Ship AI workers that grind while you rest
            </h1>

            {/* Email CTA */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email) alert(`Email submitted: ${email}`);
              }}
              className="mt-6 sm:mt-8 w-full sm:w-auto inline-flex flex-col sm:flex-row sm:items-center sm:rounded-full sm:bg-white sm:p-1.5 gap-3 sm:gap-0"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Type your email"
                className="rounded-full bg-white px-5 py-3 text-sm text-gray-900 placeholder-gray-400 w-full sm:w-64 sm:rounded-none sm:bg-transparent sm:px-4 sm:py-2 outline-none shadow-sm sm:shadow-none"
              />
              <button
                type="submit"
                className="rounded-full px-6 py-3 sm:py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity whitespace-nowrap text-center"
                style={{ background: 'linear-gradient(to bottom, #2B2B2B, #101010)' }}
              >
                Get started
              </button>
            </form>
          </div>

          {/* Right: two glass cards */}
          <div className="flex flex-col gap-4 sm:flex-row lg:w-auto lg:gap-5">
            {/* Stats card */}
            <div className="sm:w-64 flex flex-col justify-between rounded-2xl bg-white/10 backdrop-blur-lg p-5 sm:p-6 shadow-sm">
              <div
                className="text-3xl sm:text-4xl font-normal tracking-tight text-[#010101] lg:text-white transition-colors"
                style={{ fontFamily: "'Silkscreen', cursive" }}
              >
                42,500+
              </div>
              <p className="text-sm leading-relaxed mt-3 sm:mt-4 text-[#010101]/70 lg:text-white/70 transition-colors">
                Teams run Nexum to handle recurring ops daily.
              </p>
            </div>

            {/* Testimonial card */}
            <div className="sm:w-64 flex flex-col justify-between rounded-2xl bg-white/10 backdrop-blur-lg p-5 sm:p-6 shadow-sm">
              <div>
                {/* Header row */}
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="w-6 h-6 rounded-md bg-black flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    S
                  </div>
                  <span className="text-sm font-semibold text-[#010101] lg:text-white transition-colors">
                    Stratify
                  </span>
                </div>

                {/* Quote */}
                <p className="text-sm leading-relaxed text-[#010101]/80 lg:text-white/80 transition-colors">
                  "With Nexum we went from managing tedious operational work to having AI agents that handle everything."
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 mt-4 sm:mt-5">
                <img
                  src="https://i.pravatar.cc/72?img=12"
                  alt="Sara Klein"
                  className="w-9 h-9 rounded-full object-cover bg-white/20 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#010101] lg:text-white truncate transition-colors">
                    Sara Klein
                  </p>
                  <p className="text-xs text-[#010101]/60 lg:text-white/60 truncate transition-colors">
                    Dir of Operations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NexumHero;
