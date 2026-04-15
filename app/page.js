"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import {
  fmtNum,
  generateAnalysis,
  getRingColor,
  getScoreColor,
  loadingSteps,
  scoreLabels,
  stampTexts
} from "../lib/analysis";

const initialAnimatedScores = {
  average: 0,
  cardBarOne: 0,
  cardBarTwo: 0,
  itemScores: {}
};

function AnimatedNumber({ value, className = "" }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frameId;
    let startTime;
    const duration = 1000;

    const tick = (time) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      setDisplayValue(Math.floor(progress * value));
      if (progress < 1) frameId = window.requestAnimationFrame(tick);
    };

    setDisplayValue(0);
    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [value]);

  return <span className={className}>{displayValue}</span>;
}

function ScoreCard({ metricKey, details, delayClass, animatedValue }) {
  const label = scoreLabels[metricKey];
  if (!label) return null;

  return (
    <div
      className={`fade-in-up ${delayClass} flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md`}
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <h4 className="brand-head text-charcoal-brand text-lg font-bold">
          <i className={`bi ${label.icon} mr-2 opacity-50`} />
          {label.title}
        </h4>
        <AnimatedNumber value={animatedValue} className="text-xl font-black" />
      </div>
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`score-bar-fill h-2 rounded-full ${getScoreColor(details.score, label.reverseColor)}`}
          style={{ width: `${animatedValue}%` }}
        />
      </div>
      <p className="mt-auto text-sm leading-relaxed text-gray-600 italic">
        &quot;{details.roast}&quot;
      </p>
    </div>
  );
}

