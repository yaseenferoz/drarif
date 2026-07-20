import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Clock3, MapPin, Phone, ShieldCheck, Sparkles, Stethoscope } from "@/components/icons";
import { TreatmentGrid, ArticleGrid } from "@/components/data-grids";
import { BookingForm } from "@/components/booking-form";
import { site } from "@/lib/site-data";
import { HomeHeroCopy, HomeSectionCopy } from "@/components/dynamic-copy";

export default function Home() {
  return <>
    <section className="hero">
      <div className="hero-orb orb-one"/><div className="hero-orb orb-two"/>
      <div className="shell hero-grid">
        <div className="hero-copy">
          <HomeHeroCopy/>
          <div className="hero-actions"><Link className="button" href="/booking"><CalendarDays size={19}/> Book a consultation</Link><Link className="button button-ghost" href="/treatments">Explore treatments <ArrowRight size={18}/></Link></div>
          <div className="trust-row"><div><strong>13+</strong><span>Years of experience</span></div><div><strong>5,000+</strong><span>Successful surgeries</span></div><div><strong>700+</strong><span>Complex GI oncology cases</span></div></div>
        </div>
        <div className="hero-visual">
          <div className="hero-image"><Image src="/assets/img/aboutarif.png" alt="Dr. Arif Raza" fill priority sizes="(max-width: 800px) 100vw, 45vw"/></div>
          <div className="float-card float-top"><span><ShieldCheck/></span><div><b>Specialist-led care</b><small>From diagnosis to recovery</small></div></div>
          <div className="float-card float-bottom"><span><Clock3/></span><div><b>Mon – Sat</b><small>9:00 AM – 7:00 PM</small></div></div>
        </div>
      </div>
      <div className="shell location-strip"><div><MapPin/><span><small>Consulting at</small><b>NK Hospital, Kalaburagi</b></span></div><div><Phone/><span><small>Appointment desk</small><b>{site.phone}</b></span></div><Link href="/contact">Get directions <ArrowRight/></Link></div>
    </section>
    <section className="section">
      <div className="shell">
        <div className="section-heading split"><div><span className="eyebrow">SPECIALIST EXPERTISE</span><h2><HomeSectionCopy field="expertise_title" fallback="Care for the whole digestive system."/></h2></div><div><p><HomeSectionCopy field="expertise_text" fallback="From common conditions to complex cancer surgery, each treatment begins with an accurate diagnosis and a plan built around you."/></p><Link className="text-link" href="/treatments">View all treatments <ArrowRight/></Link></div></div>
        <TreatmentGrid limit={6}/>
      </div>
    </section>
    <section className="section story-section">
      <div className="shell story-grid">
        <div className="story-images"><div className="story-main"><Image src="/assets/img/whychoosearif.png" alt="Dr. Arif Raza consulting" fill sizes="50vw"/></div><div className="experience-badge"><b>13+</b><span>years in<br/>specialist surgery</span></div></div>
        <div className="story-copy"><span className="eyebrow">MEET YOUR SURGEON</span><h2><HomeSectionCopy field="about_title" fallback="Expert decisions. Honest conversations."/></h2><p><HomeSectionCopy field="about_text" fallback="Dr. Arif Raza trained in Surgical Gastroenterology at the Asian Institute of Gastroenterology, Hyderabad, and returned to Kalaburagi to make advanced digestive surgery accessible closer to home."/></p>
          <ul className="check-list"><li><Check/>Clear explanation of diagnosis and options</li><li><Check/>Surgery recommended only when appropriate</li><li><Check/>Structured support through recovery</li></ul>
          <Link className="button button-dark" href="/about">Meet Dr. Arif <ArrowRight/></Link>
        </div>
      </div>
    </section>
    <section className="section why-section"><div className="shell"><div className="section-heading centered"><span className="eyebrow">WHY PATIENTS CHOOSE US</span><h2>Thoughtful care is in the details.</h2></div><div className="why-grid">
      <article><span><Stethoscope/></span><h3>Specialist expertise</h3><p>Focused training in complex gastrointestinal, HPB and cancer surgery.</p></article>
      <article><span><Sparkles/></span><h3>Modern techniques</h3><p>Minimally invasive and endoscopic options whenever clinically appropriate.</p></article>
      <article><span><ShieldCheck/></span><h3>Safety-led decisions</h3><p>Every plan balances treatment benefit, risk, recovery and long-term health.</p></article>
    </div></div></section>
    <section className="section article-section"><div className="shell"><div className="section-heading split"><div><span className="eyebrow">HEALTH LIBRARY</span><h2><HomeSectionCopy field="articles_title" fallback="Knowledge for better decisions."/></h2></div><Link className="text-link" href="/articles">Browse all articles <ArrowRight/></Link></div><ArticleGrid limit={3}/></div></section>
    <section className="section booking-section"><div className="shell booking-shell"><div className="booking-aside"><span className="eyebrow">YOUR NEXT STEP</span><h2>Let’s talk about what you’re experiencing.</h2><p>Book an initial consultation or send your reports for a specialist review.</p><div className="mini-contact"><Phone/><div><small>Prefer to call?</small><a href={`tel:${site.phoneHref}`}>{site.phone}</a></div></div></div><BookingForm compact/></div></section>
  </>;
}
