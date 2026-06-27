'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  Camera,
  MapPin,
  ScanEye,
  Radio,
  Smartphone,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { Wordmark, SpikeMark } from '@/components/brand/SpikeMark';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { CASCADE_STAGES } from '@/lib/missing/cascade';
import { formatDistance } from '@/lib/geo';

const features = [
  {
    icon: Bell,
    title: 'Proximity alert feed',
    body: 'Every nearby phone gets the alert first. Cases surface closest-first, so the people best placed to help see them instantly.',
  },
  {
    icon: ScanEye,
    title: 'Proactive sightings',
    body: 'Spot someone who looks lost — a crying child, a confused elder — and report them before a family even knows to look.',
  },
  {
    icon: Radio,
    title: 'Expanding cascade',
    body: 'Alerts widen automatically: 500 m, then 1 km, then sector-wide, then Mela-wide — overridable by command at any moment.',
  },
  {
    icon: Camera,
    title: 'CCTV coverage intel',
    body: 'Camera locations map to coverage and blind spots, routing field teams exactly where the network cannot see.',
  },
  {
    icon: MapPin,
    title: 'Live operations map',
    body: 'Cases, sightings and crowd density on one canvas for the Integrated Command & Control Center.',
  },
  {
    icon: Users,
    title: 'Crowd as a sensor',
    body: 'Anonymized app locations extrapolate real density — even 0.5% adoption across 17M visitors is 85,000 live data points.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Nav */}
      <nav className="sticky top-0 z-40 h-16 bg-canvas/85 backdrop-blur-md hairline-b">
        <div className="max-w-[1200px] mx-auto h-full px-6 flex items-center justify-between">
          <Wordmark />
          <div className="hidden md:flex items-center gap-8 text-[14px] font-medium text-body">
            <a href="#how" className="hover:text-ink transition-colors">How it works</a>
            <a href="#cascade" className="hover:text-ink transition-colors">Alert cascade</a>
            <a href="#features" className="hover:text-ink transition-colors">Platform</a>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link href="/dashboard" className="btn-coral inline-flex items-center gap-1.5 h-10 px-4 sm:px-5">
              <span className="hidden sm:inline">Open dashboard</span>
              <span className="sm:hidden">Dashboard</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="badge-pill inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-success" /> No hardware · works on any phone
          </span>
          <h1 className="display-xl mt-6">
            Turn every phone into the largest search network in history.
          </h1>
          <p className="text-[18px] leading-relaxed text-body mt-6 max-w-xl">
            At 17 million pilgrims a day, even a fraction with smartphones becomes a living
            missing-persons network. KumbhRaksha connects the people who are lost with the
            people standing right next to them.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-8">
            <Link href="/dashboard" className="btn-coral inline-flex items-center gap-2 h-11 px-6">
              Open the command center <ArrowRight className="size-4" />
            </Link>
            <a href="#how" className="btn-secondary inline-flex items-center gap-2 h-11 px-6">
              See how it works
            </a>
          </div>
          <div className="flex items-center gap-8 mt-10">
            {[
              ['17M', 'Visitors / day'],
              ['<5 min', 'To first alert'],
              ['2', 'Apps · citizen + authority'],
            ].map(([v, l]) => (
              <div key={l}>
                <p className="font-display text-3xl leading-none">{v}</p>
                <p className="text-[13px] text-muted mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hero artifact — dark product mockup */}
        <div className="card-dark p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-success animate-[pulse-soft_2s_ease-in-out_infinite]" />
              <span className="font-mono text-[12px] text-on-dark-soft tracking-wider">
                ICCC · LIVE OPERATIONS
              </span>
            </div>
            <SpikeMark className="size-4 text-on-dark-soft" />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              ['3', 'Active cases'],
              ['1', 'Child at risk'],
              ['2', 'To triage'],
            ].map(([v, l]) => (
              <div key={l} className="rounded-lg bg-surface-dark-elevated p-3">
                <p className="font-display text-2xl text-on-dark leading-none">{v}</p>
                <p className="text-[11px] text-on-dark-soft mt-1.5">{l}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-surface-dark-soft p-4 space-y-3">
            {[
              ['Aarav Sharma · 6', 'Ramkund · L2', 'bg-coral'],
              ['Kamla Devi · 72', 'Panchavati · L3', 'bg-coral'],
              ['Imran Khan · 9', 'Kapaleshwar · L0', 'bg-accent-amber'],
            ].map(([name, loc, dot]) => (
              <div key={name} className="flex items-center gap-3">
                <span className={`size-2.5 rounded-full ${dot}`} />
                <span className="text-on-dark text-[13px] flex-1">{name}</span>
                <span className="text-on-dark-soft text-[12px] font-mono">{loc}</span>
              </div>
            ))}
          </div>
          <p className="text-on-dark-soft text-[12px] mt-4 font-mono">
            1,840 phones notified · radius expanding
          </p>
        </div>
      </section>

      {/* Two flows */}
      <section id="how" className="bg-surface-soft">
        <div className="max-w-[1200px] mx-auto px-6 py-24">
          <p className="caption-upper text-coral">How it works</p>
          <h2 className="display-lg mt-3 max-w-2xl">Two flows. One network.</h2>
          <div className="grid md:grid-cols-2 gap-6 mt-10">
            <div className="card-cream p-8">
              <span className="badge-coral">Flow A · Reactive</span>
              <h3 className="display-sm mt-4">Someone is reported missing</h3>
              <p className="text-body mt-3 leading-relaxed">
                A family files a report in seconds. The case lands on the command dashboard and
                pushes to every phone near the last-seen location — while nearby CCTV is
                highlighted for authorities to check.
              </p>
            </div>
            <div className="card-cream p-8">
              <span className="badge-coral">Flow B · Proactive</span>
              <h3 className="display-sm mt-4">Someone simply looks lost</h3>
              <p className="text-body mt-3 leading-relaxed">
                A citizen spots a confused elder or a crying child and uploads a photo with
                location. The dashboard triages it — and if it matches an open case, the family
                is notified instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cascade */}
      <section id="cascade" className="max-w-[1200px] mx-auto px-6 py-24">
        <p className="caption-upper text-coral">The alert cascade</p>
        <h2 className="display-lg mt-3 max-w-2xl">
          One report. A widening ripple across the Mela.
        </h2>
        <div className="card-dark rounded-2xl p-8 mt-10">
          <ol className="grid md:grid-cols-5 gap-6">
            {CASCADE_STAGES.map((s) => (
              <li key={s.level}>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-coral" />
                  <span className="font-mono text-[12px] text-on-dark-soft">+{s.atMinutes}m</span>
                </div>
                <p className="font-display text-xl text-on-dark mt-3">{s.label}</p>
                <p className="text-on-dark-soft text-[13px] mt-1">{formatDistance(s.radiusMeters)} radius</p>
                <p className="text-on-dark-soft text-[12px] mt-2 leading-relaxed">{s.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-surface-soft">
        <div className="max-w-[1200px] mx-auto px-6 py-24">
          <p className="caption-upper text-coral">The platform</p>
          <h2 className="display-lg mt-3 max-w-2xl">Everything the response needs — in software.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {features.map((f) => (
              <div key={f.title} className="card-cream p-7">
                <div className="size-11 rounded-lg bg-canvas grid place-items-center mb-5">
                  <f.icon className="size-5 text-coral" />
                </div>
                <h3 className="text-lg font-medium">{f.title}</h3>
                <p className="text-body text-[15px] leading-relaxed mt-2">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1200px] mx-auto px-6 py-24">
        <div className="bg-coral text-on-primary rounded-2xl p-12 md:p-16 text-center">
          <SpikeMark className="size-8 mx-auto opacity-90" />
          <h2 className="display-lg mt-6 max-w-2xl mx-auto">
            Bring every phone into the search.
          </h2>
          <p className="text-on-primary/85 text-[17px] mt-4 max-w-xl mx-auto">
            Stand up the authority dashboard and the citizen network for the next gathering.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-canvas text-ink font-medium hover:bg-surface-soft transition-colors"
            >
              <ShieldCheck className="size-4" /> Open dashboard
            </Link>
            <span className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-coral-active/40 text-on-primary font-medium">
              <Smartphone className="size-4" /> Citizen app — separate build
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-dark text-on-dark-soft">
        <div className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <Wordmark labelClassName="text-on-dark" />
              <p className="text-[14px] mt-3 max-w-xs">
                A living missing-persons network for mass gatherings. No hardware — just the phones
                people already carry.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 text-[14px]">
              <FooterCol title="Product" links={['Live Operations', 'Command Center', 'Sighting Triage', 'CCTV Intel']} />
              <FooterCol title="Flows" links={['Report missing', 'Report sighting', 'Alert cascade', 'I found them']} />
              <FooterCol title="About" links={['Kumbh Mela', 'ICCC', 'Privacy', 'Contact']} />
            </div>
          </div>
          <p className="text-[13px] mt-12 pt-8 border-t border-white/10">
            © {new Date().getFullYear()} KumbhRaksha · Built for pilgrim safety.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <p className="text-on-dark caption-upper mb-3">{title}</p>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l}>
            <span className="hover:text-on-dark transition-colors cursor-default">{l}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
