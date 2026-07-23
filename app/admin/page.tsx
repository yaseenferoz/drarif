"use client";

import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  FileText,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Settings,
  Stethoscope,
  Trash2,
  Upload,
  Users,
  X,
} from "@/components/icons";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { resolveUserRole } from "@/lib/use-user-role";
import {
  defaultGallery,
  defaultNavigation,
  defaultPages,
  defaultSettings,
  articles as defaultArticles,
  treatments as defaultTreatments,
  GalleryItem,
  NavigationItem,
  SitePage,
  SiteSettings,
} from "@/lib/site-data";
import { DoctorLoader } from "@/components/doctor-loader";
import { practiceLogo } from "@/lib/brand";
import { AdminAiInsights } from "@/components/admin-ai-insights";
import CkEditorField from "@/components/lazy-ckeditor-field";
import { AppointmentReport } from "@/components/appointment-report";

type Tab =
  | "overview"
  | "appointments"
  | "pages"
  | "treatments"
  | "articles"
  | "navigation"
  | "gallery"
  | "settings"
  | "media";
type RecordRow = Record<string, any>;

function appointmentPreview(item: RecordRow) {
  const report = String(item.pre_diagnosis_report || "")
    .replace(/FULL CONVERSATION[\s\S]*/i, "")
    .replace(/[*#>`_-]/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const useful = report.filter(
    (line) =>
      !/^(PRE CONSULTATION SUMMARY|NOT A DIAGNOSIS|NOTE|CLINICIAN|FACILITY|SOURCE|DATE OF SUMMARY|PATIENT PRESENTATION OVERVIEW)$/i.test(
        line,
      ),
  );
  const concern =
    useful.find((line) => /primary concern|main concern/i.test(line)) ||
    useful.find((line) =>
      /chief complaint|stomach ache|abdominal pain|symptom/i.test(line),
    );
  const duration = useful.find(
    (line) => /duration|lasting|since/i.test(line) && line !== concern,
  );
  const readable = [concern, duration]
    .filter(Boolean)
    .map((line) =>
      String(line).replace(
        /^(Primary Concern|Main Concern|Chief Complaint|Duration)\s*:\s*/i,
        "",
      ),
    )
    .join(" · ");
  return readable || String(item.symptoms || "No concern details provided.");
}

const tabs: { key: Tab; label: string; icon: ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <LayoutDashboard /> },
  { key: "appointments", label: "Appointments", icon: <CalendarDays /> },
  { key: "pages", label: "Pages", icon: <FileText /> },
  { key: "treatments", label: "Treatments", icon: <Stethoscope /> },
  { key: "articles", label: "Articles", icon: <FileText /> },
  { key: "navigation", label: "Navigation", icon: <Menu /> },
  { key: "gallery", label: "Gallery", icon: <Images /> },
  { key: "settings", label: "Site settings", icon: <Settings /> },
  { key: "media", label: "Media library", icon: <Upload /> },
];

