import { PageHero } from "@/components/page-hero";
import { ClinicDetails } from "@/components/dynamic-copy";
export const metadata = {
  title: "Contact Dr. Arif Raza",
  description:
    "Contact Dr. Arif Raza’s clinic at NK Hospital, Kalaburagi for GI, HPB, oncology and laparoscopic surgery consultations.",
};
export default function Contact() {
  return (
    <>
      <PageHero pageKey="contact" breadcrumb="Contact" />
      <section className="section">
        <div className="shell contact-grid">
          <ClinicDetails mode="contact" />
          <iframe
            className="map"
            title="NK Hospital Kalaburagi"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3808.299447032556!2d76.80705037462612!3d17.349318103901805!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc8b90063ca1855%3A0x34b789506ab58a57!2sNK%20HOSPITAL!5e0!3m2!1sen!2sin!4v1789981587414!5m2!1sen!2sin"
            loading="lazy"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </section>
    </>
  );
}
