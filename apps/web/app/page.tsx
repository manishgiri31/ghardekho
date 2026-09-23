import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, ChevronRight, Compass, ShieldCheck, Sparkles } from "lucide-react";
import { CityGrid } from "@/components/home/city-grid";
import { FaqList } from "@/components/home/faq-list";
import { SearchPanel } from "@/components/home/search-panel";
import { TypeGrid } from "@/components/home/type-grid";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";

const benefits = [
  { icon: ShieldCheck, title: "Clarity at every step", text: "Straightforward details help you make a more confident decision." },
  { icon: Compass, title: "A better way to explore", text: "Find the right neighbourhood, home type and fit for your life." },
  { icon: BadgeCheck, title: "Thoughtful verification", text: "Clear verification signals help you know what to look for." },
];

export default function HomePage() {
  return (
    <>
      <section className="relative isolate min-h-[660px] overflow-hidden bg-forest-deep text-white sm:min-h-[690px]">
        <Image src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2400&q=88" alt="Sunlit, thoughtfully designed contemporary home" fill priority sizes="100vw" className="-z-30 object-cover object-center" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(3,25,20,.84)_0%,rgba(3,25,20,.70)_44%,rgba(3,25,20,.18)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(3,25,20,.56)_0%,transparent_42%)]" />
        <div className="container flex min-h-[660px] flex-col justify-center pb-12 pt-16 sm:min-h-[690px] sm:pb-20">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 border border-white/30 bg-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.17em] text-white/90 backdrop-blur-sm sm:text-xs"><Sparkles size={13} className="text-gold-light" /> A more considered way to find home</div>
            <h1 className="max-w-[760px] text-[42px] font-medium leading-[1.08] tracking-[-.045em] sm:text-6xl lg:text-[72px]">Find a place that <span className="serif-accent text-gold-light">feels like home.</span></h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-white/80 sm:text-[17px] sm:leading-8">Explore homes, apartments and places to begin your next chapter — across India.</p>
          </div>
          <div className="mt-9 sm:mt-11"><SearchPanel /></div>
          <p className="mt-4 text-xs text-white/65">Looking somewhere specific? Try Delhi NCR, Mumbai or Bengaluru.</p>
        </div>
        <div className="absolute bottom-7 right-8 hidden items-center gap-3 text-[10px] uppercase tracking-[.15em] text-white/65 xl:flex"><span className="h-px w-10 bg-gold" /> Find your own kind of home</div>
      </section>

      <section id="locations" className="container section-space">
        <SectionHeading eyebrow="A good place to begin" title={<>Find your city.<br className="hidden sm:block" /> Find your <span className="serif-accent text-forest">kind of home.</span></>} description="Get to know the neighbourhoods and cities people are making their own." action={<Link className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:text-forest-deep" href="/properties">Explore locations <ArrowRight size={16} /></Link>} />
        <CityGrid />
      </section>

      <section className="bg-paper">
        <div className="container section-space">
          <SectionHeading eyebrow="A place for every plan" title={<>Browse by the way<br className="hidden sm:block" /> you want to <span className="serif-accent text-forest">live.</span></>} description="From a city apartment to a little more room outdoors, start with what matters to you." action={<Button href="/properties" variant="secondary">View all properties <ChevronRight size={16} /></Button>} />
          <TypeGrid />
        </div>
      </section>

      <section className="container section-space">
        <div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-20">
          <div>
            <p className="eyebrow mb-3">A clearer way to find home</p>
            <h2 className="max-w-lg text-[32px] font-semibold leading-tight tracking-[-.04em] text-ink sm:text-[42px]">Good decisions start with <span className="serif-accent text-forest">good information.</span></h2>
            <p className="mt-4 max-w-lg text-[15px] leading-7 text-muted">Finding a home is a big decision. GharDekho is being built to make the search feel more considered, more transparent and a little more human.</p>
            <Link href="/about" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-forest hover:text-forest-deep">Our approach <ArrowRight size={16} /></Link>
          </div>
          <div className="grid gap-0 border-y border-line sm:grid-cols-3 sm:border-y-0">
            {benefits.map(({ icon: Icon, title, text }, i) => <article key={title} className={`py-6 sm:px-5 sm:py-3 ${i > 0 ? "border-t border-line sm:border-l sm:border-t-0" : ""}`}>
              <Icon size={22} strokeWidth={1.6} className="text-forest" aria-hidden="true" />
              <h3 className="mt-5 text-base font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section className="container pb-10 sm:pb-16">
        <div className="relative isolate overflow-hidden bg-forest-deep px-6 py-12 text-white sm:px-12 sm:py-16 lg:px-16">
          <Image src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1800&q=85" alt="Warm, welcoming interior with natural materials" fill sizes="100vw" className="-z-30 object-cover object-center" />
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(3,35,29,.96),rgba(3,35,29,.82)_54%,rgba(3,35,29,.28))]" />
          <div className="max-w-2xl">
            <p className="eyebrow text-gold-light">Your property, thoughtfully presented</p>
            <h2 className="mt-4 text-[32px] font-semibold leading-tight tracking-[-.04em] sm:text-[44px]">Ready for a <span className="serif-accent text-gold-light">new beginning?</span></h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-white/75 sm:text-base">Share the details of your property and connect with people looking for a place just like it.</p>
            <Button href="/sell" className="mt-7 bg-gold text-forest-deep hover:bg-gold-light">Post your property <ArrowRight size={16} /></Button>
          </div>
          <Building2 className="absolute bottom-10 right-10 hidden text-white/15 lg:block" size={130} strokeWidth={0.7} aria-hidden="true" />
        </div>
      </section>

      <section className="bg-paper">
        <div className="container section-space">
          <SectionHeading eyebrow="Simple by design" title={<>From first look to <span className="serif-accent text-forest">feeling at home.</span></>} description="A more thoughtful property search, one clear step at a time." />
          <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
            {["Discover", "Compare", "Visit", "Move in"].map((step, index) => <div key={step} className={`border-t border-line py-5 sm:px-5 sm:py-6 ${index % 2 ? "sm:border-l" : ""} ${index > 1 ? "lg:border-l" : ""}`}>
              <span className="text-xs font-semibold tracking-[.14em] text-gold">0{index + 1}</span>
              <h3 className="mt-3 text-lg font-semibold text-ink">{step}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{["Find places and neighbourhoods that fit your plans.", "Explore the details that help you feel sure.", "Connect with the seller and plan a visit.", "Take the next step towards a place of your own."][index]}</p>
            </div>)}
          </div>
        </div>
      </section>

      <section className="container section-space">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
          <div>
            <SectionHeading eyebrow="A few things to know" title={<>Your questions,<br className="hidden lg:block" /> <span className="serif-accent text-forest">answered.</span></>} description="A little clarity goes a long way when you’re finding home." />
            <Link href="/contact" className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:text-forest-deep">Still curious? Get in touch <ArrowRight size={16} /></Link>
          </div>
          <FaqList />
        </div>
      </section>
    </>
  );
}