export default function Admin() {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [appointments, setAppointments] = useState<RecordRow[]>([]);
  const [treatments, setTreatments] = useState<RecordRow[]>([]);
  const [articles, setArticles] = useState<RecordRow[]>([]);
  const [pages, setPages] = useState<SitePage[]>(defaultPages);
  const [navigation, setNavigation] =
    useState<NavigationItem[]>(defaultNavigation);
  const [gallery, setGallery] = useState<GalleryItem[]>(defaultGallery);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const router = useRouter();

  // Admin sections are one workspace, but each section still gets a browser
  // history entry. This keeps mobile Back navigation inside the admin portal
  // before it returns to the page that opened /admin.
  useEffect(() => {
    const validTab = (value: string | null): Tab | null =>
      value && tabs.some((item) => item.key === value) ? (value as Tab) : null;
    const syncTabFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const requested = validTab(params.get("section"));
      if (params.has("appointment")) {
        setTab("appointments");
      } else if (requested) {
        setTab(requested);
      } else {
        setTab("overview");
      }
    };
    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);
    return () => window.removeEventListener("popstate", syncTabFromUrl);
  }, []);

  function navigateTab(next: Tab) {
    if (next === tab) {
      setMenuOpen(false);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.set("section", next);
    params.delete("appointment");
    window.history.pushState(
      { adminSection: next },
      "",
      `/admin?${params.toString()}`,
    );
    setTab(next);
    setMenuOpen(false);
  }

  async function load() {
    const s = getSupabase();
    if (!s) {
      setLoading(false);
      return;
    }
    let {
      data: { user },
    } = await s.auth.getUser();
    // On mobile browsers returning via the back button can briefly restore the
    // page before Supabase has rehydrated its session cookie. Check the local
    // session once more before sending an already-authenticated admin to login.
    if (!user) {
      const sessionResult = await s.auth.getSession();
      user = sessionResult.data.session?.user ?? null;
    }
    if (!user) {
      router.replace("/login");
      return;
    }
    const roleResult = await resolveUserRole(s, user.id);
    if (roleResult.error) {
      setMessage(
        `Could not verify your administrator role: ${roleResult.error}`,
      );
      setLoading(false);
      return;
    }
    if (roleResult.role !== "admin") {
      setMessage(
        `Signed in as patient (${user.email}). Promote this exact account in Supabase, then refresh this page.`,
      );
      setLoading(false);
      return;
    }
    setAllowed(true);
    const queries = [
      "appointments",
      "treatments",
      "articles",
      "site_pages",
      "navigation_items",
      "gallery_items",
      "site_settings",
    ];
    const results = await Promise.all([
      // The original production table uses an increasing bigint ID. It is a
      // more reliable newest-first key than legacy created_at values.
      s.from("appointments").select("*").order("id", { ascending: false }),
      s.from("treatments").select("*").order("sort_order"),
      s
        .from("articles")
        .select("*")
        .order("published_at", { ascending: false }),
      s.from("site_pages").select("*").order("page_key"),
      s.from("navigation_items").select("*").order("sort_order"),
      s.from("gallery_items").select("*").order("sort_order"),
      s.from("site_settings").select("*").eq("key", "general").maybeSingle(),
    ]);
    setAppointments(results[0].data || []);
    const treatmentRows = results[1].data || [];
    const articleRows = results[2].data || [];
    setTreatments([
      ...defaultTreatments.map(
        (item) => treatmentRows.find((row) => row.slug === item.slug) || item,
      ),
      ...treatmentRows.filter(
        (row) => !defaultTreatments.some((item) => item.slug === row.slug),
      ),
    ]);
    setArticles([
      ...defaultArticles.map(
        (item) => articleRows.find((row) => row.slug === item.slug) || item,
      ),
      ...articleRows.filter(
        (row) => !defaultArticles.some((item) => item.slug === row.slug),
      ),
    ]);
    if (results[3].data?.length) setPages(results[3].data);
    if (results[4].data?.length) setNavigation(results[4].data);
    const galleryRows = results[5].data || [];
    if (galleryRows.length)
      setGallery([
        ...galleryRows,
        ...defaultGallery.filter(
          (item) =>
            !galleryRows.some((row) => row.image_url === item.image_url),
        ),
      ]);
    if (results[6].data?.value)
      setSettings({ ...defaultSettings, ...results[6].data.value });
    const queryErrors = results
      .map((result, index) =>
        result.error ? `${queries[index]}: ${result.error.message}` : "",
      )
      .filter(Boolean);
    if (queryErrors.length)
      setMessage(
        `Supabase query issue: ${queryErrors.join(" | ")}. Run the latest supabase/upgrade_v2.sql again, including the GRANT section, then refresh this page.`,
      );
    else setMessage("");
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  if (loading) return <DoctorLoader />;
  if (!isSupabaseConfigured)
    return (
      <Denied
        title="Supabase setup required"
        text="Add the environment variables and run the included Supabase schema."
      />
    );
  if (!allowed)
    return (
      <Denied
        title="Admin access not active"
        text={message || "This account does not have the admin role."}
      />
    );

  const current = tabs.find((item) => item.key === tab)!;
  return (
    <section className="admin-shell">
      <aside className={`admin-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="admin-logo">
          <Image
            src={practiceLogo(settings.logo_url)}
            width={220}
            height={120}
            alt={settings.doctor_name}
          />
          <button onClick={() => setMenuOpen(false)}>
            <X />
          </button>
        </div>
        <div className="admin-label">CONTENT MANAGEMENT</div>
        <nav>
          {tabs.map((item) => (
            <button
              className={tab === item.key ? "active" : ""}
              key={item.key}
              onClick={() => navigateTab(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link href="/">View website</Link>
          <button
            onClick={async () => {
              await getSupabase()?.auth.signOut();
              router.push("/login");
            }}
          >
            <LogOut />
            Sign out
          </button>
        </div>
      </aside>
      {menuOpen && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Close admin menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className="admin-main">
        <header className="admin-top">
          <button
            className="admin-menu-button"
            onClick={() => setMenuOpen(true)}
          >
            <Menu />
          </button>
          <div>
            <span>ADMIN PORTAL</span>
            <h1>{current.label}</h1>
          </div>
          <Link className="button button-small button-ghost" href="/">
            View live site
          </Link>
        </header>
        {message && (
          <div className="admin-notice">
            {message}
            <button onClick={() => setMessage("")}>
              <X />
            </button>
          </div>
        )}
        <div className="admin-workspace">
          {tab === "overview" && (
            <Overview
              appointments={appointments}
              treatments={treatments}
              articles={articles}
              pages={pages}
            />
          )}
          {tab === "appointments" && (
            <Appointments items={appointments} reload={load} />
          )}
          {tab === "pages" && <PagesManager items={pages} reload={load} />}
          {tab === "treatments" && (
            <CollectionManager
              type="treatments"
              items={treatments}
              reload={load}
            />
          )}
          {tab === "articles" && (
            <CollectionManager type="articles" items={articles} reload={load} />
          )}
          {tab === "navigation" && (
            <NavigationManager items={navigation} pages={pages} reload={load} />
          )}
          {tab === "gallery" && (
            <GalleryManager items={gallery} reload={load} />
          )}
          {tab === "settings" && (
            <SettingsManager value={settings} reload={load} />
          )}
          {tab === "media" && <MediaManager />}
        </div>
      </div>
    </section>
  );
}

function Denied({ title, text }: { title: string; text: string }) {
  return (
    <section className="auth-shell">
      <div className="auth-card">
        <h1>{title}</h1>
        <p>{text}</p>
        <div className="admin-denied-actions">
          <Link className="button" href="/login">
            Sign in again
          </Link>
          <Link className="button button-ghost" href="/portal">
            Patient portal
          </Link>
        </div>
      </div>
    </section>
  );
}

function Overview({
  appointments,
  treatments,
  articles,
  pages,
}: {
  appointments: RecordRow[];
  treatments: RecordRow[];
  articles: RecordRow[];
  pages: SitePage[];
}) {
  const cards = [
    [
      appointments.filter((x) => (x.status || "new") === "new").length,
      "New requests",
      <CalendarDays key="a" />,
    ],
    [appointments.length, "All appointments", <Users key="u" />],
    [pages.length, "Editable pages", <FileText key="p" />],
    [
      treatments.length + articles.length,
      "Published content",
      <Stethoscope key="c" />,
    ],
  ];
  return (
    <>
      <div className="admin-welcome">
        <div>
          <span>WELCOME BACK</span>
          <h2>Everything on the website, in one place.</h2>
          <p>
            Update page copy, navigation, treatments, articles, gallery images
            and clinic details. Changes appear on the public site after saving.
          </p>
        </div>
        <Link href="/booking" className="button">
          Create test booking
        </Link>
      </div>
      <div className="admin-stat-grid">
        {cards.map(([value, label, icon]) => (
          <article key={String(label)}>
            <span>{icon}</span>
            <strong>{String(value)}</strong>
            <small>{label}</small>
          </article>
        ))}
      </div>
      <AdminAiInsights appointments={appointments} />
    </>
  );
}

function Appointments({
  items,
  reload,
}: {
  items: RecordRow[];
  reload: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [detailId, setDetailId] = useState<string | number | null>(null);
  const pageSize = 10;
  useEffect(() => {
    const syncDetailFromUrl = () => {
      const id = new URLSearchParams(window.location.search).get("appointment");
      setDetailId(id);
    };
    syncDetailFromUrl();
    window.addEventListener("popstate", syncDetailFromUrl);
    return () => window.removeEventListener("popstate", syncDetailFromUrl);
  }, []);
  function openDetail(id: string | number) {
    const params = new URLSearchParams(window.location.search);
    params.set("section", "appointments");
    params.set("appointment", String(id));
    window.history.pushState(
      { appointmentDetail: true },
      "",
      `/admin?${params.toString()}`,
    );
    setDetailId(id);
  }
  function closeDetail() {
    if (new URLSearchParams(window.location.search).has("appointment")) {
      window.history.back();
    } else {
      setDetailId(null);
    }
  }
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...items]
      .filter((item) => {
        const matchesSearch =
          !query ||
          [
            item.full_name,
            item.mobile_number,
            item.email,
            item.symptoms,
            item.consultation_type,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(query),
          );
        const matchesStatus =
          statusFilter === "all" ||
          String(item.status || "new").toLowerCase() === statusFilter;
        const matchesDate =
          !dateFilter || String(item.appointment_date || "") === dateFilter;
        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") return Number(a.id || 0) - Number(b.id || 0);
        if (sortBy === "date-asc")
          return String(a.appointment_date || "").localeCompare(
            String(b.appointment_date || ""),
          );
        if (sortBy === "date-desc")
          return String(b.appointment_date || "").localeCompare(
            String(a.appointment_date || ""),
          );
        return Number(b.id || 0) - Number(a.id || 0);
      });
  }, [items, search, statusFilter, dateFilter, sortBy]);
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const allSelected =
    visibleItems.length > 0 &&
    visibleItems.every((item) => selected.includes(item.id));
  function resetPage() {
    setPage(1);
  }
  function notify(type: "success" | "error", text: string) {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4200);
  }
  async function change(id: string, status: string) {
    const { error } = await getSupabase()!
      .from("appointments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      notify("error", `Could not update appointment: ${error.message}`);
      return;
    }
    notify("success", `Appointment marked ${status}.`);
    reload();
  }
  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }
  async function removeSelected() {
    if (!selected.length) return;
    const { error } = await getSupabase()!
      .from("appointments")
      .delete()
      .in("id", selected);
    if (error) {
      notify("error", `Could not delete appointment records: ${error.message}`);
      return;
    }
    setSelected([]);
    setConfirmDelete(false);
    notify(
      "success",
      `${selected.length} appointment record${selected.length === 1 ? "" : "s"} deleted.`,
    );
    reload();
  }
  const detailItem =
    detailId == null
      ? null
      : items.find((item) => String(item.id) === String(detailId));
  if (detailItem) {
    return (
      <Panel
        title="Appointment details"
        subtitle="Full patient request and pre-consultation record."
      >
        <button
          type="button"
          className="admin-back-link appointment-inline-back"
          onClick={closeDetail}
        >
          ← Back to appointments
        </button>
        <div className="admin-detail-head appointment-inline-head">
          <div>
            <span className="eyebrow">APPOINTMENT RECORD</span>
            <h1>{detailItem.full_name}</h1>
            <p>
              {detailItem.consultation_type || "Consultation"} ·{" "}
              {detailItem.appointment_date} · {detailItem.preferred_time}
            </p>
          </div>
          <span
            className={`status ${String(detailItem.status || "new").toLowerCase()}`}
          >
            {detailItem.status || "new"}
          </span>
        </div>
        <div className="admin-detail-grid">
          <section className="admin-detail-card">
            <h2>Patient details</h2>
            <div className="admin-detail-fields">
              <div>
                <small>Full name</small>
                <b>{detailItem.full_name || "Not provided"}</b>
              </div>
              <div>
                <small>Mobile number</small>
                <b>{detailItem.mobile_number || "Not provided"}</b>
              </div>
              <div>
                <small>Email</small>
                <b>{detailItem.email || "Not provided"}</b>
              </div>
              <div>
                <small>Consultation</small>
                <b>{detailItem.consultation_type || "Not provided"}</b>
              </div>
            </div>
          </section>
          <section className="admin-detail-card">
            <h2>Symptoms and request</h2>
            <p className="admin-detail-copy">
              {detailItem.symptoms ||
                "No symptoms or report details were provided."}
            </p>
          </section>
        </div>
        <section className="admin-detail-card admin-report-card">
          <h2>Full pre-consultation report</h2>
          {detailItem.pre_diagnosis_report ? (
            <AppointmentReport text={String(detailItem.pre_diagnosis_report)} />
          ) : (
            <p className="admin-detail-copy">
              No pre-consultation report was attached.
            </p>
          )}
        </section>
      </Panel>
    );
  }
  return (
    <Panel
      title="Appointment requests"
      subtitle="Review requests, update statuses, or remove records no longer needed."
      action={
        <div className="panel-actions appointment-panel-actions">
          <button
            type="button"
            className="button button-small button-ghost"
            onClick={() => reload()}
            title="Refresh appointment requests"
          >
            ↻ Refresh
          </button>
          <label className="admin-select-all">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) =>
                setSelected(
                  event.target.checked
                    ? visibleItems.map((item) => item.id)
                    : [],
                )
              }
              disabled={!items.length}
            />{" "}
            Select all
          </label>
          <button
            className="button button-small button-danger"
            disabled={!selected.length}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 /> Delete selected
            {selected.length ? ` (${selected.length})` : ""}
          </button>
        </div>
      }
    >
      <div
        className="appointment-filters"
        role="search"
        aria-label="Filter appointments"
      >
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            resetPage();
          }}
          placeholder="Search name, phone, email or concern"
          aria-label="Search appointments"
        />
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            resetPage();
          }}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(event) => {
            setDateFilter(event.target.value);
            resetPage();
          }}
          aria-label="Filter by appointment date"
        />
        <select
          value={sortBy}
          onChange={(event) => {
            setSortBy(event.target.value);
            resetPage();
          }}
          aria-label="Sort appointments"
        >
          <option value="newest">Newest requests</option>
          <option value="oldest">Oldest requests</option>
          <option value="date-asc">Appointment date (earliest)</option>
          <option value="date-desc">Appointment date (latest)</option>
        </select>
        {(search || statusFilter !== "all" || dateFilter) && (
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setDateFilter("");
              resetPage();
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      <div className="appointment-filter-count">
        Showing {visibleItems.length ? (currentPage - 1) * pageSize + 1 : 0}–
        {Math.min(currentPage * pageSize, filteredItems.length)} of{" "}
        {filteredItems.length} requests
      </div>
      <div className="admin-table">
        {visibleItems.length ? (
          visibleItems.map((x) => (
            <div
              className={`admin-table-row appointment-admin-row ${selected.includes(x.id) ? "selected" : ""}`}
              key={x.id}
            >
              <label className="appointment-check">
                <input
                  type="checkbox"
                  checked={selected.includes(x.id)}
                  onChange={() => toggle(x.id)}
                  aria-label={`Select appointment for ${x.full_name}`}
                />
              </label>
              <div>
                <b>{x.full_name}</b>
                <small>
                  {x.mobile_number} · {x.email || "No email"}
                </small>
              </div>
              <div>
                <b>{x.appointment_date}</b>
                <small>
                  {x.preferred_time} · {x.consultation_type}
                </small>
              </div>
              <div>
                <p className="appointment-summary-preview">
                  {appointmentPreview(x)}
                </p>
                <button
                  type="button"
                  className="appointment-view-link"
                  onClick={() => openDetail(x.id)}
                >
                  View full details
                </button>
              </div>
              <select
                value={x.status || "new"}
                onChange={(e) => change(x.id, e.target.value)}
              >
                <option>new</option>
                <option>confirmed</option>
                <option>completed</option>
                <option>cancelled</option>
              </select>
            </div>
          ))
        ) : (
          <Empty text="No appointment requests yet." />
        )}
      </div>
      {pageCount > 1 && (
        <div className="appointment-pagination">
          <button
            type="button"
            className="button button-small button-ghost"
            disabled={currentPage === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {pageCount}
          </span>
          <button
            type="button"
            className="button button-small button-ghost"
            disabled={currentPage === pageCount}
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
          >
            Next
          </button>
        </div>
      )}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${selected.length} appointment record${selected.length === 1 ? "" : "s"}?`}
          text="This permanently removes the selected booking records from the clinic database. This cannot be undone."
          confirmLabel="Delete records"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={removeSelected}
        />
      )}
      {toast && (
        <div className={`admin-toast admin-toast-${toast.type}`} role="status">
          {toast.text}
        </div>
      )}
    </Panel>
  );
}

