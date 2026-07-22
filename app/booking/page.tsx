import { BookingForm } from "@/components/booking-form";
import { PageHero } from "@/components/page-hero";
import { BookingAsideCopy, ClinicDetails } from "@/components/dynamic-copy";
export const metadata = {
  title: "Book a GI Surgery Consultation",
  description:
    "Request an appointment with Dr. Arif Raza at NK Hospital, Kalaburagi for specialist gastrointestinal and laparoscopic surgical care.",
};
export default function Booking() {
  return (
    <>
      <PageHero pageKey="booking" breadcrumb="Appointment" />
      <section className="section">
        <div className="shell booking-shell">
          <div className="booking-aside">
            <BookingAsideCopy />
            <ClinicDetails mode="booking" />
          </div>
          <BookingForm compact showPrecheck />
        </div>
      </section>
    </>
  );
}
