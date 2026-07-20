import { BookingForm } from "@/components/booking-form";
import { PageHero } from "@/components/page-hero";
import { BookingAsideCopy, ClinicDetails } from "@/components/dynamic-copy";
export const metadata={title:"Book Appointment"};
export default function Booking(){return <><PageHero pageKey="booking" breadcrumb="Appointment"/><section className="section"><div className="shell booking-shell"><div className="booking-aside"><BookingAsideCopy/><ClinicDetails mode="booking"/></div><BookingForm compact/></div></section></>}