function pageContentHtml(item: SitePage) {
  const c = item.content || {};
  const parts: string[] = [];
  for (const key of [
    "heading",
    "expertise_title",
    "about_title",
    "articles_title",
  ]) {
    if (c[key]) parts.push(`<h2>${String(c[key])}</h2>`);
    const textKey = key.replace("title", "text");
    if (c[textKey]) parts.push(`<p>${String(c[textKey])}</p>`);
  }
  for (const key of ["body", "secondary", "expertise_text", "about_text"]) {
    if (c[key] && !parts.some((part) => part.includes(String(c[key]))))
      parts.push(`<p>${String(c[key])}</p>`);
  }
  return parts.join("");
}
function sectionHtml(section: RecordRow) {
  if (section.rich_html) return String(section.rich_html);
  const parts: string[] = [];
  if (section.body) parts.push(`<p>${String(section.body)}</p>`);
  if (Array.isArray(section.items) && section.items.length)
    parts.push(
      `<ul>${section.items.map((item: string) => `<li>${item}</li>`).join("")}</ul>`,
    );
  return parts.join("");
}
function SectionBuilder({
  sections,
  setSections,
}: {
  sections: RecordRow[];
  setSections: (items: RecordRow[]) => void;
}) {
  return (
    <div className="page-sections full">
      <div className="page-sections-head">
        <div>
          <b>Additional sections</b>
          <small>
            Each section has the full editor: add headings, paragraphs, lists,
            links and uploaded images.
          </small>
        </div>
        <button
          type="button"
          className="button button-small button-ghost"
          onClick={() =>
            setSections([
              ...sections,
              { eyebrow: "", heading: "", rich_html: "", items: [] },
            ])
          }
        >
          <Plus />
          Add section
        </button>
      </div>
      {sections.map((section, index) => (
        <div
          className="page-section-editor"
          key={section.id || `section-${index}`}
        >
          <div className="page-section-title">
            <strong>Section {index + 1}</strong>
            <button
              type="button"
              onClick={() =>
                setSections(
                  sections.filter((_, itemIndex) => itemIndex !== index),
                )
              }
            >
              <Trash2 />
            </button>
          </div>
          <div className="admin-form-grid">
            <Field label="Eyebrow">
              <input
                value={section.eyebrow || ""}
                onChange={(event) =>
                  setSections(
                    sections.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, eyebrow: event.target.value }
                        : item,
                    ),
                  )
                }
              />
            </Field>
            <Field label="Heading">
              <input
                value={section.heading || ""}
                onChange={(event) =>
                  setSections(
                    sections.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, heading: event.target.value }
                        : item,
                    ),
                  )
                }
              />
            </Field>
            <CkEditorField
              value={
                section.rich_html !== undefined
                  ? String(section.rich_html)
                  : sectionHtml(section)
              }
              onChange={(value) =>
                setSections(
                  sections.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, rich_html: value } : item,
                  ),
                )
              }
            />
          </div>
        </div>
      ))}
      {!sections.length && (
        <p className="page-sections-empty">No additional sections yet.</p>
      )}
    </div>
  );
}
function PagesManager({
  items,
  reload,
}: {
  items: SitePage[];
  reload: () => void;
}) {
  const [editing, setEditing] = useState<SitePage | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SitePage | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [saved, setSaved] = useState(false);
  const [richHtml, setRichHtml] = useState("");
  const [sections, setSections] = useState<RecordRow[]>([]);
  function openEditor(item: SitePage) {
    setEditing(item);
    setRichHtml(String(item.content?.rich_html || pageContentHtml(item)));
    setSections(
      Array.isArray(item.content?.sections) ? item.content.sections : [],
    );
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    let content = {};
    try {
      content = JSON.parse(String(fd.get("content") || "{}"));
    } catch {
      return alert("Additional content must be valid JSON.");
    }
    const payload = {
      page_key: String(fd.get("page_key")),
      eyebrow: String(fd.get("eyebrow")),
      title: String(fd.get("title")),
      description: String(fd.get("description")),
      content: { ...content, sections },
      published: fd.get("published") === "on",
      updated_at: new Date().toISOString(),
    };
    const { error } = await getSupabase()!
      .from("site_pages")
      .upsert(payload, { onConflict: "page_key" });
    if (error) return alert(error.message);
    setEditing(null);
    setSaved(true);
    reload();
  }
  async function remove() {
    if (!confirmDelete?.id) return;
    const { error } = await getSupabase()!
      .from("site_pages")
      .delete()
      .eq("id", confirmDelete.id);
    if (error) alert(error.message);
    setConfirmDelete(null);
    reload();
  }
  async function restoreDefaults() {
    const client = getSupabase();
    if (!client) return;
    const { error: deleteError } = await client
      .from("site_pages")
      .delete()
      .not("id", "is", null);
    if (deleteError) {
      alert(deleteError.message);
      return;
    }
    const { error } = await client
      .from("site_pages")
      .insert(defaultPages.map(({ id, ...page }) => page));
    if (error) {
      alert(error.message);
      return;
    }
    setConfirmRestore(false);
    setEditing(null);
    setSaved(true);
    reload();
  }
  const isDefault = (item: SitePage) =>
    defaultPages.some((page) => page.page_key === item.page_key);
  return (
    <Panel
      title="Website pages"
      subtitle="Edit page copy with a visual rich editor."
      action={
        <div className="panel-actions">
          <button
            className="button button-small button-ghost"
            onClick={() => setConfirmRestore(true)}
          >
            Restore defaults
          </button>
          <button
            className="button button-small"
            onClick={() => {
              const item = {
                page_key: "",
                title: "",
                eyebrow: "",
                description: "",
                content: {},
                published: true,
              };
              openEditor(item);
            }}
          >
            <Plus />
            New page
          </button>
        </div>
      }
    >
      {editing && (
        <Editor
          key={editing.id || editing.page_key || "new"}
          title={`Edit ${editing.page_key || "page"}`}
          onClose={() => setEditing(null)}
        >
          <form className="admin-form admin-form-grid" onSubmit={save}>
            <Field label="Page key">
              <input
                name="page_key"
                defaultValue={editing.page_key}
                readOnly={Boolean(editing.id)}
                required
              />
            </Field>
            <Field label="Eyebrow">
              <input name="eyebrow" defaultValue={editing.eyebrow} />
            </Field>
            <Field label="Page title" full>
              <input name="title" defaultValue={editing.title} required />
            </Field>
            <Field label="Description" full>
              <textarea
                name="description"
                rows={3}
                defaultValue={editing.description}
              />
            </Field>
            <SectionBuilder sections={sections} setSections={setSections} />
            <CkEditorField value={richHtml} onChange={setRichHtml} />
            <input
              type="hidden"
              name="content"
              value={JSON.stringify({
                ...editing.content,
                rich_html: richHtml,
                sections,
              })}
              readOnly
            />
            <Toggle
              name="published"
              label="Published"
              checked={editing.published !== false}
            />
            <SaveButtons />
          </form>
        </Editor>
      )}
      <div className="content-list">
        {items.map((item) => (
          <ContentRow
            key={item.page_key}
            title={item.title}
            meta={`/${item.page_key === "home" ? "" : item.page_key}`}
            published={item.published !== false}
            onEdit={() => openEditor(item)}
            onDelete={
              item.id && !isDefault(item)
                ? () => setConfirmDelete(item)
                : undefined
            }
          />
        ))}
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete “${confirmDelete.title}”?`}
          text="This custom page and its content will be permanently removed."
          confirmLabel="Delete page"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={remove}
        />
      )}
      {confirmRestore && (
        <ConfirmDialog
          title="Restore default pages?"
          text="This removes custom pages and resets every page to the original clinic content."
          confirmLabel="Restore pages"
          danger
          onCancel={() => setConfirmRestore(false)}
          onConfirm={restoreDefaults}
        />
      )}
      {saved && (
        <ConfirmDialog
          title="Page saved"
          text="Your changes are now available on the public site."
          confirmLabel="Done"
          onCancel={() => setSaved(false)}
          onConfirm={() => setSaved(false)}
        />
      )}
    </Panel>
  );
}

function CollectionManager({
  type,
  items,
  reload,
}: {
  type: "treatments" | "articles";
  items: RecordRow[];
  reload: () => void;
}) {
  const [editing, setEditing] = useState<RecordRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RecordRow | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const isTreatment = type === "treatments";
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const base = {
      title: String(fd.get("title")),
      slug: String(fd.get("slug")),
      excerpt: String(fd.get("excerpt")),
      image_url: String(fd.get("image_url")),
      published: fd.get("published") === "on",
      updated_at: new Date().toISOString(),
    };
    const split = (name: string) =>
      String(fd.get(name) || "")
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);
    const payload = isTreatment
      ? {
          ...base,
          eyebrow: String(fd.get("eyebrow")),
          symptoms: split("symptoms"),
          evaluations: split("evaluations"),
          treatments: split("treatments"),
          preparation: split("preparation"),
          recovery: String(fd.get("recovery")),
          urgent_signs: split("urgent_signs"),
          sort_order: Number(fd.get("sort_order") || 0),
        }
      : {
          ...base,
          category: String(fd.get("category")),
          reading_minutes: Number(fd.get("reading_minutes") || 5),
          content: String(fd.get("content")),
          published_at: editing?.published_at || new Date().toISOString(),
        };
    const table: any = getSupabase()!.from(type);
    const result = editing?.id
      ? await table.update(payload).eq("id", editing.id)
      : await table.insert(payload);
    if (result.error) return alert(result.error.message);
    setEditing(null);
    reload();
  }
  async function remove(item: RecordRow) {
    if (!item.id) return;
    const { error } = await getSupabase()!
      .from(type)
      .delete()
      .eq("id", item.id);
    if (error) return alert(error.message);
    setConfirmDelete(null);
    reload();
  }
  async function restoreDefaults() {
    const s = getSupabase()!;
    const { error: deleteError } = await s
      .from(type)
      .delete()
      .not("id", "is", null);
    if (deleteError) return alert(deleteError.message);
    const seeds: any = isTreatment ? defaultTreatments : defaultArticles;
    const { error } = await s.from(type).insert(seeds);
    if (error) return alert(error.message);
    reload();
  }
  const blank = isTreatment
    ? {
        title: "",
        slug: "",
        excerpt: "",
        image_url: "",
        eyebrow: "",
        symptoms: [],
        evaluations: [],
        treatments: [],
        preparation: [],
        recovery: "",
        urgent_signs: [],
        published: true,
        sort_order: items.length + 1,
      }
    : {
        title: "",
        slug: "",
        excerpt: "",
        image_url: "",
        category: "Health",
        content: "",
        reading_minutes: 5,
        published: true,
      };
  return (
    <Panel
      title={isTreatment ? "Treatments" : "Health articles"}
      subtitle={
        isTreatment
          ? "Edit every treatment detail, preparation step and warning sign."
          : "Create and edit the complete health library."
      }
      action={
        <div className="panel-actions">
          <button
            className="button button-small button-ghost"
            onClick={() => setConfirmRestore(true)}
          >
            Restore defaults
          </button>
          <button
            className="button button-small"
            onClick={() => setEditing(blank)}
          >
            <Plus />
            Add new
          </button>
        </div>
      }
    >
      {editing && (
        <Editor
          key={`${type}-${editing.id || editing.slug || "new"}`}
          title={`${editing.id ? "Edit" : "Add"} ${isTreatment ? "treatment" : "article"}`}
          onClose={() => setEditing(null)}
        >
          <form className="admin-form admin-form-grid" onSubmit={save}>
            <Field label="Title">
              <input name="title" defaultValue={editing.title} required />
            </Field>
            <Field label="URL slug">
              <input name="slug" defaultValue={editing.slug} required />
            </Field>
            <Field label={isTreatment ? "Category label" : "Category"}>
              <input
                name={isTreatment ? "eyebrow" : "category"}
                defaultValue={editing.eyebrow || editing.category}
                required
              />
            </Field>
            <Field label={isTreatment ? "Sort order" : "Reading minutes"}>
              <input
                type="number"
                name={isTreatment ? "sort_order" : "reading_minutes"}
                defaultValue={
                  editing.sort_order || editing.reading_minutes || 0
                }
              />
            </Field>
            <Field label="Image URL" full>
              <input
                name="image_url"
                defaultValue={editing.image_url}
                required
              />
            </Field>
            <Field label="Short summary" full>
              <textarea
                name="excerpt"
                rows={3}
                defaultValue={editing.excerpt}
                required
              />
            </Field>
            {isTreatment ? (
              <>
                <ListField
                  name="symptoms"
                  label="When to consult"
                  values={editing.symptoms}
                />
                <ListField
                  name="evaluations"
                  label="Diagnosis & evaluation"
                  values={editing.evaluations}
                />
                <ListField
                  name="treatments"
                  label="Treatment options"
                  values={editing.treatments}
                />
                <ListField
                  name="preparation"
                  label="How to prepare"
                  values={editing.preparation}
                />
                <Field label="Recovery & follow-up" full>
                  <textarea
                    name="recovery"
                    rows={4}
                    defaultValue={editing.recovery}
                  />
                </Field>
                <ListField
                  name="urgent_signs"
                  label="Urgent warning signs"
                  values={editing.urgent_signs}
                />
              </>
            ) : (
              <Field label="Full article content" full>
                <textarea
                  name="content"
                  rows={14}
                  defaultValue={editing.content}
                  required
                />
              </Field>
            )}
            <Toggle
              name="published"
              label="Published"
              checked={editing.published !== false}
            />
            <SaveButtons />
          </form>
        </Editor>
      )}
      <div className="content-list">
        {items.map((item, index) => (
          <ContentRow
            key={`${type}-${item.id || item.slug || item.title || index}`}
            title={item.title}
            meta={`/${type}/${item.slug}`}
            published={item.published}
            image={item.image_url}
            onEdit={() => setEditing(item)}
            onDelete={() => setConfirmDelete(item)}
          />
        ))}
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete “${confirmDelete.title}”?`}
          text={`This ${isTreatment ? "treatment" : "article"} will be permanently removed.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => remove(confirmDelete)}
        />
      )}
      {confirmRestore && (
        <ConfirmDialog
          title={`Restore default ${isTreatment ? "treatments" : "articles"}?`}
          text="Custom records in this section will be removed and the original clinic content will be restored."
          confirmLabel="Restore defaults"
          danger
          onCancel={() => setConfirmRestore(false)}
          onConfirm={() => {
            setConfirmRestore(false);
            restoreDefaults();
          }}
        />
      )}
    </Panel>
  );
}

function NavigationManager({
  items,
  pages,
  reload,
}: {
  items: NavigationItem[];
  pages: SitePage[];
  reload: () => void;
}) {
  const [editing, setEditing] = useState<NavigationItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<NavigationItem | null>(
    null,
  );
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [saved, setSaved] = useState(false);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const mappedHref = String(fd.get("page_href") || "");
    const customHref = String(fd.get("custom_href") || "").trim();
    const payload = {
      label: String(fd.get("label")),
      href: customHref || mappedHref || "/",
      location: String(fd.get("location")),
      sort_order: Number(fd.get("sort_order")),
      visible: fd.get("visible") === "on",
    };
    const s = getSupabase()!;
    const result = editing?.id
      ? await s.from("navigation_items").update(payload).eq("id", editing.id)
      : await s.from("navigation_items").insert(payload);
    if (result.error) return alert(result.error.message);
    setEditing(null);
    setSaved(true);
    reload();
  }
  async function remove() {
    if (!confirmDelete?.id) return;
    const { error } = await getSupabase()!
      .from("navigation_items")
      .delete()
      .eq("id", confirmDelete.id);
    if (error) alert(error.message);
    setConfirmDelete(null);
    reload();
  }
  async function restoreDefaults() {
    const client = getSupabase();
    if (!client) return;
    const { error: deleteError } = await client
      .from("navigation_items")
      .delete()
      .not("id", "is", null);
    if (deleteError) {
      alert(deleteError.message);
      return;
    }
    const { error } = await client
      .from("navigation_items")
      .insert(defaultNavigation.map(({ id, ...item }) => item));
    if (error) {
      alert(error.message);
      return;
    }
    setConfirmRestore(false);
    setEditing(null);
    setSaved(true);
    reload();
  }
  const isDefault = (item: NavigationItem) =>
    defaultNavigation.some(
      (link) => link.label === item.label && link.href === item.href,
    );
  return (
    <Panel
      title="Navigation menus"
      subtitle="Control link labels, destinations, order and visibility."
      action={
        <div className="panel-actions">
          <button
            className="button button-small button-ghost"
            onClick={() => setConfirmRestore(true)}
          >
            Restore defaults
          </button>
          <button
            className="button button-small"
            onClick={() =>
              setEditing({
                label: "",
                href: "/",
                location: "header",
                sort_order: items.length + 1,
                visible: true,
              })
            }
          >
            <Plus />
            Add link
          </button>
        </div>
      }
    >
      {editing && (
        <Editor
          key={editing.id || `${editing.label}-${editing.href}`}
          title={`${editing.id ? "Edit" : "Add"} navigation item`}
          onClose={() => setEditing(null)}
        >
          <form className="admin-form admin-form-grid" onSubmit={save}>
            <Field label="Label">
              <input name="label" defaultValue={editing.label} required />
            </Field>
            <Field label="CMS page">
              <select
                name="page_href"
                defaultValue={
                  pages.some(
                    (page) =>
                      (page.page_key === "home" ? "/" : `/${page.page_key}`) ===
                      editing.href,
                  )
                    ? editing.href
                    : ""
                }
              >
                <option value="">Choose a page</option>
                {pages.map((page) => (
                  <option
                    key={page.page_key}
                    value={page.page_key === "home" ? "/" : `/${page.page_key}`}
                  >
                    {page.title} (/
                    {page.page_key === "home" ? "" : page.page_key})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Custom URL (optional)" full>
              <input
                name="custom_href"
                defaultValue={
                  pages.some(
                    (page) =>
                      (page.page_key === "home" ? "/" : `/${page.page_key}`) ===
                      editing.href,
                  )
                    ? ""
                    : editing.href
                }
                placeholder="https://… or /custom-path"
              />
            </Field>
            <Field label="Location">
              <select name="location" defaultValue={editing.location}>
                <option value="header">Header</option>
                <option value="footer">Footer</option>
              </select>
            </Field>
            <Field label="Sort order">
              <input
                name="sort_order"
                type="number"
                defaultValue={editing.sort_order}
              />
            </Field>
            <Toggle name="visible" label="Visible" checked={editing.visible} />
            <SaveButtons />
          </form>
        </Editor>
      )}
      <div className="content-list">
        {items.map((item) => (
          <ContentRow
            key={item.id || `${item.label}-${item.href}`}
            title={item.label}
            meta={`${item.location} · ${item.href} · position ${item.sort_order}`}
            published={item.visible}
            onEdit={() => setEditing(item)}
            onDelete={
              item.id && !isDefault(item)
                ? () => setConfirmDelete(item)
                : undefined
            }
          />
        ))}
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title={`Remove “${confirmDelete.label}”?`}
          text="This custom navigation link will be removed from the site menu."
          confirmLabel="Remove link"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={remove}
        />
      )}
      {confirmRestore && (
        <ConfirmDialog
          title="Restore default navigation?"
          text="This removes custom links and resets the menu to the original clinic navigation."
          confirmLabel="Restore navigation"
          danger
          onCancel={() => setConfirmRestore(false)}
          onConfirm={restoreDefaults}
        />
      )}
      {saved && (
        <ConfirmDialog
          title="Navigation saved"
          text="The menu now uses your updated label and destination."
          confirmLabel="Done"
          onCancel={() => setSaved(false)}
          onConfirm={() => setSaved(false)}
        />
      )}
    </Panel>
  );
}

function GalleryManager({
  items,
  reload,
}: {
  items: GalleryItem[];
  reload: () => void;
}) {
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<GalleryItem | null>(null);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title")),
      caption: String(fd.get("caption")),
      image_url: String(fd.get("image_url")),
      category: String(fd.get("category")),
      sort_order: Number(fd.get("sort_order")),
      published: fd.get("published") === "on",
    };
    const s = getSupabase()!;
    const result = editing?.id
      ? await s.from("gallery_items").update(payload).eq("id", editing.id)
      : await s.from("gallery_items").insert(payload);
    if (result.error) return alert(result.error.message);
    setEditing(null);
    reload();
  }
  async function remove(item: GalleryItem) {
    if (!item.id) return;
    const { error } = await getSupabase()!
      .from("gallery_items")
      .delete()
      .eq("id", item.id);
    if (error) return alert(error.message);
    setConfirmDelete(null);
    reload();
  }
  return (
    <Panel
      title="Gallery"
      subtitle="Manage public gallery images and captions."
      action={
        <button
          className="button button-small"
          onClick={() =>
            setEditing({
              title: "",
              caption: "",
              image_url: "",
              category: "Clinic",
              sort_order: items.length + 1,
              published: true,
            })
          }
        >
          <Plus />
          Add image
        </button>
      }
    >
      {editing && (
        <Editor
          key={`gallery-${editing.id || editing.image_url || "new"}`}
          title="Edit gallery item"
          onClose={() => setEditing(null)}
        >
          <form className="admin-form admin-form-grid" onSubmit={save}>
            <Field label="Title">
              <input name="title" defaultValue={editing.title} required />
            </Field>
            <Field label="Category">
              <input name="category" defaultValue={editing.category} required />
            </Field>
            <Field label="Image URL" full>
              <input
                name="image_url"
                defaultValue={editing.image_url}
                required
              />
            </Field>
            <Field label="Caption" full>
              <textarea
                name="caption"
                rows={3}
                defaultValue={editing.caption}
              />
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                name="sort_order"
                defaultValue={editing.sort_order}
              />
            </Field>
            <Toggle
              name="published"
              label="Published"
              checked={editing.published}
            />
            <SaveButtons />
          </form>
        </Editor>
      )}
      <div className="gallery-admin-grid">
        {items.map((item, index) => (
          <article
            key={
              item.id ||
              `${item.image_url}-${item.title}-${item.category}-${index}`
            }
          >
            <div className="gallery-admin-image">
              <Image src={item.image_url} fill alt={item.title} />
            </div>
            <div>
              <span>{item.category}</span>
              <h3>{item.title}</h3>
              <p>{item.caption}</p>
              <button onClick={() => setEditing(item)}>
                <Pencil />
                Edit
              </button>
              {item.id && (
                <button
                  className="danger"
                  onClick={() => setConfirmDelete(item)}
                >
                  <Trash2 />
                  Delete
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete “${confirmDelete.title}”?`}
          text="This gallery image and its caption will be permanently removed."
          confirmLabel="Delete image"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => remove(confirmDelete)}
        />
      )}
    </Panel>
  );
}

