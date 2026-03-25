'use client'

import { useState } from 'react'
import { DEALS } from '@/lib/constants'
import { formatPeso } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

type ProposalForm = {
  dealId: number
  brand: string
  dealName: string
  industry: string
  size: string
  services: string
  problem: string
  solution: string
  timeline: string
  pricingType: string
  pricing: string
}

function getDefaultForm(): ProposalForm {
  const d = DEALS[0]
  return {
    dealId: d.id,
    brand: d.brand,
    dealName: d.name,
    industry: d.industry,
    size: formatPeso(d.size),
    services: d.services.join(', '),
    problem: "Mlhuillier's loyalty system runs on legacy Oracle infrastructure with no mobile experience. Customer engagement is declining and the competition has launched modern digital loyalty programs.",
    solution: 'We propose building a full loyalty platform replacement with mobile-first design, real-time rewards tracking, and API-driven architecture that integrates with existing POS and payment systems.',
    timeline: '5 months',
    pricingType: 'Fixed',
    pricing: 'Discovery + Design: \u20B1300,000\nDevelopment Phase 1: \u20B11,200,000\nDevelopment Phase 2: \u20B1700,000\nTesting + Launch: \u20B1300,000\nTotal: \u20B12,500,000',
  }
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-black/[.06] rounded-xl p-4 shadow-[var(--shadow-card)]">
      <div className="text-[13px] font-semibold text-slate-900 mb-3">{title}</div>
      {children}
    </div>
  )
}

export function ProposalBuilder() {
  const [form, setForm] = useState<ProposalForm>(getDefaultForm)

  function updateField(key: keyof ProposalForm, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function selectDeal(id: string) {
    const d = DEALS.find(x => x.id === parseInt(id))
    if (!d) return
    setForm(prev => ({
      ...prev,
      dealId: d.id,
      brand: d.brand,
      dealName: d.name,
      industry: d.industry,
      size: formatPeso(d.size),
      services: d.services.join(', '),
    }))
  }

  return (
    <div className="p-4 md:p-6 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3.5 shrink-0">
        <div className="text-[13px] font-semibold text-slate-900">Proposal Builder</div>
        <div className="ml-auto flex gap-1.5">
          <button className="px-3 py-1.5 rounded-lg border border-black/[.08] text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition-colors duration-150 active:scale-[0.98]">
            Save Draft
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-[#6c63ff] hover:bg-[#5b52e8] text-white text-[12px] font-semibold transition-colors duration-150 active:scale-[0.98]">
            Export PDF
          </button>
        </div>
      </div>

      {/* Form + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-y-auto lg:overflow-hidden">
        {/* Left: Form */}
        <div className="overflow-y-auto flex flex-col gap-3.5">
          <SectionCard title="Deal Details">
            <div className="flex flex-col gap-2.5">
              <FormField label="Select Deal">
                <Select value={String(form.dealId)} onValueChange={selectDeal}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEALS.map(d => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.brand} — {d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <div className="grid grid-cols-2 gap-2.5">
                <FormField label="Client Brand">
                  <Input value={form.brand} onChange={e => updateField('brand', e.target.value)} />
                </FormField>
                <FormField label="Deal Name">
                  <Input value={form.dealName} onChange={e => updateField('dealName', e.target.value)} />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <FormField label="Industry">
                  <Input value={form.industry} onChange={e => updateField('industry', e.target.value)} />
                </FormField>
                <FormField label="Deal Size">
                  <Input value={form.size} onChange={e => updateField('size', e.target.value)} />
                </FormField>
              </div>
              <FormField label="Services Offered">
                <Input value={form.services} onChange={e => updateField('services', e.target.value)} />
              </FormField>
            </div>
          </SectionCard>

          <SectionCard title="Problem Statement">
            <Textarea
              value={form.problem}
              onChange={e => updateField('problem', e.target.value)}
              className="min-h-[80px] leading-relaxed text-[13px]"
            />
          </SectionCard>

          <SectionCard title="Proposed Solution">
            <Textarea
              value={form.solution}
              onChange={e => updateField('solution', e.target.value)}
              className="min-h-[80px] leading-relaxed text-[13px]"
            />
          </SectionCard>

          <SectionCard title="Timeline & Pricing">
            <div className="flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <FormField label="Timeline">
                  <Input value={form.timeline} onChange={e => updateField('timeline', e.target.value)} />
                </FormField>
                <FormField label="Pricing Type">
                  <Select value={form.pricingType} onValueChange={(v) => updateField('pricingType', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['Fixed', 'Range', 'Custom'].map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              <FormField label="Pricing Details">
                <Textarea
                  value={form.pricing}
                  onChange={e => updateField('pricing', e.target.value)}
                  className="min-h-[80px] leading-relaxed text-[13px]"
                />
              </FormField>
            </div>
          </SectionCard>
        </div>

        {/* Right: Live Preview */}
        <div className="overflow-y-auto">
          <div className="bg-white border border-black/[.06] rounded-xl shadow-md px-7 py-8 min-h-[600px]">
            {/* Logo */}
            <div className="text-center mb-6">
              <div
                className="w-9 h-9 rounded-xl inline-flex items-center justify-center font-extrabold text-white text-sm mb-3"
                style={{ background: '#6c63ff' }}
              >
                S
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Proposal for {form.brand}</h1>
              <p className="text-[12px] text-slate-400">{form.dealName} — Prepared by Symph — March 2026</p>
            </div>

            {/* Sections */}
            {[
              { title: 'About Symph', content: 'Symph is an AI-native software engineering and product agency based in Cebu, Philippines. We build production-grade software with modern stacks and ship fast.' },
              { title: 'The Problem', content: form.problem },
              { title: 'Our Solution', content: form.solution },
            ].map(sec => (
              <div key={sec.title} className="mb-5 pb-4 border-b border-black/[.06]">
                <h3 className="text-[13px] font-bold text-slate-900 mb-2">{sec.title}</h3>
                <p className="text-[12px] text-slate-600 leading-relaxed whitespace-pre-line">{sec.content}</p>
              </div>
            ))}

            {/* Services */}
            <div className="mb-5 pb-4 border-b border-black/[.06]">
              <h3 className="text-[13px] font-bold text-slate-900 mb-2">Services</h3>
              <div className="flex gap-1.5 flex-wrap">
                {form.services.split(',').map(s => (
                  <span
                    key={s.trim()}
                    className="text-[11px] font-medium px-2.5 py-[3px] rounded-full bg-[rgba(108,99,255,0.08)] text-[#6c63ff]"
                  >
                    {s.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="mb-5 pb-4 border-b border-black/[.06]">
              <h3 className="text-[13px] font-bold text-slate-900 mb-2">Timeline</h3>
              <p className="text-[12px] text-slate-600">{form.timeline}</p>
            </div>

            {/* Investment */}
            <div className="mb-6">
              <h3 className="text-[13px] font-bold text-slate-900 mb-2">Investment</h3>
              <p className="text-[18px] font-bold text-[#6c63ff] mb-2">{form.size}</p>
              <p className="text-[11px] text-slate-600 whitespace-pre-line leading-relaxed">{form.pricing}</p>
            </div>

            {/* Footer */}
            <div className="text-center pt-5 border-t border-black/[.06]">
              <p className="text-[11px] text-slate-400 mb-1">Let's build something great together.</p>
              <p className="text-[12px] text-[#6c63ff] font-semibold">gee@symph.co — symph.co</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
