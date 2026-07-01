import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  ClipboardList,
  UserCog,
  CreditCard,
  FlaskConical,
  Siren,
  Heart,
  CheckCircle,
  Send,
  Edit3,
  ChevronRight,
} from "lucide-react";
import "./LandingPage.css";
import logo from "@/assets/logo.png";

// ─── Star Component ──────────────────────────────────────────────────────────────

function Star() {
  return (
    <svg viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

// ─── Features Data ───────────────────────────────────────────────────────────────

const features = [
  {
    icon: Calendar,
    color: "teal",
    title: "Appointment Scheduling",
    desc: "Intuitive calendar management for doctors and automated reminders for patients to reduce no-shows.",
  },
  {
    icon: ClipboardList,
    color: "sky",
    title: "Patient Records",
    desc: "Secure, encrypted storage for comprehensive medical histories, accessible instantly by authorized clinicians.",
  },
  {
    icon: UserCog,
    color: "slate",
    title: "Doctor Management",
    desc: "Manage schedules, specializations, and availability across multiple departments with ease.",
  },
  {
    icon: CreditCard,
    color: "rose",
    title: "Billing System",
    desc: "Automated invoicing, insurance claim processing, and integrated payment gateways for seamless transactions.",
  },
  {
    icon: FlaskConical,
    color: "emerald",
    title: "Laboratory Reports",
    desc: "Direct integration with lab equipment for real-time result updates and digital report distribution.",
  },
  {
    icon: Siren,
    color: "amber",
    title: "Emergency Services",
    desc: "Critical care prioritization and rapid response coordination for life-saving efficiency.",
  },
];

// ─── Services Data ───────────────────────────────────────────────────────────────

const services = [
  {
    label: "General OPD",
    desc: "Streamlined outpatient services with minimal wait times and expert consultation across all specialties.",
    img: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=480&h=320&fit=crop",
  },
  {
    label: "ICU & Critical Care",
    desc: "24/7 monitoring with cutting-edge life support systems and highly trained critical care staff.",
    img: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=480&h=320&fit=crop",
  },
  {
    label: "Pharmacy & Inventory",
    desc: "Fully automated pharmacy inventory management ensuring 100% medication availability and accuracy.",
    img: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=480&h=320&fit=crop",
  },
  {
    label: "Laboratory Info System",
    desc: "Integrated diagnostic workflows that deliver accurate lab results directly to your digital health record.",
    img: "https://images.unsplash.com/photo-1579165466991-467135ad3110?w=480&h=320&fit=crop",
  },
  {
    label: "Human Resources",
    desc: "Comprehensive staff management, from recruitment and payroll to performance tracking and training.",
    img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=480&h=320&fit=crop",
  },
  {
    label: "Radiology & PACS",
    desc: "Advanced medical imaging with digital archiving and communication for rapid specialist reviews.",
    img: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=480&h=320&fit=crop",
  },
];

// ─── Testimonials Data ───────────────────────────────────────────────────────────

const testimonials = [
  {
    quote:
      "CarePoint has transformed how we manage our patient flow. The intuitive dashboard has saved our staff hours of administrative work every week.",
    name: "Dr. Robert Chen",
    role: "Head of Surgery, St. Judes",
    avatar: "https://i.pravatar.cc/100?img=12",
  },
  {
    quote:
      "The integration between the laboratory and patient records is seamless. It allows us to make critical decisions faster than ever before.",
    name: "Dr. Elena Rodriguez",
    role: "Chief Cardiologist, MedPrime",
    avatar: "https://i.pravatar.cc/100?img=32",
  },
  {
    quote:
      "Finally, a medical platform that doesn't feel like a 90s software. It's beautiful, functional, and actually helps us provide better care.",
    name: "Dr. James Wilson",
    role: "Pediatrician, City General",
    avatar: "https://i.pravatar.cc/100?img=59",
  },
];

// ─── Main Component ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      {/* ═══ Navbar ═══ */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <Link to="/" className="lp-nav-logo flex items-center gap-2">
            <img src={logo} alt="MediCare+" className="h-9 w-auto object-contain" />
          </Link>

          <ul className="lp-nav-links">
            <li><a href="#" className="active">Home</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#features">Doctors</a></li>
            <li><a href="#features">Departments</a></li>
            <li><a href="#testimonials">About</a></li>
            <li><a href="#cta">Contact</a></li>
          </ul>

          <div className="lp-nav-actions">
            <Link to="/auth?mode=login" className="lp-nav-login">Login</Link>
            <Link to="/auth?mode=signup" className="lp-nav-register">Register</Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ═══ Hero Section ═══ */}
        <section className="lp-hero">
          <div className="lp-hero-inner">
            {/* Left Content */}
            <div>
              <div className="lp-hero-badge lp-animate-in">
                <span className="lp-hero-badge-dot" />
                TRUSTED BY 500+ HOSPITALS WORLDWIDE
              </div>

              <h1 className="lp-hero-heading lp-animate-in lp-animate-delay-1">
                Hospital Management made simple for everyone.
              </h1>

              <p className="lp-hero-subtext lp-animate-in lp-animate-delay-2">
                Streamline your clinical workflows, manage patient records with precision, and focus on what truly matters: providing exceptional care.
              </p>

              <div className="lp-hero-buttons lp-animate-in lp-animate-delay-3">
                <Link to="/auth?mode=signup" className="lp-btn-primary">
                  Get Started <ArrowRight size={18} />
                </Link>
                <Link to="/auth?mode=login" className="lp-btn-outline">
                  Book Appointment
                </Link>
              </div>

              <div className="lp-hero-stats lp-animate-in lp-animate-delay-4">
                <div>
                  <div className="lp-stat-value">500+</div>
                  <div className="lp-stat-label">Doctors</div>
                </div>
                <div>
                  <div className="lp-stat-value">50K+</div>
                  <div className="lp-stat-label">Patients</div>
                </div>
                <div>
                  <div className="lp-stat-value">24/7</div>
                  <div className="lp-stat-label">Emergency</div>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="lp-hero-visual lp-animate-in lp-animate-delay-2">
              {/* Main Card */}
              <div className="lp-hero-card-main">
                <div className="lp-hero-card-dots">
                  <span /><span /><span />
                </div>
                <div className="lp-hero-card-placeholder">
                  <div className="lp-placeholder-block" />
                  <div className="lp-placeholder-block" />
                  <div className="lp-placeholder-block" />
                </div>
              </div>

              {/* Floating Appointment Card */}
              <div className="lp-float-appt">
                <img
                  src="https://i.pravatar.cc/100?img=47"
                  alt="Dr. Sarah"
                  className="lp-float-appt-avatar"
                />
                <div>
                  <div className="lp-float-appt-title">Appt. Scheduled</div>
                  <div className="lp-float-appt-sub">Dr. Sarah Johnson</div>
                </div>
              </div>

              {/* Floating Vitals Card */}
              <div className="lp-float-vitals">
                <div className="lp-float-vitals-header">
                  <span className="lp-float-vitals-title">Patient Vitals</span>
                  <span className="lp-float-vitals-check">✓</span>
                </div>
                <div className="lp-vitals-bar">
                  <div className="lp-vitals-bar-fill" style={{ width: "72%" }} />
                </div>
                <div className="lp-vitals-labels">
                  <span>BP</span>
                  <span>72 bpm</span>
                </div>
              </div>

              {/* Floating Pen Icon */}
              <div className="lp-hero-float-pen">
                <Edit3 size={18} />
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Features Section ═══ */}
        <section id="features" className="lp-features">
          <div className="lp-features-inner">
            <h2 className="lp-section-heading">Everything your hospital needs.</h2>
            <div className="lp-features-grid">
              {features.map((f, i) => (
                <div key={i} className="lp-feature-card">
                  <div className={`lp-feature-icon ${f.color}`}>
                    <f.icon size={24} />
                  </div>
                  <h3 className="lp-feature-title">{f.title}</h3>
                  <p className="lp-feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Services Section ═══ */}
        <section id="services" className="lp-services">
          <div className="lp-services-inner">
            <div className="lp-services-header">
              <div className="lp-services-header-left">
                <h2>Our Specialized Services</h2>
                <p>Advanced healthcare infrastructure designed to support every medical specialization with precision and care.</p>
              </div>
              <a href="#services" className="lp-services-view-all">
                View All Services <ChevronRight size={16} />
              </a>
            </div>

            <div className="lp-services-grid">
              {services.map((s, i) => (
                <div key={i} className="lp-service-card">
                  <div className="lp-service-img-wrapper">
                    <img src={s.img} alt={s.label} loading="lazy" />
                    <div className="lp-service-label">{s.label}</div>
                  </div>
                  <div className="lp-service-body">
                    <p>{s.desc}</p>
                    <a href="#" className="lp-service-link">
                      Learn More <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Testimonials Section ═══ */}
        <section id="testimonials" className="lp-testimonials">
          <div className="lp-testimonials-inner">
            <div className="lp-testimonials-header">
              <h2>Trusted by Leading Clinicians</h2>
              <p>Hear from the medical professionals who use CarePoint every day.</p>
            </div>

            <div className="lp-testimonials-grid">
              {testimonials.map((t, i) => (
                <div key={i} className="lp-testimonial-card">
                  <div className="lp-testimonial-stars">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} />)}
                  </div>
                  <p className="lp-testimonial-quote">"{t.quote}"</p>
                  <div className="lp-testimonial-author">
                    <img src={t.avatar} alt={t.name} className="lp-testimonial-avatar" />
                    <div>
                      <p className="lp-testimonial-name">{t.name}</p>
                      <p className="lp-testimonial-role">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CTA Banner ═══ */}
        <section id="cta" className="lp-cta">
          <div className="lp-cta-inner">
            <h2>Ready to modernize your hospital operations?</h2>
            <p>
              Join hundreds of leading healthcare facilities and experience the future of clinical management today.
            </p>
            <div className="lp-cta-buttons">
              <Link to="/auth?mode=signup" className="lp-cta-btn-white">
                Start Free Trial
              </Link>
              <a href="#cta" className="lp-cta-btn-outline">
                Contact Sales
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ Footer ═══ */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-grid">
            {/* Brand Column */}
            <div className="lp-footer-brand">
              <div className="lp-footer-brand-name">
                <div className="lp-nav-logo-icon"><Heart size={16} /></div>
                <span>CarePoint Health</span>
              </div>
              <p>Providing intelligent solutions for the modern healthcare era. Healing simplified.</p>
              <div className="lp-footer-socials">
                <a href="#" aria-label="Twitter">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                </a>
                <a href="#" aria-label="GitHub">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="lp-footer-col">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#">Find a Doctor</a></li>
                <li><a href="#">Book Appointment</a></li>
                <li><a href="#">Our Departments</a></li>
                <li><a href="#">Services & Pricing</a></li>
              </ul>
            </div>

            {/* Support */}
            <div className="lp-footer-col">
              <h4>Support Resources</h4>
              <ul>
                <li><a href="#">Patient Portal Help</a></li>
                <li><a href="#">Staff Training</a></li>
                <li><a href="#">API Documentation</a></li>
                <li><a href="#">Knowledge Base</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="lp-footer-col lp-footer-newsletter">
              <h4>Newsletter</h4>
              <p>Stay updated with our latest healthcare insights.</p>
              <div className="lp-footer-newsletter-input">
                <input type="email" placeholder="Your Email" />
                <button aria-label="Subscribe">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="lp-footer-bottom">
            <span>&copy; {new Date().getFullYear()} CarePoint Health. All rights reserved.</span>
            <div className="lp-footer-bottom-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Settings</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