function SettingsManager({
  value,
  reload,
}: {
  value: SiteSettings;
  reload: () => void;
}) {
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(
      [...fd.entries()].map(([k, v]) => [k, String(v)]),
    );
    const { error } = await getSupabase()!.from("site_settings").upsert({
      key: "general",
      value: payload,
      updated_at: new Date().toISOString(),
    });
    if (error) return alert(error.message);
    alert("Site settings saved.");
    reload();
  }
  return (
    <Panel
      title="Global site settings"
      subtitle="Update the logo and clinic details used across the header, footer and contact areas."
    >
      <form
        className="admin-form admin-form-grid settings-form"
        onSubmit={save}
      >
        {Object.entries({
          logo_url: "Logo image URL",
          doctor_name: "Doctor name",
          credentials: "Credentials",
          phone: "Phone",
          email: "Email",
          hospital: "Hospital",
          location: "Location",
          hours: "Consultation hours",
        }).map(([key, label]) => (
          <Field
            label={label}
            key={key}
            full={
              key === "logo_url" || key === "credentials" || key === "hours"
            }
          >
            <input
              name={key}
              defaultValue={value[key as keyof SiteSettings]}
              required
            />
          </Field>
        ))}
        <SaveButtons />
      </form>
    </Panel>
  );
}

