import { useState, useRef } from 'react'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { useRootData } from '../../lib/root-data'
import { ObfuscatedEmail } from '../ObfuscatedEmail'
import { themeBg, sectionPad, type Theme } from './themeUtils'

interface Props {
  theme?: Theme
  joinTop?: boolean
  joinBottom?: boolean
  formHeading?: string
  infoHeading?: string
  /** Baked at build time by the route loader; falls back to a client fetch if absent. */
  categories?: any[]
}

export function ContactFormBlock({ theme = 'light', formHeading = 'Send Us A Message', infoHeading = 'Contact Info', joinTop, joinBottom, categories }: Props) {
  // Site settings are baked by the root loader (available on every page), so the
  // address/phone/email/hours cards render into the static HTML.
  const { settings } = useRootData()
  // All categories shown here (not just ones with existing projects) — a new
  // project type may not have a published project yet but should still be selectable.
  const turnstileRef = useRef<TurnstileInstance>(null)

  const defaultProjectType = categories?.[0]?.title || ''

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', projectType: '', message: '' })
  const [token, setToken] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      setErrorMsg('Please complete the verification check.')
      return
    }

    setStatus('sending')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          projectType: form.projectType || defaultProjectType,
          turnstileToken: token,
        }),
      })

      if (res.ok) {
        setStatus('sent')
        setForm({ firstName: '', lastName: '', email: '', phone: '', projectType: '', message: '' })
        turnstileRef.current?.reset()
        setToken(null)
      } else {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data.error || 'Something went wrong. Please try again.')
        setStatus('error')
        turnstileRef.current?.reset()
        setToken(null)
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again or email us directly.')
      setStatus('error')
      turnstileRef.current?.reset()
      setToken(null)
    }
  }

  const inputClass = "field px-4 py-4"
  const inputStyle = { clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }

  return (
    <section className={`${sectionPad(joinTop, joinBottom)} ${themeBg(theme)}`}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">

          {/* Form */}
          <div className="lg:col-span-3">
            <h2 className="mb-8" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700 }}>{formHeading}</h2>

            {status === 'sent' ? (
              <div className="surface-cream p-10 brand-border-left" style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)' }}>
                <h3 className="text-2xl font-bold mb-3">Message Sent</h3>
                <p className="opacity-70">Thank you for getting in touch. We'll be in contact shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block mb-2 text-sm tracking-wider uppercase">First Name</label>
                    <input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} required type="text" className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block mb-2 text-sm tracking-wider uppercase">Last Name</label>
                    <input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} required type="text" className={inputClass} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block mb-2 text-sm tracking-wider uppercase">Email</label>
                  <input id="email" name="email" value={form.email} onChange={handleChange} required type="email" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label htmlFor="phone" className="block mb-2 text-sm tracking-wider uppercase">Phone</label>
                  <input id="phone" name="phone" value={form.phone} onChange={handleChange} type="tel" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label htmlFor="projectType" className="block mb-2 text-sm tracking-wider uppercase">Project Type</label>
                  <select id="projectType" name="projectType" value={form.projectType || defaultProjectType} onChange={handleChange} className={inputClass} style={inputStyle}>
                    {!defaultProjectType && <option value="">Select a type...</option>}
                    {categories?.map((c: any) => (
                      <option key={c._id} value={c.title}>{c.title}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block mb-2 text-sm tracking-wider uppercase">Message</label>
                  <textarea id="message" name="message" value={form.message} onChange={handleChange} required rows={6} className={`${inputClass} resize-none`} style={inputStyle} />
                </div>

                <div>
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                    onSuccess={setToken}
                    onExpire={() => setToken(null)}
                    onError={() => setToken(null)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="btn-primary px-12 py-4 text-sm tracking-wider uppercase transition-all disabled:opacity-50"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
                >
                  {status === 'sending' ? 'Sending...' : 'Send Message'}
                </button>
                {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-2">
            <h2 className="mb-8" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700 }}>{infoHeading}</h2>
            <div className="space-y-6">
              {settings?.address && (
                <InfoCard icon={<MapPin className="text-[#111111]" size={24} />} title="Address" value={settings.address} />
              )}
              {settings?.phone && (
                <InfoCard icon={<Phone className="text-[#111111]" size={24} />} title="Phone" value={settings.phone} href={`tel:${String(settings.phone).replace(/[^\d+]/g, '')}`} />
              )}
              {settings?.email && (
                <div className="surface-cream p-6 brand-border-left" style={{ clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 0 100%)' }}>
                  <div className="flex items-start gap-4">
                    <div className="info-icon">
                      <Mail className="text-[#111111]" size={24} />
                    </div>
                    <div>
                      <h3 className="mb-1" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Email</h3>
                      <ObfuscatedEmail email={settings.email} className="opacity-70 hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              )}
              {settings?.workingHours && (
                <InfoCard icon={<Clock className="text-[#111111]" size={24} />} title="Working Hours" value={settings.workingHours} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function InfoCard({ icon, title, value, href }: { icon: React.ReactNode; title: string; value: string; href?: string }) {
  return (
    <div className="surface-cream p-6 brand-border-left" style={{ clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 0 100%)' }}>
      <div className="flex items-start gap-4">
        <div className="info-icon">
          {icon}
        </div>
        <div>
          <h3 className="mb-1" style={{ fontSize: '1.125rem', fontWeight: 600 }}>{title}</h3>
          {href ? (
            <a href={href} className="opacity-70 whitespace-pre-line hover:opacity-100 hover-accent transition-colors">{value}</a>
          ) : (
            <p className="opacity-70 whitespace-pre-line">{value}</p>
          )}
        </div>
      </div>
    </div>
  )
}
