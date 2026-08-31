import AccountPanel from "./components/AccountPanel";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Blocks,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Heart,
  Home,
  Languages,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";
import { useLanguageStore } from "@/shared/languageStore";
import { useModalA11y } from "@/shared/useModalA11y";
import {
  categories,
  toolCatalog,
  filterTools,
  type CategoryId,
  type Tool,
} from "./catalog";
import { useToolsPreferences } from "./store";

const ToolWorkspace = lazy(() => import("./components/ToolWorkspace"));

export default function ToolsApp() {
  const { language, setLanguage } = useLanguageStore();
  const {
    theme,
    toggleTheme,
    favorites,
    toggleFavorite,
    recent,
    recordRecent,
    clearRecent,
  } = useToolsPreferences();
  const text = (en: string, th: string) => (language === "th" ? th : en);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId>("all");
  const [view, setView] = useState<"home" | "all" | "favorites">("home");
  const [sort, setSort] = useState("recommended");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  useModalA11y({
    open: mobileOpen,
    onClose: () => setMobileOpen(false),
    containerRef: sidebarRef,
  });
  const tools = filterTools(
    query,
    category,
    favorites,
    view === "favorites",
    sort,
    language,
  );
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.toolsTheme = theme;
    const shortcut = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k" &&
        !activeTool &&
        !mobileOpen
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [language, theme, activeTool, mobileOpen]);
  const navigate = (next: typeof view, nextCategory: CategoryId = "all") => {
    setView(next);
    setCategory(nextCategory);
    setQuery("");
    setMobileOpen(false);
  };
  return (
    <div className="tools-app">
      <a className="skip-link" href="#tools-main">
        {text("Skip to tools", "ข้ามไปยังเครื่องมือ")}
      </a>
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          aria-label={text("Close menu", "ปิดเมนู")}
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen || undefined}
        className={`sidebar ${mobileOpen ? "is-open" : ""}`}
        aria-label={text("Main navigation", "เมนูหลัก")}
      >
        <a className="brand" href="#" onClick={() => navigate("home")}>
          <span className="brand-mark">N</span>
          <span>
            Nexus <b>Tools</b>
          </span>
        </a>
        <button
          className="mobile-close icon-button"
          aria-label={text("Close menu", "ปิดเมนู")}
          onClick={() => setMobileOpen(false)}
        >
          <X size={18} />
        </button>
        <nav className="primary-nav">
          {(
            [
              { id: "home", icon: Home, en: "Home", th: "หน้าหลัก" },
              {
                id: "all",
                icon: Blocks,
                en: "All tools",
                th: "เครื่องมือทั้งหมด",
              },
              {
                id: "favorites",
                icon: Heart,
                en: "Favorites",
                th: "รายการโปรด",
              },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "nav-item active" : "nav-item"}
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={19} />
              <span>{text(item.en, item.th)}</span>
              {item.id === "favorites" && <small>{favorites.length}</small>}
              {view === item.id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="nav-divider" />
        <p className="nav-label">
          {text("YOUR TOOLKIT", "หมวดหมู่เครื่องมือ")}
        </p>
        <nav className="category-nav">
          {categories
            .filter((item) => item.id !== "all")
            .map((item) => (
              <button
                key={item.id}
                className={`nav-item ${category === item.id ? "selected" : ""}`}
                onClick={() => navigate("all", item.id)}
                aria-pressed={category === item.id}
              >
                <item.icon size={18} />
                <span>{item.name[language]}</span>
                <ChevronRight size={14} />
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note">
            <ShieldCheck size={21} />
            <strong>
              {text("Your files stay yours.", "ไฟล์ของคุณอยู่กับคุณ")}
            </strong>
            <p>
              {text(
                "Most tools run locally. Nexus media sharing uploads selected files.",
                "เครื่องมือทั่วไปทำงานในเบราว์เซอร์ ส่วนแชร์สื่อ Nexus จะอัปโหลดไฟล์",
              )}
            </p>
          </div>
          <a
            className="nav-item"
            href="#help"
            onClick={() => setMobileOpen(false)}
          >
            <CircleHelp size={18} />
            {text("Help & information", "ช่วยเหลือและข้อมูล")}
          </a>
          <div className="sidebar-foot">
            NEXUS ECOSYSTEM <span>01</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label={text("Open menu", "เปิดเมนู")}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <Home size={17} />
            <ChevronRight size={13} />
            <span>
              {view === "favorites"
                ? text("Favorites", "รายการโปรด")
                : text("Workspace", "พื้นที่ทำงาน")}
            </span>
          </div>
          <div className="search">
            <Search size={18} />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={text(
                "Find your next tool...",
                "ค้นหาเครื่องมือที่คุณต้องการ...",
              )}
              aria-label={text("Search tools", "ค้นหาเครื่องมือ")}
            />
            {query ? (
              <button
                className="icon-button"
                aria-label={text("Clear search", "ล้างการค้นหา")}
                onClick={() => setQuery("")}
              >
                <X size={16} />
              </button>
            ) : (
              <kbd>Ctrl K</kbd>
            )}
          </div>
          <div className="header-actions">
            <button
              className="language-button"
              aria-label={text("Switch to Thai", "เปลี่ยนเป็นภาษาอังกฤษ")}
              onClick={() => setLanguage(language === "en" ? "th" : "en")}
            >
              <Languages size={17} />
              <span>{language.toUpperCase()}</span>
            </button>
            <span className="action-divider" />
            <button
              className="icon-button"
              aria-label={
                theme === "dark"
                  ? text("Use light theme", "ใช้ธีมสว่าง")
                  : text("Use dark theme", "ใช้ธีมมืด")
              }
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </div>
        </header>
        <main id="tools-main" tabIndex={-1}>
          <AccountPanel />
          {view === "home" && !query && (
            <section className="hero">
              <div className="eyebrow">
                <span /> THE NEXUS TOOLKIT
              </div>
              <h1>
                {text("Practical tools.", "เครื่องมือที่ใช่")}
                <br />
                <span>
                  {text(
                    "A simpler way to work.",
                    "เพื่อทุกวันทำงานที่ง่ายขึ้น",
                  )}
                </span>
              </h1>
              <p>
                {text(
                  "A considered collection of tools for documents, images and everyday work.",
                  "รวมเครื่องมือสำหรับเอกสาร รูปภาพ และงานประจำวัน ไว้ในที่เดียว",
                )}
              </p>
              <a href="#tool-list" className="hero-link">
                {text("Find what you need", "เลือกเครื่องมือที่คุณต้องการ")}
                <ArrowDown size={14} />
              </a>
            </section>
          )}
          <div
            className="category-strip"
            aria-label={text("Tool categories", "หมวดหมู่เครื่องมือ")}
          >
            {categories.map((item) => (
              <button
                key={item.id}
                className={`category-tile tone-${item.color} ${category === item.id ? "chosen" : ""}`}
                aria-pressed={category === item.id}
                onClick={() => {
                  setCategory(item.id);
                  if (view === "home") setView("all");
                }}
              >
                <span className="category-icon">
                  <item.icon size={29} strokeWidth={1.7} />
                </span>
                <span>{item.name[language]}</span>
              </button>
            ))}
          </div>
          {recent.length > 0 && (
            <section
              className="recent-tools"
              aria-label={text("Recently used", "ใช้ล่าสุด")}
            >
              <strong>{text("Recently used", "ใช้ล่าสุด")}</strong>
              {recent.map((id) => {
                const tool = toolCatalog.find((t) => t.id === id);
                return tool ? (
                  <button
                    key={id}
                    className="button secondary"
                    onClick={() => {
                      recordRecent(id);
                      setActiveTool(tool);
                    }}
                  >
                    {tool.name[language]}
                  </button>
                ) : null;
              })}
              <button className="button secondary" onClick={clearRecent}>
                {text("Clear recent", "ล้างรายการล่าสุด")}
              </button>
            </section>
          )}
          <section id="tool-list" className="tool-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">
                  {text("MADE FOR YOUR EVERYDAY", "พร้อมช่วยงานของคุณ")}
                </span>
                <h2>
                  {view === "favorites"
                    ? text("Your favorites", "เครื่องมือโปรดของคุณ")
                    : text("Explore tools", "เลือกเครื่องมือสำหรับคุณ")}
                  <span className="count">{tools.length}</span>
                </h2>
              </div>
              <label className="sort-label">
                <span className="sr-only">
                  {text("Sort tools", "เรียงเครื่องมือ")}
                </span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="recommended">
                    {text("Recommended", "แนะนำ")}
                  </option>
                  <option value="az">{text("Name A–Z", "ตามชื่อ")}</option>
                </select>
                <ChevronDown size={14} />
              </label>
            </div>
            <div className="tool-grid">
              {tools.map((tool) => {
                const group = categories.find(
                  (item) => item.id === tool.category,
                )!;
                return (
                  <article
                    key={tool.id}
                    className={`tool-card tone-${group.color}`}
                  >
                    <button
                      className="tool-card-main"
                      onClick={(event) => {
                        event.currentTarget.focus();
                        recordRecent(tool.id);
                        setActiveTool(tool);
                      }}
                      aria-label={`${text("Open", "เปิด")} ${tool.name[language]}`}
                    >
                      <span className="tool-icon">
                        <tool.icon size={21} strokeWidth={1.8} />
                      </span>
                      <h3>{tool.name[language]}</h3>
                      <p>{tool.description[language]}</p>
                      <div className="card-footer">
                        <span>
                          <i />
                          {group.name[language]}
                        </span>
                        <ArrowRight size={16} />
                      </div>
                    </button>
                    <button
                      className={`favorite-button ${favorites.includes(tool.id) ? "saved" : ""}`}
                      aria-pressed={favorites.includes(tool.id)}
                      aria-label={`${text("Favorite", "รายการโปรด")} ${tool.name[language]}`}
                      onClick={() => toggleFavorite(tool.id)}
                    >
                      <Heart
                        size={17}
                        fill={
                          favorites.includes(tool.id) ? "currentColor" : "none"
                        }
                      />
                    </button>
                  </article>
                );
              })}
            </div>
            {!tools.length && (
              <div className="empty-state">
                <Search size={30} />
                <h3>
                  {text(
                    "Nothing here just yet",
                    "ยังไม่มีเครื่องมือในรายการนี้",
                  )}
                </h3>
                <p>
                  {view === "favorites"
                    ? text(
                        "Save a tool using the heart icon, or clear your filters.",
                        "กดรูปหัวใจบนเครื่องมือเพื่อบันทึก หรือล้างตัวกรอง",
                      )
                    : text(
                        "Try another search or category.",
                        "ลองค้นหาด้วยคำอื่น หรือเปลี่ยนหมวดหมู่",
                      )}
                </p>
                <button
                  className="button secondary"
                  onClick={() => navigate("all")}
                >
                  {text("Show all tools", "ดูเครื่องมือทั้งหมด")}
                </button>
              </div>
            )}
          </section>
          <section id="help" className="faq">
            <div>
              <span className="section-kicker">
                {text("A LITTLE GUIDANCE", "ข้อมูลก่อนเริ่มใช้งาน")}
              </span>
              <h2>{text("Good to know.", "คำถามที่พบบ่อย")}</h2>
              <p>
                {text(
                  "Less friction. More getting things done.",
                  "เข้าใจง่าย พร้อมลงมือทำงาน",
                )}
              </p>
            </div>
            <div className="faq-questions">
              {[
                [
                  text("Do I need an account?", "ต้องสมัครสมาชิกหรือไม่?"),
                  text(
                    "No account is required. Open a tool and get started. Favorites and language preferences are saved on this device.",
                    "ไม่ต้องสมัครสมาชิก เริ่มใช้ได้ทันที รายการโปรดและภาษาจะบันทึกเฉพาะอุปกรณ์นี้",
                  ),
                ],
                [
                  text(
                    "What happens to my files?",
                    "ไฟล์ของฉันถูกส่งไปที่ไหน?",
                  ),
                  text(
                    "Most processing runs in this browser. Nexus media uploads are stored on Vercel and accessible to anyone with their sharing link. Administrators can delete them in the QR tool. Closing a tool clears its inputs, except document history, contacts, invoice drafts and settings you explicitly save on this device. Delete saved drafts/settings using the tool controls. Downloaded files remain on your device.",
                    "เครื่องมือทั่วไปประมวลผลในเบราว์เซอร์ ส่วนอัปโหลดสื่อ Nexus จะเก็บไฟล์บน Vercel ผู้มีลิงก์ดูได้ ผู้ดูแลลบได้ในเครื่องมือ QR ปิดเครื่องมือจะล้างข้อมูล ยกเว้นประวัติเอกสาร สมุดข้อมูล แบบร่างและการตั้งค่าที่คุณเลือกบันทึกบนอุปกรณ์ ซึ่งลบได้จากปุ่มในเครื่องมือ ส่วนไฟล์ดาวน์โหลดจะยังอยู่",
                  ),
                ],
                [
                  text("Are there file limits?", "มีข้อจำกัดของไฟล์หรือไม่?"),
                  text(
                    "Merge/split: 50 MB, 500 pages. PDF page editing: 100 pages. OCR: 20 MB, 10 PDF pages. Images: JPEG, PNG or WebP up to 20 MB and 24 megapixels; batch tools up to 20 files, 50 MB total. Protected PDFs are not supported. Image output is a still image.",
                    "รวม/แยก PDF: 50 MB, 500 หน้า จัดการหน้า PDF: 100 หน้า OCR: 20 MB, PDF 10 หน้า รูปภาพ JPEG/PNG/WebP ไฟล์ละ 20 MB, 24 ล้านพิกเซล งานเป็นชุดสูงสุด 20 ไฟล์รวม 50 MB ไม่รองรับ PDF ล็อกรหัส ภาพส่งออกเป็นภาพนิ่ง",
                  ),
                ],
              ].map(([question, answer]) => (
                <details key={question}>
                  <summary>
                    {question}
                    <span>+</span>
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </section>
          <footer className="page-footer">
            <span>
              Nexus Tools <i />
              {text("A little more productive.", "ให้ทุกวันทำงานง่ายขึ้น")}
            </span>
            <span>
              {text("Built for everyday work", "ออกแบบเพื่อการทำงานทุกวัน")}
              <span className="footer-dot" />
            </span>
          </footer>
        </main>
      </div>
      {activeTool && (
        <Suspense
          fallback={
            <div className="loading-notice" role="status">
              {text("Opening tool…", "กำลังเปิดเครื่องมือ…")}
            </div>
          }
        >
          <ToolWorkspace
            tool={activeTool}
            onClose={() => setActiveTool(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
