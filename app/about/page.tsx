import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "@/components/icons";
import { PageHero } from "@/components/page-hero";
import {
  AboutAdditionalSections,
  AboutMainCopy,
} from "@/components/dynamic-copy";
export const metadata = {
  title: "About Dr. Arif Raza",
  description:
    "Learn about Dr. Arif Raza’s specialist training and patient-first approach to GI, HPB and advanced laparoscopic surgery in Kalaburagi.",
};
export default function About() {
  return (
    <>
      <PageHero pageKey="about" breadcrumb="About" />
      <section className="section">
        <div className="shell about-grid">
          <div className="about-photo">
            <Image
              src="/assets/img/aboutarif.png"
              alt="Dr. Arif Raza"
              fill
              priority
              sizes="45vw"
            />
          </div>
          <div className="prose">
            <AboutMainCopy />
            <ul className="check-list">
              <li>
                <Check />
                Advanced specialist training
              </li>
              <li>
                <Check />
                Experience in complex GI oncology
              </li>
              <li>
                <Check />
                Patient-first decisions and follow-up
              </li>
            </ul>
            <Link className="button button-dark" href="/booking">
              Book consultation <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
      <AboutAdditionalSections />
      <section className="section about-profile-section">
        <div className="shell">
          <div className="section-heading centered">
            <span className="eyebrow">A CAREER BUILT AROUND ACCESS</span>
            <h2>Advanced GI and cancer care, closer to home.</h2>
            <p>
              Dr. Arif Raza founded NK Gastro Superspecialty Hospital in
              Kalaburagi to make complex digestive and cancer surgery more
              accessible to patients across North Karnataka.
            </p>
          </div>
          <div className="credentials about-profile-grid">
            <div>
              <b>13+ years of surgical practice</b>
              <span>
                Specialist experience across elective, emergency and complex
                gastrointestinal surgery.
              </span>
            </div>
            <div>
              <b>5,000+ surgeries</b>
              <span>
                Broad experience in advanced laparoscopic, GI, colorectal, HPB
                and bariatric procedures.
              </span>
            </div>
            <div>
              <b>700+ complex GI oncology cases</b>
              <span>
                Care planning for challenging gastrointestinal cancers with
                clear discussions at every step.
              </span>
            </div>
            <div>
              <b>Advanced procedures</b>
              <span>
                Including liver and pancreatic surgery, hernia repair,
                endoscopy, colonoscopy, ERCP and laser proctology.
              </span>
            </div>
          </div>
          <div className="profile-story">
            <h3>Training and academic work</h3>
            <p>
              He completed specialist surgical gastroenterology training at the
              Asian Institute of Gastroenterology, Hyderabad, after postgraduate
              surgical training at Grant Medical College and Sir JJ Group of
              Hospitals, Mumbai. His academic work includes publications on
              primary adrenal sarcomatoid carcinoma and leiomyoma of the seminal
              vesicle, along with presentations at national surgical
              conferences.
            </p>
          </div>
        </div>
      </section>
      <section className="section story-section">
        <div className="shell">
          <div className="section-heading centered">
            <span className="eyebrow">CLINICAL FOCUS</span>
            <h2>Training and experience that support better decisions.</h2>
          </div>
          <div className="credentials">
            <div>
              <b>Surgical Gastroenterology</b>
              <span>
                Specialist training at Asian Institute of Gastroenterology,
                Hyderabad.
              </span>
            </div>
            <div>
              <b>Complex Surgery</b>
              <span>
                GI oncology, HPB, colorectal and minimally invasive procedures.
              </span>
            </div>
            <div>
              <b>Patient-first Care</b>
              <span>
                Clear recommendations based on diagnosis, safety and recovery.
              </span>
            </div>
            <div>
              <b>Local Access</b>
              <span>
                Advanced specialist consultation at NK Hospital, Kalaburagi.
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