function MediaManager() {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<RecordRow[]>([]);
  const [query, setQuery] = useState("");
  const [confirmFile, setConfirmFile] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState("");
  async function list() {
    const { data } = await getSupabase()!
      .storage.from("site-media")
      .list("", {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });
    setFiles(data || []);
  }
  useEffect(() => {
    list();
  }, []);
  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const file = new FormData(form).get("file") as File;
    if (!file) return;
    const path = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { data, error } = await getSupabase()!
      .storage.from("site-media")
      .upload(path, file);
    if (error) setMessage(error.message);
    else if (data) {
      const { data: url } = getSupabase()!
        .storage.from("site-media")
        .getPublicUrl(data.path);
      setMessage(`Uploaded successfully. URL ready to use: ${url.publicUrl}`);
      form.reset();
      setSelectedFile("");
      list();
    }
  }
  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setMessage(
      "Image URL copied. Paste it into any image URL field in the CMS.",
    );
  }
  async function remove() {
    if (!confirmFile) return;
    const { error } = await getSupabase()!
      .storage.from("site-media")
      .remove([confirmFile]);
    if (error) setMessage(error.message);
    else {
      setMessage("Image deleted.");
      list();
    }
    setConfirmFile(null);
  }
  const visible = files.filter((file) =>
    String(file.name || "")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <Panel
      title="Media library"
      subtitle="Upload reusable images, copy their URLs, and use them in pages, treatments, articles, gallery items or site settings."
    >
      <form className="media-upload" onSubmit={upload}>
        <label className="media-file-picker">
          <Upload />
          <span>{selectedFile || "Choose an image to upload"}</span>
          <input
            type="file"
            name="file"
            accept="image/*"
            required
            onChange={(event) =>
              setSelectedFile(event.target.files?.[0]?.name || "")
            }
          />
        </label>
        <div className="media-upload-info">
          <span>PNG, JPG or WebP</span>
          <small>Images are reusable across your clinic pages.</small>
        </div>
        <button className="button" disabled={!selectedFile}>
          <Upload /> Upload image
        </button>
      </form>
      {message && <div className="admin-notice media-message">{message}</div>}
      <div className="media-toolbar">
        <strong>
          {files.length} image{files.length === 1 ? "" : "s"}
        </strong>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files…"
          aria-label="Search media files"
        />
      </div>
      <div className="media-grid">
        {visible.map((file) => {
          const { data } = getSupabase()!
            .storage.from("site-media")
            .getPublicUrl(file.name);
          return (
            <article className="media-card" key={file.id || file.name}>
              <button
                className="media-preview"
                type="button"
                onClick={() => copyUrl(data.publicUrl)}
                title="Copy image URL"
              >
                <Image src={data.publicUrl} fill alt={file.name} />
                <span>Copy URL</span>
              </button>
              <div>
                <div className="media-file-name" title={file.name}>
                  <Images />
                  <span>{file.name}</span>
                </div>
                <button
                  type="button"
                  className="media-delete"
                  onClick={() => setConfirmFile(file.name)}
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {!visible.length && (
        <div className="admin-empty">
          <FileText />
          <p>
            {files.length
              ? "No matching files."
              : "Upload your first image to start building the media library."}
          </p>
        </div>
      )}
      {confirmFile && (
        <ConfirmDialog
          title={`Delete “${confirmFile}”?`}
          text="This image will be permanently removed from the media library and may disappear from pages that use it."
          confirmLabel="Delete image"
          danger
          onCancel={() => setConfirmFile(null)}
          onConfirm={remove}
        />
      )}
    </Panel>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
function Editor({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div ref={editorRef} className="editor-card">
      <div className="editor-head">
        <h3>{title}</h3>
        <button onClick={onClose} aria-label="Close editor">
          <X />
        </button>
      </div>
      {children}
    </div>
  );
}
function ConfirmDialog({
  title,
  text,
  confirmLabel,
  onCancel,
  onConfirm,
  danger = false,
}: {
  title: string;
  text: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  danger?: boolean;
}) {
  return (
    <div
      className="confirm-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <button
          className="confirm-close"
          type="button"
          onClick={onCancel}
          aria-label="Close"
        >
          <X />
        </button>
        <span className={`confirm-icon ${danger ? "danger" : ""}`}>
          {danger ? <Trash2 /> : <FileText />}
        </span>
        <h2 id="confirm-title">{title}</h2>
        <p>{text}</p>
        <div className="confirm-actions">
          <button
            type="button"
            className="button button-ghost"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`button ${danger ? "button-danger" : ""}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
function Field({
  label,
  full = false,
  children,
}: {
  label: string;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={full ? "full" : ""}>
      <span>{label}</span>
      {children}
    </label>
  );
}
function ListField({
  name,
  label,
  values,
}: {
  name: string;
  label: string;
  values?: string[];
}) {
  return (
    <Field label={`${label} — one item per line`} full>
      <textarea name={name} rows={5} defaultValue={(values || []).join("\n")} />
    </Field>
  );
}
function Toggle({
  name,
  label,
  checked,
}: {
  name: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label className="admin-toggle">
      <input type="checkbox" name={name} defaultChecked={checked} />
      <span>{label}</span>
    </label>
  );
}
function SaveButtons() {
  return (
    <div className="admin-save full">
      <button className="button" type="submit">
        Save changes
      </button>
    </div>
  );
}
function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [html, setHtml] = useState(value);
  const [media, setMedia] = useState<RecordRow[]>([]);
  const [showMedia, setShowMedia] = useState(false);
  const area = useRef<HTMLDivElement>(null);
  const range = useRef<Range | null>(null);
  const uploadInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (document.activeElement !== area.current) {
      setHtml(value);
      if (area.current && area.current.innerHTML !== value)
        area.current.innerHTML = value;
    }
  }, [value]);
  useEffect(() => {
    const client = getSupabase();
    if (client)
      client.storage
        .from("site-media")
        .list("", {
          limit: 80,
          sortBy: { column: "created_at", order: "desc" },
        })
        .then(({ data }) => setMedia(data || []));
  }, []);
  function remember() {
    const selection = window.getSelection();
    if (selection?.rangeCount && area.current?.contains(selection.anchorNode))
      range.current = selection.getRangeAt(0).cloneRange();
  }
  function restore() {
    area.current?.focus();
    if (range.current) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range.current);
    }
  }
  function sync() {
    onChange(area.current?.innerHTML || "");
  }
  function command(name: string, arg?: string) {
    restore();
    document.execCommand(name, false, arg);
    remember();
    sync();
  }
  function insertImage(url: string) {
    restore();
    document.execCommand(
      "insertHTML",
      false,
      `<img src="${url.replace(/"/g, "&quot;")}" alt="" />`,
    );
    remember();
    sync();
    setShowMedia(false);
  }
  async function upload(file: File) {
    const client = getSupabase();
    if (!client) return;
    const path = `${Date.now()}-${file.name.replace(/[^a-z0-9._-]+/gi, "-")}`;
    const { data, error } = await client.storage
      .from("site-media")
      .upload(path, file);
    if (error) {
      alert(error.message);
      return;
    }
    const { data: url } = client.storage
      .from("site-media")
      .getPublicUrl(data.path);
    insertImage(url.publicUrl);
    setMedia((items) => [{ name: data.path, id: data.path }, ...items]);
  }
  return (
    <div className="rich-editor full">
      <div className="rich-toolbar">
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("undo")}
        >
          Undo
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("redo")}
        >
          Redo
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("formatBlock", "<h2>")}
        >
          Heading
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("formatBlock", "<p>")}
        >
          Paragraph
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("bold")}
        >
          <b>B</b>
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("italic")}
        >
          <i>I</i>
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("insertUnorderedList")}
        >
          • List
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("insertOrderedList")}
        >
          1. List
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("formatBlock", "<blockquote>")}
        >
          Quote
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("createLink", prompt("Link URL:") || "")}
        >
          Link
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setShowMedia((show) => !show)}
        >
          Image
        </button>
        <input
          ref={uploadInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
            event.currentTarget.value = "";
          }}
        />
      </div>
      {showMedia && (
        <div className="rich-media-picker">
          <div className="rich-media-head">
            <strong>Choose an image</strong>
            <button type="button" onClick={() => uploadInput.current?.click()}>
              Upload image
            </button>
          </div>
          <div className="rich-media-grid">
            {media.map((file, index) => {
              const client = getSupabase();
              const { data } = client!.storage
                .from("site-media")
                .getPublicUrl(file.name);
              return (
                <button
                  type="button"
                  key={file.id || file.name || index}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => insertImage(data.publicUrl)}
                  title={file.name}
                >
                  <Image
                    src={data.publicUrl}
                    alt={file.name}
                    width={72}
                    height={56}
                  />
                </button>
              );
            })}
          </div>
          {!media.length && (
            <small>No uploaded images yet. Use Upload image to add one.</small>
          )}
        </div>
      )}
      <div
        ref={area}
        className="rich-editor-area"
        contentEditable
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: html }}
        onInput={remember}
        onBlur={sync}
        onKeyUp={remember}
        onMouseUp={remember}
        data-placeholder="Write your page content here…"
      />
    </div>
  );
}
function ContentRow({
  title,
  meta,
  published,
  image,
  onEdit,
  onDelete,
}: {
  title: string;
  meta: string;
  published: boolean;
  image?: string;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  return (
    <article className={`content-row ${image ? "has-thumb" : ""}`}>
      {image && (
        <div className="content-thumb content-row-thumb">
          <Image src={image} fill alt="" />
        </div>
      )}
      <div className="content-row-info">
        <h3>{title}</h3>
        <p>{meta}</p>
      </div>
      <span className={`status ${published ? "" : "draft"}`}>
        {published ? "Published" : "Hidden"}
      </span>
      <button onClick={onEdit}>
        <Pencil />
        Edit
      </button>
      {onDelete && (
        <button className="danger" onClick={onDelete}>
          <Trash2 />
        </button>
      )}
    </article>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="admin-empty">
      <FileText />
      <p>{text}</p>
    </div>
  );
}
