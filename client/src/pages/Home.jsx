import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
} from "framer-motion";
import Page from "../components/Page.jsx";
import Reveal from "../components/Reveal.jsx";
import { Placeholder } from "../components/Nail.jsx";
import VideoModal from "../components/VideoModal.jsx";
import VideoCard from "../components/VideoCard.jsx";
import ServiceRow from "../components/ServiceRow.jsx";
import {
  EASE,
  GlossNail,
  Magnetic,
  ScrubText,
  SplitText,
  TiltCard,
  useMedia,
} from "../components/motion.jsx";
import {
  PaletteIcon,
  SparklesIcon,
  HeartIcon,
  GraduationCapIcon,
} from "../components/Icons.jsx";
import { useApp } from "../context.jsx";
import { useTitle } from "../hooks.js";
import "../home.css";

const STYLES = [
  "Cateye",
  "French tips",
  "Short and cute",
  "Press-ons",
  "Marble",
  "Freestyle",
  "Toe nails",
];
const STEPS = [
  [
    "Choose your service",
    "Pick what you want done. Duration and prices are listed upfront.",
    "Almond",
    "#F6C9DA",
    "#C0558F",
  ],
  [
    "Pick a time",
    "See live availability and choose a slot that suits you.",
    "Coffin",
    "#9B6BD0",
    "#3B1A5A",
  ],
  [
    "Get confirmed",
    "Shyfunmi confirms your booking, and you can track it in your account.",
    "Stiletto",
    "#8FA2FF",
    "#2D4BE0",
  ],
];
const ABOUT_HIGHLIGHTS = [
  {
    icon: PaletteIcon,
    label: "Expert Nail Artist",
    desc: "Years of professional experience crafting stunning nail art.",
  },
  {
    icon: SparklesIcon,
    label: "Premium Products",
    desc: "Only top-quality, long-lasting products on every client.",
  },
  {
    icon: HeartIcon,
    label: "Client-First Approach",
    desc: "Your comfort, style and confidence are always the priority.",
  },
  {
    icon: GraduationCapIcon,
    label: "Certified Trainer",
    desc: "Teaching the next generation of nail technicians in Port Harcourt.",
  },
];

const isVideoUrl = (url = "") =>
  /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url) ||
  url.includes("/video/") ||
  url.includes("video/upload/");

/* =====================================================================
   HERO: a real 3D scene. Layers sit at different depths (translateZ), the
   whole stage tilts toward the cursor, and it keeps a gentle idle sway so
   it also feels alive on touch screens.
   ===================================================================== */
const NAILS = [
  {
    shape: "Almond",
    from: "#F8CFE0",
    to: "#C0558F",
    x: "2%",
    y: "56%",
    w: 104,
    z: 110,
    rot: -18,
    d: 0,
  },
  {
    shape: "Coffin",
    from: "#8E4BB0",
    to: "#2A1233",
    x: "74%",
    y: "4%",
    w: 92,
    z: 150,
    rot: 14,
    d: 0.6,
  },
  {
    shape: "Stiletto",
    from: "#8FA2FF",
    to: "#2D4BE0",
    x: "82%",
    y: "60%",
    w: 88,
    z: 80,
    rot: 22,
    d: 1.1,
  },
  {
    shape: "Square",
    from: "#FFFFFF",
    to: "#E2CFDA",
    x: "8%",
    y: "6%",
    w: 78,
    z: -30,
    rot: -8,
    d: 1.6,
  },
  {
    shape: "Almond",
    from: "#ECEEF5",
    to: "#9AA1B5",
    x: "46%",
    y: "84%",
    w: 72,
    z: 170,
    rot: 8,
    d: 2,
  },
];
const CHIPS = [
  { t: "Cateye", x: "-4%", y: "34%", z: 130 },
  { t: "French tips", x: "60%", y: "40%", z: 190 },
  { t: "Chrome", x: "20%", y: "90%", z: 140 },
];
const SPARKS = Array.from({ length: 18 }, (_, i) => ({
  x: (i * 37 + 11) % 100,
  y: (i * 61 + 7) % 100,
  z: ((i * 53) % 320) - 120,
  s: 3 + (i % 4),
  d: (i % 6) * 0.5,
}));

