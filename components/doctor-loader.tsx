import Image from "next/image";

export function DoctorLoader() {
  return (
    <div className="doctor-loader" role="status" aria-label="Loading Dr. Arif Raza website">
      <div className="doctor-loader-aurora" />
      <section className="doctor-loader-card">
        <div className="loader-heading">
          <span className="loader-kicker">DR. ARIF RAZA</span>
          <span>Gastrointestinal · HPB · Laparoscopic surgery</span>
        </div>
        <div className="loader-logo-stage" aria-hidden="true"><span/><Image src="/assets/img/gastroarif-mark.png" width={230} height={160} alt="" priority/></div>
        <div className="loader-copy"><strong>Preparing your care experience</strong><small>Secure appointments, specialist information and clinic updates</small></div>
        <div className="loader-progress"><span /></div>
      </section>
    </div>
  );
}