export default function HomePage() {
  const [username, setUsername] = useState("");
  const [view, setView] = useState("hero");
  const [error, setError] = useState("");
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [stampAnimating, setStampAnimating] = useState(false);
  const [animatedScores, setAnimatedScores] = useState(initialAnimatedScores);
  const shareCardRef = useRef(null);

  const scoreEntries = useMemo(
    () => Object.entries(scanResult?.analysis?.scores || {}),
    [scanResult]
  );

  useEffect(() => {
    if (view !== "loading") return undefined;

    setLoadingIndex(0);
    const intervalId = window.setInterval(() => {
      setLoadingIndex((current) =>
        current < loadingSteps.length - 1 ? current + 1 : current
      );
    }, 1400);

    return () => window.clearInterval(intervalId);
  }, [view]);

  useEffect(() => {
    if (!scanResult) return undefined;

    window.scrollTo({ top: 0, behavior: "smooth" });
    setStampAnimating(false);
    setAnimatedScores(initialAnimatedScores);

    const animationFrame = window.requestAnimationFrame(() => {
      setStampAnimating(true);
      setAnimatedScores({
        average: scanResult.analysis.average_score,
        cardBarOne: 100,
        cardBarTwo: scanResult.analysis.average_score,
        itemScores: Object.fromEntries(
          Object.entries(scanResult.analysis.scores).map(([key, details]) => [
            key,
            details.score
          ])
        )
      });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [scanResult]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Enter" && view === "hero") {
        void startScanning();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [view, username]);

  const startScanning = async () => {
    const cleanUsername = username.trim().replace("@", "");
    if (!cleanUsername) {
      setError("Username daalo pehle!");
      return;
    }

    setError("");
    setView("loading");

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: cleanUsername })
      });

      const json = await response.json();
      if (!response.ok || json.error) {
        setView("hero");
        setError(json.error || "Something went wrong. Try again.");
        return;
      }

      const profile = json.profile;
      const analysis = generateAnalysis(profile);

      window.setTimeout(() => {
        setScanResult({
          profile,
          analysis,
          meta: json.meta || null,
          cardRank: `#${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`
        });
        setView("result");
      }, 800);
    } catch (scanError) {
      setView("hero");
      setError("Server se connect nahi ho paya. Flask server run kar pehle!");
    }
  };

  const downloadCard = async () => {
    if (!shareCardRef.current || !scanResult) return;

    try {
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false
      });

      const link = document.createElement("a");
      link.download = `rishta_scan_${scanResult.profile.username || "card"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      window.alert(
        "Screenshot ke liye browser permission chahiye. Try kar screenshot shortcut se!"
      );
    }
  };

  const resetApp = () => {
    setUsername("");
    setError("");
    setLoadingIndex(0);
    setScanResult(null);
    setAnimatedScores(initialAnimatedScores);
    setView("hero");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const profile = scanResult?.profile;
  const analysis = scanResult?.analysis;
  const meta = scanResult?.meta;
  const firstName = (profile?.full_name || profile?.username || "—")
    .split(" ")[0]
    .toUpperCase();
  const ringCircumference = 40 * 2 * Math.PI;
  const ringOffset = analysis
    ? ringCircumference - (analysis.average_score / 100) * ringCircumference
    : ringCircumference;

  return (
    <div className="page-pattern brand-body min-h-screen text-charcoal-brand">
      <nav className="cream-glass border-saffron-soft sticky top-0 z-50 flex w-full items-center justify-center border-b p-4 backdrop-blur-sm">
        <div className="brand-head text-deepred-brand flex items-center gap-2 text-2xl font-bold tracking-tight">
          <i className="bi bi-eye text-saffron-brand" />
          PerfectPartner.AI
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-5xl flex-grow flex-col items-center justify-center p-4 md:p-8">
        {view === "hero" && (
          <section className="fade-in-up flex w-full flex-col items-center space-y-8 py-10 text-center">
            <div className="max-w-2xl space-y-4">
              <span className="text-deepred-brand mb-2 inline-block rounded-full bg-red-100 px-4 py-1 text-xs font-semibold tracking-wider">
                beta v1.0 · Mom approved
              </span>
              <h1 className="brand-head text-charcoal-brand text-5xl leading-tight font-black md:text-7xl">
                <span className="brand-gradient-text">
                  Rishta AI
                </span>{" "}
                ne pakad liya{" "}
                <i className="bi bi-search text-saffron-brand text-4xl opacity-80" />
              </h1>
              <p className="text-xl font-medium text-gray-700 md:text-2xl">
                Instagram daalo. Scan karo.{" "}
                <span className="line-through decoration-red-500 opacity-70">
                  Shaadi karo
                </span>{" "}
                ya bhago.
              </p>
            </div>

            <div className="brand-shadow border-saffron-soft relative w-full max-w-md rounded-3xl border bg-white p-6">
              <div className="absolute -top-4 -right-4 text-3xl opacity-50">
                <i className="bi bi-flower1 text-saffron-brand" />
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-lg font-bold text-gray-400">@</span>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="text-charcoal-brand border-saffron-strong w-full rounded-xl border-2 border-gray-200 bg-gray-50 py-4 pr-4 pl-10 text-lg font-medium outline-none transition-colors placeholder:text-gray-400 focus:border-[#ff9933]"
                    placeholder="Instagram Username daalo"
                    autoComplete="off"
                  />
                </div>

                {error ? (
                  <div className="rounded-lg bg-red-50 px-4 py-2 text-left text-sm text-red-600">
                    {error}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => void startScanning()}
                  className="brand-gradient-bg flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
                >
                  Scan Karo <i className="bi bi-ev-front-fill" />
                </button>
              </div>
            </div>

            <p className="max-w-sm text-xs text-gray-500">
              *Purely for entertainment. Session ID is used only to fetch public
              profile data. Not stored anywhere.
            </p>
          </section>
        )}

        {view === "loading" && (
          <section className="flex min-h-[60vh] w-full flex-col items-center justify-center space-y-8 py-20">
            <div className="text-deepred-brand relative h-32 w-32">
              <svg className="spin-mandala h-full w-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="10 5"
                  opacity="0.5"
                />
                <path
                  fill="currentColor"
                  d="M50,10 C50,10 60,30 60,50 C60,70 50,90 50,90 C50,90 40,70 40,50 C40,30 50,10 50,10 Z"
                  opacity="0.8"
                />
                <circle cx="50" cy="50" r="10" fill="#FF9933" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="bi bi-eye-fill pb-1 text-white" />
              </div>
            </div>
            <div className="flex h-16 w-full items-center justify-center px-4">
              <p className="brand-head text-charcoal-brand text-center text-xl font-bold transition-opacity duration-300 md:text-2xl">
                {loadingSteps[loadingIndex]}
              </p>
            </div>
            <p className="text-sm italic text-gray-400">
              Thoda sabar karo, uncle/aunty scan kar rahe hain...
            </p>
          </section>
        )}

        {view === "result" && profile && analysis && (
          <section className="flex w-full flex-col space-y-8 pb-20">
            {meta ? (
              <div className="status-banner fade-in-up rounded-2xl px-4 py-3 text-sm text-[#7a3c10]">
                <span className="font-bold">Result status:</span>{" "}
                {meta.exactMatch
                  ? `Exact profile match confirmed for @${meta.requestedUsername}.`
                  : meta.message}
              </div>
            ) : null}

            <div className="brand-shadow border-saffron-strong fade-in-up relative flex flex-col items-center gap-8 overflow-hidden rounded-3xl border-t-8 bg-white p-6 md:flex-row md:p-10">
              <div className="relative h-32 w-32 shrink-0 md:h-40 md:w-40">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-200 shadow-lg">
                  {profile.profile_pic_b64 ? (
                    <img
                      src={profile.profile_pic_b64}
                      alt={profile.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <i className="bi bi-person-bounding-box text-5xl text-gray-400" />
                  )}
                </div>
                <div className="absolute -right-2 -bottom-2 rounded-full bg-white p-1 shadow">
                  <i className="bi bi-eye-fill text-2xl text-blue-600" />
                </div>
              </div>

              <div className="relative z-10 flex-grow space-y-2 text-center md:text-left">
                <div className="flex flex-col flex-wrap items-center gap-3 md:flex-row">
                  <h2 className="brand-head text-charcoal-brand text-3xl font-bold capitalize">
                    {profile.full_name || profile.username}
                  </h2>
                  <span className="text-lg font-medium text-gray-500">
                    @{profile.username}
                  </span>
                  {profile.is_verified ? (
                    <span className="text-lg text-blue-500">
                      <i className="bi bi-patch-check-fill" />
                    </span>
                  ) : null}
                </div>
                <p className="bio-clamp max-w-md text-sm text-gray-600">
                  {profile.bio || ""}
                </p>
                <div className="flex justify-center gap-6 pt-1 md:justify-start">
                  <div className="text-center">
                    <div className="text-charcoal-brand text-lg font-black">
                      {fmtNum(profile.followers)}
                    </div>
                    <div className="text-xs uppercase tracking-wide text-gray-400">
                      Followers
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-charcoal-brand text-lg font-black">
                      {fmtNum(profile.following)}
                    </div>
                    <div className="text-xs uppercase tracking-wide text-gray-400">
                      Following
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-charcoal-brand text-lg font-black">
                      {fmtNum(profile.posts_count)}
                    </div>
                    <div className="text-xs uppercase tracking-wide text-gray-400">
                      Posts
                    </div>
                  </div>
                </div>
                <p className="pt-1 text-xs text-gray-500">
                  AI Background Verification:{" "}
                  <span className="font-bold text-green-600">Complete</span>
                </p>
              </div>

              <div className="relative flex shrink-0 items-center justify-center">
                <svg className="progress-ring h-32 w-32" viewBox="0 0 100 100">
                  <circle
                    className="stroke-current text-gray-100"
                    strokeWidth="8"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                  />
                  <circle
                    className={`progress-ring__circle stroke-current ${getRingColor(analysis.average_score)}`}
                    strokeWidth="8"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    strokeDasharray={`${ringCircumference} ${ringCircumference}`}
                    strokeDashoffset={ringOffset}
                  />
                </svg>
                <div className="absolute flex flex-col text-center">
                  <AnimatedNumber
                    value={animatedScores.average}
                    className="text-charcoal-brand text-3xl font-black"
                  />
                  <span className="text-[10px] font-bold uppercase text-gray-400">
                    Score
                  </span>
                </div>
              </div>

              <div className="pointer-events-none absolute top-4 right-4 md:right-20">
                <div
                  className={`stamp ${analysis.verdict_type} ${stampAnimating ? "stamp-animate" : ""}`}
                >
                  {stampTexts[analysis.verdict_type]}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {scoreEntries.map(([metricKey, details], index) => (
                <ScoreCard
                  key={metricKey}
                  metricKey={metricKey}
                  details={details}
                  delayClass={`delay-${(index % 3) + 1}`}
                  animatedValue={animatedScores.itemScores[metricKey] || 0}
                />
              ))}
            </div>

            <div className="fade-in-up delay-3 mt-4 grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="torn-chit rounded-t-lg border border-green-100 bg-green-50/50">
                <div className="mb-4 flex items-center gap-2 border-b border-green-200 pb-2">
                  <i className="bi bi-check-circle-fill text-xl text-green-500" />
                  <h3 className="brand-head text-xl font-bold text-green-900">
                    Green Flags{" "}
                    <span className="text-sm font-normal">(Shukar hai)</span>
                  </h3>
                </div>
                <ul className="space-y-3 font-medium text-gray-700">
                  {analysis.green_flags.map((flag) => (
                    <li key={flag}>
                      <i className="bi bi-caret-right-fill text-xs text-green-300" />{" "}
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="torn-chit rounded-t-lg border border-red-100 bg-red-50/50">
                <div className="mb-4 flex items-center gap-2 border-b border-red-200 pb-2">
                  <i className="bi bi-flag-fill text-xl text-red-500" />
                  <h3 className="brand-head text-xl font-bold text-red-900">
                    Red Flags{" "}
                    <span className="text-sm font-normal">(Tauba Tauba)</span>
                  </h3>
                </div>
                <ul className="space-y-3 font-medium text-gray-700">
                  {analysis.red_flags.map((flag) => (
                    <li key={flag}>
                      <i className="bi bi-caret-right-fill text-xs text-red-300" />{" "}
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="brand-gradient-bg fade-in-up delay-4 relative w-full overflow-hidden rounded-3xl p-8 text-center text-white shadow-lg md:p-12">
              <div className="page-pattern pointer-events-none absolute inset-0 opacity-10 mix-blend-overlay" />
              <div className="relative z-10 flex flex-col items-center">
                <i className="text-gold-soft bi bi-quote mb-4 text-4xl" />
                <h2 className="brand-head mb-6 text-3xl leading-tight font-black drop-shadow-md md:text-5xl">
                  {analysis.verdict}
                </h2>
                <div className="bg-gold-brand mb-6 h-1 w-16 rounded-full" />
                <p className="mx-auto text-lg font-medium italic opacity-90 md:w-3/4 md:text-xl">
                  {analysis.closing_line}
                </p>
              </div>
            </div>

            <div className="fade-in-up delay-4 space-y-4">
              <h3 className="brand-head text-charcoal-brand flex items-center justify-center gap-2 text-center text-2xl font-bold">
                <i className="bi bi-share-fill text-saffron-brand" /> Share Karo Yaar
              </h3>

              <div className="flex justify-center px-1 sm:px-0">
                <div ref={shareCardRef} className="share-card" id="share-card">
                  <div className="card-noise" />
                  <div className="big-dollar">$</div>

                  <div className="card-avatar">
                    {profile.profile_pic_b64 ? (
                      <img src={profile.profile_pic_b64} alt={profile.username} />
                    ) : (
                      <div className="text-2xl text-white/70">@</div>
                    )}
                  </div>

                  <div className="card-top-right">
                    <div
                      style={{
                        fontSize: "clamp(0.55rem,1.8vw,0.875rem)",
                        letterSpacing: "0.28em",
                        opacity: 0.9
                      }}
                    >
                      RISHTA
                    </div>
                    <div
                      style={{
                        fontSize: "clamp(0.9rem,2.8vw,1.375rem)",
                        letterSpacing: "0.18em"
                      }}
                    >
                      SCAN
                    </div>
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      top: "clamp(5.3rem,18vw,90px)",
                      right: "clamp(1rem,4vw,36px)",
                      textAlign: "right",
                      color: "#F4C430",
                      fontFamily: "var(--font-pixel)"
                    }}
                  >
                    <div
                      style={{
                        fontSize: "clamp(1.5rem,6vw,48px)",
                        lineHeight: 1,
                        textShadow: "3px 3px 0 rgba(0,0,0,0.3)"
                      }}
                    >
                      <AnimatedNumber value={animatedScores.average} />
                    </div>
                    <div
                      style={{
                        fontSize: "clamp(0.4rem,1.5vw,8px)",
                        color: "rgba(255,255,255,0.7)",
                        letterSpacing: "3px",
                        marginTop: "4px"
                      }}
                    >
                      OUT OF 100
                    </div>
                  </div>

                  <div className="card-name">{firstName}</div>

                  <div className="card-bars">
                    <div className="card-bar-row">
                      <div
                        className="card-bar-track"
                        style={{
                          background: "rgba(244,196,48,0.3)"
                        }}
                      >
                        <div
                          className="card-bar-fill"
                          style={{
                            width: `${animatedScores.cardBarOne}%`,
                            transition: "width 1s 0.5s ease-out"
                          }}
                        />
                      </div>
                      <div className="card-bar-label">DEVELOPER</div>
                    </div>
                    <div className="card-bar-row">
                      <div
                        className="card-bar-track"
                        style={{
                          background: "rgba(244,196,48,0.3)"
                        }}
                      >
                        <div
                          className="card-bar-fill"
                          style={{
                            width: `${animatedScores.cardBarTwo}%`,
                            transition: "width 1s 0.7s ease-out"
                          }}
                        />
                      </div>
                      <div className="card-bar-label">{scanResult.cardRank}</div>
                    </div>
                  </div>

                  <div className="card-verdict-badge">
                    {stampTexts[analysis.verdict_type]}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void downloadCard()}
                  className="brand-gradient-bg flex items-center gap-2 rounded-xl px-8 py-3 font-bold text-white shadow-lg transition hover:opacity-90"
                >
                  <i className="bi bi-download" /> Card Download Karo
                </button>
                <button
                  type="button"
                  onClick={resetApp}
                  className="text-charcoal-brand flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-8 py-3 font-bold shadow-sm transition hover:bg-gray-50"
                >
                  <i className="bi bi-arrow-counterclockwise" /> Scan Kisi Aur Ko
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="cream-soft mt-auto w-full border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        Made with chai, anxiety, and a little bit of kundli energy. &copy;
        PerfectPartner.AI
      </footer>
    </div>
  );
}