function HeroScene({ photo }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  // Single spring per axis — NO competing useAnimationFrame idle sway on same values
  const sx = useSpring(mx, { stiffness: 60, damping: 18, mass: 0.8 });
  const sy = useSpring(my, { stiffness: 60, damping: 18, mass: 0.8 });
  const rotateY = useTransform(sx, [-1, 1], [-16, 16]);
  const rotateX = useTransform(sy, [-1, 1], [12, -12]);

  useEffect(() => {
    if (reduce) return undefined;
    const f = (e) => {
      if (e.pointerType === "touch") return;
      mx.set((e.clientX / window.innerWidth - 0.5) * 2);
      my.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", f, { passive: true });
    return () => window.removeEventListener("pointermove", f);
  }, [reduce, mx, my]);

  return (
    <div className="hx-scene" aria-hidden="true">
      {/* hx-sway is a pure CSS animation wrapper — no JS, no conflicts with spring */}
      <div className="hx-sway">
        <motion.div className="hx-stage" style={{ rotateX, rotateY }}>
          <div className="hx-disc" />
          <div className="hx-ring a" />
          <div className="hx-ring b" />

          {SPARKS.map((p, i) => (
            <span
              key={i}
              className="hx-spark"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.s,
                height: p.s,
                transform: `translateZ(${p.z}px)`,
                animationDelay: `${p.d}s`,
              }}
            />
          ))}

          <div className="hx-card-layer">
            <motion.div
              className="hx-card"
              animate={reduce ? undefined : { y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              {photo ? (
                <img src={photo.url} alt="" loading="eager" />
              ) : (
                <div className="hx-card-art">
                  <GlossNail
                    shape="Almond"
                    from="#F8CFE0"
                    to="#C0558F"
                    className="n1"
                  />
                  <GlossNail
                    shape="Coffin"
                    from="#8E4BB0"
                    to="#2A1233"
                    className="n2"
                  />
                  <GlossNail
                    shape="Stiletto"
                    from="#8FA2FF"
                    to="#2D4BE0"
                    className="n3"
                  />
                </div>
              )}
              <span className="hx-sheen" />
              <span className="hx-card-tag">
                <i />{" "}
                {photo
                  ? photo.title || photo.category || "Latest set"
                  : "Made with care"}
              </span>
            </motion.div>
          </div>

          {NAILS.map((n, i) => (
            <div
              key={i}
              className="hx-nail-layer"
              style={{
                left: n.x,
                top: n.y,
                width: `calc(${n.w}px * var(--s, 1))`,
                transform: `translateZ(${n.z}px)`,
              }}
            >
              <motion.div
                initial={{ rotate: n.rot }}
                animate={
                  reduce
                    ? undefined
                    : {
                        y: [0, -16, 0],
                        rotate: [n.rot - 5, n.rot + 5, n.rot - 5],
                      }
                }
                transition={{
                  duration: 5.5 + n.d,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: n.d,
                }}
              >
                <GlossNail shape={n.shape} from={n.from} to={n.to} />
              </motion.div>
            </div>
          ))}

          {CHIPS.map((c, i) => (
            <div
              key={c.t}
              className={`hx-chip-layer c${i}`}
              style={{ left: c.x, top: c.y, transform: `translateZ(${c.z}px)` }}
            >
              <motion.span
                className="hx-chip"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 1.1 + i * 0.18,
                  duration: 0.7,
                  ease: EASE,
                }}
              >
                {c.t}
              </motion.span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function Hero({ s, photo }) {
  const ref = useRef(null);
  const { scrollYProgress: p } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const copyY = useTransform(p, [0, 1], [0, -110]);
  const copyO = useTransform(p, [0, 0.75], [1, 0]);
  const sceneY = useTransform(p, [0, 1], [0, 90]);
  const sceneS = useTransform(p, [0, 1], [1, 0.8]);
  // ↓ removed sceneR (rotateX on outer scroll wrapper) — it nested a rotateX on top of the
  //   inner stage rotateX that Framer drives for mouse tilt, causing double-perspective jank.
  const sceneO = useTransform(p, [0, 0.9], [1, 0.1]);

  const spot = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <section className="hx-hero" ref={ref} onPointerMove={spot}>
      <div className="hx-hero-bg" aria-hidden="true" />
      <div className="container hx-hero-in">
        <motion.div className="hx-copy" style={{ y: copyY, opacity: copyO }}>
          <motion.span
            className="hx-kicker"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Nail tech · Port Harcourt
          </motion.span>
          <SplitText
            as="h1"
            immediate
            delay={0.15}
            stagger={0.12}
            text={"Your confidence\nstarts here."}
            accent={["confidence"]}
            className="hx-h1"
          />
          <motion.p
            className="lead"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.8 }}
          >
            Nails that transform confidence. Cateye, French tips, freestyles and
            press-ons, made with care at {s.address}.
          </motion.p>
          <motion.div
            className="cta-row"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <Magnetic>
              <Link className="btn" to="/book">
                Book appointment
              </Link>
            </Magnetic>
            <Magnetic>
              <Link className="btn ghost" to="/gallery">
                See the work
              </Link>
            </Magnetic>
          </motion.div>
          <motion.div
            className="hero-badges"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.7 }}
          >
            <span className="badge">✦ Port Harcourt</span>
            <span className="badge">✦ Loyalty rewards</span>
            <span className="badge">✦ Book online</span>
          </motion.div>
        </motion.div>

        <motion.div
          className="hx-scene-wrap"
          style={{ y: sceneY, scale: sceneS, opacity: sceneO }}
        >
          <HeroScene photo={photo} />
        </motion.div>
      </div>
      <div className="hx-scroll-cue" aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  );
}

