#!/usr/bin/env node
/**
 * Pulls live contribution totals from GitHub GraphQL and rewrites
 * assets/banner.svg, assets/contributions.svg, and README.md placeholders.
 *
 * Env: GITHUB_TOKEN (Actions default token works for the repo owner account)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const ACCOUNTS = [
  { login: "TejasMelkote", role: "work" },
  { login: "Tejasdagr8", role: "personal" },
];

const QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar { totalContributions }
      }
    }
  }
`;

function format(n) {
  return Number(n).toLocaleString("en-US");
}

async function fetchTotal(login, token) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "tejas-readme-contrib-sync",
    },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  if (!res.ok) throw new Error(`${login}: HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(`${login}: ${json.errors[0].message}`);
  return json.data.user.contributionsCollection.contributionCalendar.totalContributions;
}

function bannerSvg({ work, personal, combined }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="420" viewBox="0 0 1200 420" role="img" aria-label="Tejas Melkote">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#07080d"/>
      <stop offset="45%" stop-color="#0c1020"/>
      <stop offset="100%" stop-color="#101528"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#5eead4"/>
      <stop offset="55%" stop-color="#67e8f9"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
    <linearGradient id="minds" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#5eead4"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
    <radialGradient id="glow" cx="78%" cy="35%" r="40%">
      <stop offset="0%" stop-color="#5eead4" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#5eead4" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="420" fill="url(#bg)"/>
  <rect width="1200" height="420" fill="url(#glow)"/>
  <g opacity="0.22" fill="none" stroke="#94a3b8" stroke-width="0.8">
    <path d="M-20,80 C120,20 220,160 360,90 S560,40 700,120 S920,200 1220,80"/>
    <path d="M-20,160 C140,100 260,240 420,150 S640,80 780,180 S980,260 1220,140"/>
    <path d="M-20,250 C160,190 280,320 440,240 S680,170 820,270 S1020,340 1220,230"/>
    <path d="M-20,330 C180,280 300,380 460,310 S700,250 860,350 S1060,390 1220,310"/>
  </g>
  <text x="64" y="58" fill="#5eead4" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="14" letter-spacing="4">GRADIENT DESCENT — SHIPPING SINCE 2022</text>
  <text x="64" y="150" fill="#ffffff" font-family="Arial Black, Helvetica Neue, Arial, sans-serif" font-size="86" font-weight="900" letter-spacing="4">TEJAS</text>
  <text x="64" y="230" fill="none" stroke="#e2e8f0" stroke-width="2.2" font-family="Arial Black, Helvetica Neue, Arial, sans-serif" font-size="86" font-weight="900" letter-spacing="4" opacity="0.85">MELKOTE</text>
  <text x="64" y="300" fill="url(#minds)" font-family="Arial Black, Helvetica Neue, Arial, sans-serif" font-size="54" font-weight="900" letter-spacing="3">BUILDS MINDS</text>
  <text x="64" y="345" fill="#94a3b8" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="18">AI/ML Engineer · Full-Stack · 2026 new grad</text>
  <rect x="64" y="365" rx="18" ry="18" width="420" height="36" fill="#0b1220" stroke="#334155" stroke-width="1"/>
  <circle cx="86" cy="383" r="5" fill="#5eead4"/>
  <text x="102" y="388" fill="#cbd5e1" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="14">Open to opportunities · Bengaluru · AI/ML &amp; SDE</text>
  <rect x="760" y="90" rx="28" ry="28" width="380" height="240" fill="#0b1220" stroke="#334155" stroke-width="1"/>
  <text x="790" y="135" fill="#5eead4" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" letter-spacing="3">GITHUB · LAST 12 MONTHS · LIVE</text>
  <text x="790" y="210" fill="url(#accent)" font-family="Arial Black, Helvetica Neue, Arial, sans-serif" font-size="72" font-weight="900">${format(combined)}</text>
  <text x="790" y="250" fill="#e2e8f0" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="18" font-weight="600">verified contributions</text>
  <text x="790" y="285" fill="#64748b" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="13">${format(work)} @TejasMelkote + ${format(personal)} @Tejasdagr8</text>
</svg>
`;
}

function contributionsSvg({ work, personal, combined }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="200" viewBox="0 0 1200 200" role="img" aria-label="Verified GitHub contributions">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#07080d"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#5eead4"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="200" rx="24" fill="url(#bg2)"/>
  <rect x="1" y="1" width="1198" height="198" rx="23" fill="none" stroke="#1f2937" stroke-width="2"/>
  <text x="48" y="48" fill="#5eead4" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="13" letter-spacing="3">AUTO-UPDATED VIA GITHUB ACTIONS · LAST 12 MONTHS</text>
  <text x="48" y="115" fill="url(#g)" font-family="Arial Black, Helvetica Neue, Arial, sans-serif" font-size="56" font-weight="900">${format(combined)}</text>
  <text x="300" y="95" fill="#ffffff" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="24" font-weight="700">total contributions</text>
  <text x="300" y="128" fill="#94a3b8" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="15">@TejasMelkote ${format(work)} · @Tejasdagr8 ${format(personal)} · GraphQL (private included when token allows)</text>
  <rect x="48" y="150" width="220" height="32" rx="16" fill="#0f172a" stroke="#334155"/>
  <text x="64" y="171" fill="#e2e8f0" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="13">Source: GitHub GraphQL</text>
  <rect x="284" y="150" width="300" height="32" rx="16" fill="#0f172a" stroke="#334155"/>
  <text x="300" y="171" fill="#e2e8f0" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="13">Synced ${new Date().toISOString().slice(0, 10)}</text>
</svg>
`;
}

function patchReadme(readme, { work, personal, combined }) {
  let next = readme;
  // Combined total in table / alt text
  next = next.replace(
    /\*\*2?[\d,]+\*\* contributions — `[\d,]+` on \[@TejasMelkote\]/,
    `**${format(combined)}** contributions — \`${format(work)}\` on [@TejasMelkote]`
  );
  next = next.replace(
    /`[\d,]+` on \[@Tejasdagr8\]/,
    `\`${format(personal)}\` on [@Tejasdagr8]`
  );
  next = next.replace(
    /\| \[@TejasMelkote\]\(https:\/\/github\.com\/TejasMelkote\) \| work \| [\d,]+ \|/,
    `| [@TejasMelkote](https://github.com/TejasMelkote) | work | ${format(work)} |`
  );
  next = next.replace(
    /\| \[@Tejasdagr8\]\(https:\/\/github\.com\/Tejasdagr8\) \| personal \| [\d,]+ \|/,
    `| [@Tejasdagr8](https://github.com/Tejasdagr8) | personal | ${format(personal)} |`
  );
  next = next.replace(
    /\| \*\*Combined\*\* \| \| \*\*[\d,]+\*\* \|/,
    `| **Combined** | | **${format(combined)}** |`
  );
  next = next.replace(
    /alt="[\d,]+ verified GitHub contributions"/,
    `alt="${format(combined)} verified GitHub contributions"`
  );
  return next;
}

async function main() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    console.error("GITHUB_TOKEN is required");
    process.exit(1);
  }

  const totals = {};
  for (const { login } of ACCOUNTS) {
    totals[login] = await fetchTotal(login, token);
    console.log(`${login}: ${totals[login]}`);
  }

  const work = totals.TejasMelkote;
  const personal = totals.Tejasdagr8;
  const combined = work + personal;
  const payload = { work, personal, combined };

  writeFileSync(join(ROOT, "assets", "banner.svg"), bannerSvg(payload), "utf8");
  writeFileSync(join(ROOT, "assets", "contributions.svg"), contributionsSvg(payload), "utf8");

  const readmePath = join(ROOT, "README.md");
  const readme = readFileSync(readmePath, "utf8");
  writeFileSync(readmePath, patchReadme(readme, payload), "utf8");

  console.log(`Updated SVGs + README → combined ${combined}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