/* =====================================================================
   STEPS: each card tips up out of the floor in 3D as you scroll
   ===================================================================== */
function Step3D({ i, step }) {
  const [t, d, shape, from, to] = step;
  const ref = useRef(null);
  const { scrollYProgress: p } = useScroll({
    target: ref,
    offset: ["start 0.98", "start 0.5"],
  });
  const rotateX = useTransform(p, [0, 1], [62, 0]);
  const y = useTransform(p, [0, 1], [110, 0]);
  const opacity = useTransform(p, [0, 0.6], [0, 1]);
  const scale = useTransform(p, [0, 1], [0.88, 1]);
  return (
    <div className="hx-step-wrap">
      <motion.div
        ref={ref}
        className="hx-step"
        style={{ rotateX, y, opacity, scale, transformOrigin: "50% 100%" }}
      >
        <span className="hx-step-num">0{i + 1}</span>
        <GlossNail shape={shape} from={from} to={to} className="hx-step-nail" />
        <h3>{t}</h3>
        <p>{d}</p>
      </motion.div>
    </div>
  );
}

function Steps() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.75", "end 0.7"],
  });
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });
  return (
    <section className="hx-sec container" ref={ref}>
      <span className="hx-kicker">How it works</span>
      <SplitText text="Book in three steps" />
      <div className="hx-line" aria-hidden="true">
        <motion.i style={{ scaleX }} />
      </div>
      <div className="hx-steps">
        {STEPS.map((st, i) => (
          <Step3D key={st[0]} i={i} step={st} />
        ))}
      </div>
    </section>
  );
}

/* =====================================================================
   RECENT WORK: pinned horizontal rail (desktop) driven by vertical scroll
   ===================================================================== */
function WorkRail({ items, onOpen }) {
  const reduce = useReducedMotion();
  const wide = useMedia("(min-width: 820px)");
  const pinned = wide && !reduce;
  const ref = useRef(null);
  const trackRef = useRef(null);
  const distRef = useRef(0);
  const [dist, setDist] = useState(0);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, (v) => -v * distRef.current);
  const { scrollY } = useScroll();
  const sv = useSpring(useVelocity(scrollY), { stiffness: 300, damping: 50 });
  const skewX = useTransform(sv, [-2500, 0, 2500], [6, 0, -6]);

  useEffect(() => {
    if (!pinned) {
      distRef.current = 0;
      setDist(0);
      return undefined;
    }
    const measure = () => {
      const t = trackRef.current;
      if (!t) return;
      const d = Math.max(0, t.scrollWidth - window.innerWidth);
      distRef.current = d;
      setDist(d);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [pinned, items.length]);

  const card = (p, i) => (
    <TiltCard className="hx-work-card" max={9} disabled={!pinned}>
      {p.__ph ? (
        <Placeholder i={i} />
      ) : isVideoUrl(p.url) ? (
        <VideoCard video={p} onClick={() => onOpen(p)} />
      ) : (
        <Link
          to="/gallery"
          className="tile"
          aria-label={`View ${p.title || p.category} in gallery`}
        >
          <img
            src={p.url}
            alt={p.title || `${p.category} nails`}
            loading="lazy"
          />
          {(p.title || p.category) && (
            <span className="tile-cap">{p.title || p.category}</span>
          )}
        </Link>
      )}
    </TiltCard>
  );

  const heading = (
    <>
      <div>
        <span className="hx-kicker">Recent work</span>
        <SplitText text="Fresh off the table" />
      </div>
      <Link className="btn ghost" to="/gallery">
        Full gallery
      </Link>
    </>
  );

  // One persistent <section ref> for both layouts so the scroll binding survives a breakpoint change
  return (
    <section
      ref={ref}
      className={pinned ? "hx-rail" : "hx-sec container"}
      style={pinned ? { height: `calc(100svh + ${dist}px)` } : undefined}
    >
      {pinned ? (
        <div className="hx-rail-pin">
          <div className="hx-head container">{heading}</div>
          <motion.div
            ref={trackRef}
            className="hx-rail-track"
            style={{ x, skewX }}
          >
            {items.map((p, i) => (
              <div className="hx-rail-item" key={p.id ?? i}>
                {card(p, i)}
              </div>
            ))}
          </motion.div>
          <div className="hx-rail-bar container" aria-hidden="true">
            <motion.i style={{ scaleX: scrollYProgress }} />
          </div>
        </div>
      ) : (
        <>
          <div className="hx-head">{heading}</div>
          <div className="hx-grid">
            {items.map((p, i) => (
              <Reveal key={p.id ?? i} delay={(i % 2) * 0.06}>
                {card(p, i)}
              </Reveal>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* =====================================================================
   LOYALTY: stamps flip in one by one
   ===================================================================== */
function Loyalty({ s }) {
  const n = s.loyaltyEvery || 5;
  return (
    <section className="hx-sec container">
      <TiltCard className="hx-loyal" max={3}>
        <div className="hx-loyal-glow" aria-hidden="true" />
        <GlossNail
          shape="Almond"
          from="#F8CFE0"
          to="#C0558F"
          className="hx-loyal-nail a"
        />
        <GlossNail
          shape="Stiletto"
          from="#8FA2FF"
          to="#2D4BE0"
          className="hx-loyal-nail b"
        />
        <div className="hx-loyal-copy">
          <span className="hx-kicker light">Loyalty</span>
          <SplitText text="Come back, get rewarded." />
          <Reveal delay={0.15}>
            <p>
              Every {s.loyaltyEvery}th visit earns {s.loyaltyDiscount}% off, and
              sometimes more. Create an account to track your visits.
            </p>
            <Magnetic>
              <Link className="btn light" to="/register">
                Create account
              </Link>
            </Magnetic>
          </Reveal>
        </div>
        <div className="hx-stamps" aria-hidden="true">
          {Array.from({ length: n }, (_, i) => {
            const gift = i === n - 1;
            return (
              <motion.span
                key={i}
                className={`hx-stamp ${gift ? "gift" : "on"}`}
                initial={{ opacity: 0, scale: 0.2, rotateY: 180 }}
                whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  type: "spring",
                  stiffness: 160,
                  damping: 13,
                  delay: 0.25 + i * 0.16,
                }}
              >
                {gift ? `${s.loyaltyDiscount}%` : i + 1}
              </motion.span>
            );
          })}
        </div>
      </TiltCard>
    </section>
  );
}

/* =====================================================================
   ABOUT: portrait unveils with a curtain, image drifts with scroll
   ===================================================================== */
function AboutSection() {
  const ref = useRef(null);
  const { scrollYProgress: p } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(p, [0, 1], ["-8%", "8%"]);
  const badgeY = useTransform(p, [0, 1], [50, -50]);
  const glowR = useTransform(p, [0, 1], [-20, 20]);
  return (
    <section className="hx-sec container" ref={ref}>
      <span className="hx-kicker">Meet the artist</span>
      <SplitText
        text={"The woman behind\nevery perfect set."}
        className="hx-about-h"
      />
      <div className="hx-about-grid">
        <div className="hx-about-media">
          <motion.div
            className="hx-about-glow"
            style={{ rotate: glowR }}
            aria-hidden="true"
          />
          <div className="hx-about-shadow">
            <motion.div
              className="hx-about-frame"
              initial={{ clipPath: "inset(100% 0% 0% 0% round 36px)" }}
              whileInView={{ clipPath: "inset(0% 0% 0% 0% round 36px)" }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.3, ease: EASE }}
            >
              <motion.img
                src="/shyfunmi-nails.jpeg"
                alt="Shyfunmi — Nail Artist & Owner of Shyfunmi Nails"
                loading="lazy"
                style={{ y: imgY, scale: 1.18 }}
              />
            </motion.div>
          </div>
          <motion.div className="hx-about-badge" style={{ y: badgeY }}>
            <b>5★</b>
            <span>Client rated</span>
          </motion.div>
        </div>

        <div className="about-content">
          <div className="hx-about-scrubs">
            <ScrubText
              className="about-bio hx-about-scrub"
              text="Hi, I'm Shyfunmi, a passionate nail artist based in Port Harcourt, Nigeria. I started Shyfunmi Nails because I believe every woman deserves to feel confident, beautiful, and unapologetically herself, starting from her fingertips."
            />
            <ScrubText
              className="about-bio hx-about-scrub"
              text="My work ranges from classic French tips to bold freestyle designs. Whether you are heading to the office or to a celebration, I will help you choose a style that suits you and the occasion, and I will give each set the time and precision it deserves."
            />
          </div>
          <div className="hx-hl">
            {ABOUT_HIGHLIGHTS.map(({ icon: Icon, label, desc }, i) => (
              <Reveal key={label} delay={i * 0.08}>
                <TiltCard className="hx-hl-card" max={7}>
                  <span className="hx-hl-icon" aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <div>
                    <strong>{label}</strong>
                    <p>{desc}</p>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="cta-row" style={{ marginTop: 32 }}>
              <Magnetic>
                <Link className="btn" to="/book">
                  Book with Shyfunmi
                </Link>
              </Magnetic>
              <Magnetic>
                <a
                  className="btn ghost"
                  href="https://www.facebook.com/Shyfunmi.nails"
                  target="_blank"
                  rel="noreferrer"
                >
                  Follow on Facebook
                </a>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
   PAGE
   ===================================================================== */
export default function Home() {
  useTitle("");
  const { site } = useApp();
  const s = site.settings;
  const [activeVideo, setActiveVideo] = useState(null);

  const recentWork = [...(site.photos || [])]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 6);
  const railItems = recentWork.length
    ? recentWork
    : [0, 1, 2, 3, 4, 5].map((i) => ({ id: `ph${i}`, __ph: true }));
  const heroPhoto = recentWork.find((p) => !isVideoUrl(p.url));
  const videosOnly = recentWork.filter((x) => isVideoUrl(x.url));
  const stepVideo = (dir) => {
    const idx = videosOnly.findIndex((v) => v.id === activeVideo.id);
    if (idx > -1)
      setActiveVideo(
        videosOnly[(idx + dir + videosOnly.length) % videosOnly.length],
      );
  };

  return (
    <Page>
      <Hero s={s} photo={heroPhoto} />

      <section className="hx-sec container">
        <div className="hx-head">
          <div>
            <span className="hx-kicker">What I do</span>
            <SplitText text="Services" />
          </div>
          <Link className="btn ghost" to="/services">
            All services
          </Link>
        </div>
        <div className="hx-rows">
          {site.services.slice(0, 5).map((v, i) => (
            <ServiceRow key={v.id} v={v} i={i} s={s} />
          ))}
        </div>
      </section>

      <Steps />

      <WorkRail items={railItems} onOpen={setActiveVideo} />

      <AnimatePresence>
        {activeVideo && (
          <VideoModal
            item={activeVideo}
            onClose={() => setActiveVideo(null)}
            onPrev={() => stepVideo(-1)}
            onNext={() => stepVideo(1)}
            hasPrev={videosOnly.length > 1}
            hasNext={videosOnly.length > 1}
          />
        )}
      </AnimatePresence>

      <Loyalty s={s} />

      {site.reviews.length > 0 && (
        <section className="hx-sec container">
          <span className="hx-kicker">Reviews</span>
          <SplitText text="Kind words" />
          <div className="hx-reviews">
            {site.reviews.slice(0, 3).map((r, i) => (
              <Reveal key={r.id} delay={i * 0.1} y={50}>
                <TiltCard className="hx-review" max={8}>
                  <div className="stars" aria-label={`${r.rating} out of 5`}>
                    {"★".repeat(r.rating)}
                    <i>{"★".repeat(5 - r.rating)}</i>
                  </div>
                  {r.text && <p>{r.text}</p>}
                  <small>
                    {r.author}, {r.service}
                  </small>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <AboutSection />

      <section className="hx-sec container hx-cta">
        <ScrubText
          className="hx-scrub"
          text="Learn the craft. Nail training is available. Beginners and working techs are welcome."
        />
        <Reveal>
          <Magnetic>
            <Link className="btn" to="/training">
              Explore training
            </Link>
          </Magnetic>
        </Reveal>
      </section>
    </Page>
  );
}
