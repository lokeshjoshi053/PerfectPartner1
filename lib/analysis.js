export const loadingSteps = [
  "🔍 Instagram profile dhoondh raha hoon...",
  "📸 Posts scan ho rahe hain...",
  "💸 Financial aura detect ho rahi hai...",
  "🎭 Fake-o-meter calibrate ho raha hai...",
  "👨‍👩‍👧 Indian Parent Approval loading...",
  "🧿 Final report ready kar raha hoon..."
];

export const stampTexts = {
  marry: "💒 SHAADI KARO",
  dump: "🚩 BHAGO BHAI",
  run: "💨 RUN KAR",
  maybe: "🤔 SOCH LE"
};

export const scoreLabels = {
  family_values: { title: "Sanskaar Score 🙏", icon: "bi-house-heart" },
  financial_stability: { title: "Paisa Aura 💸", icon: "bi-cash-stack" },
  personality: { title: "Vibe Check ✨", icon: "bi-stars" },
  cultural_goodness: { title: "Desi Meter 🪕", icon: "bi-music-note-beamed" },
  trustworthiness: { title: "Bharosa Rating 🤝", icon: "bi-shield-check" },
  lifestyle: { title: "Lifestyle Flex 🍸", icon: "bi-sunglasses" },
  fake_meter: {
    title: "Nakli-pana 🎭",
    icon: "bi-incognito",
    reverseColor: true
  }
};

export function fmtNum(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n;
}

export function normalizeUsername(username) {
  return String(username || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function hashString(input) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0);
}

function pickByScore(options, score) {
  return options[Math.abs(score) % options.length];
}

export function getScoreColor(score, reverseColor = false) {
  if (reverseColor) {
    if (score > 70) return "bg-red-500";
    if (score < 40) return "bg-green-500";
    return "bg-yellow-400";
  }

  if (score > 70) return "bg-green-500";
  if (score < 40) return "bg-red-500";
  return "bg-yellow-400";
}

export function getRingColor(score) {
  if (score > 70) return "text-green-500";
  if (score < 40) return "text-red-500";
  return "text-yellow-400";
}

export function generateAnalysis(profile) {
  const normalizedUsername = normalizeUsername(profile.username);
  const bio = String(profile.bio || "");
  const posts = Number(profile.posts_count || 0);
  const followers = Number(profile.followers || 0);
  const following = Number(profile.following || 0);
  const hasVerified = Boolean(profile.is_verified);
  const followerRatio = followers > 0 ? following / followers : 5;
  const hash = hashString(
    [
      normalizedUsername,
      followers,
      following,
      posts,
      bio.length,
      hasVerified ? "1" : "0"
    ].join("|")
  );

  const family_values = clamp(
    42 + Math.min(posts, 120) * 0.15 + (bio.length > 20 ? 10 : 0) + (hash % 9),
    30,
    92
  );
  const financial_stability = clamp(
    30 +
      Math.min(followers / 350, 40) +
      (hasVerified ? 18 : 0) +
      ((hash >> 3) % 10),
    20,
    96
  );
  const personality = clamp(
    28 + Math.min(bio.length, 120) * 0.35 + Math.min(posts, 60) * 0.25 + ((hash >> 5) % 8),
    20,
    94
  );
  const cultural_goodness = clamp(
    35 + Math.min(posts, 90) * 0.22 + (bio.length > 0 ? 8 : 0) + ((hash >> 7) % 12),
    25,
    88
  );
  const trustworthiness = clamp(
    82 - Math.max(followerRatio - 1.2, 0) * 14 - (followers > 100000 && following > 5000 ? 8 : 0) + ((hash >> 11) % 6),
    12,
    92
  );
  const lifestyle = clamp(
    32 + Math.min(posts, 80) * 0.28 + Math.min(followers / 1000, 20) + ((hash >> 13) % 9),
    30,
    84
  );
  const fake_meter = clamp(
    18 +
      Math.max(followerRatio - 2.5, 0) * 10 +
      (followers > 100000 ? 12 : 0) +
      (bio.length === 0 ? 12 : 0) +
      ((hash >> 17) % 10),
    10,
    96
  );

  const avg = Math.floor(
    [
      family_values,
      financial_stability,
      personality,
      cultural_goodness,
      trustworthiness,
      lifestyle,
      fake_meter
    ].reduce((a, b) => a + b, 0) / 7
  );

  const roasts = {
    family_values: [
      "Rishta pakka karne se pehle kundli set check kar lena.",
      "Proper susheel vibe, mummy approved ngl.",
      "Family functions mein sabse aage, khaan-paan mein sabse peeche.",
      "Sanskaar level kaafi sorted lag raha hai."
    ],
    financial_stability: [
      "Paisa aura theek-thaak strong lag rahi hai.",
      "FDs aur SIPs sort hain boss, subtle flex.",
      "Budgeting vibes aa rahi hain, reckless nahi lagta.",
      "Financial scene thoda grounded dikhta hai."
    ],
    personality: [
      "Main character energy, but at least profile mein effort hai.",
      "Bio aur posts dono se vibe samajh aa rahi hai.",
      "10/10 vibe, would share my golgappa with.",
      "Personality ka signal kaafi visible hai."
    ],
    cultural_goodness: [
      "Desi at heart, videshi on the grammar.",
      "Kurta factor aur culture meter dono balanced lag rahe hain.",
      "Navratri me only garba, no falahaar.",
      "Cultural signal decent hai, zero disconnect nahi."
    ],
    trustworthiness: [
      "Open book literal type energy aa rahi hai.",
      "Follower-following ratio suspicious nahi lag raha.",
      "Bharosa rating decent side pe hai.",
      "Phone face-down red flag vibe yahan utni strong nahi."
    ],
    lifestyle: [
      "Actually touches grass, surprisingly healthy.",
      "Lifestyle flex controlled lag raha hai, overdone nahi.",
      "Gym selfie to workout ratio manageable lagta hai.",
      "Daily life ka vibe curated but not chaotic."
    ],
    fake_meter: [
      "Nakli-pana low side pe hai, good sign.",
      "Pinterest personality overload yahan zyada nahi dikha.",
      "Filters hata do toh bhi same insaan lagna chahiye.",
      "Curated hai, but fully artificial nahi lagta."
    ]
  };

  let vType = "maybe";
  let vText = "";

  if (avg > 75) {
    vType = "marry";
    vText = pickByScore(
      [
        "Lock kar do bhai yeh rishta, kundli matching ki zaroorat nahi.",
        "Total green flag, mummy ko photo bhej de.",
        "Slay kar diya boss, shaadi ka card chhapwa lo."
      ],
      avg + hash
    );
  } else if (avg < 35 || trustworthiness < 20 || fake_meter > 85) {
    vType = "run";
    vText = pickByScore(
      [
        "Bhago bhai bhago, red flag ki dukaan hai.",
        "Block. Report. Delete. In that order.",
        "AI ne hath khade kar diye, yeh out of syllabus hai."
      ],
      avg + hash
    );
  } else if (avg < 50) {
    vType = "dump";
    vText = pickByScore(
      [
        "Time waste mat kar, next swipe kar.",
        "Lowkey delulu lag raha/rahi hai.",
        "It's giving 'I ghost people for fun'."
      ],
      avg + hash
    );
  } else {
    vType = "maybe";
    vText = pickByScore(
      [
        "Soch le thoda, risky investment hai.",
        "Not terrible, but not 'shaadi material' yet either.",
        "Potential hai, thoda aur scan karo real life mein."
      ],
      avg + hash
    );
  }

  return {
    scores: {
      family_values: {
        score: family_values,
        roast: pickByScore(roasts.family_values, family_values + hash)
      },
      financial_stability: {
        score: financial_stability,
        roast: pickByScore(roasts.financial_stability, financial_stability + hash)
      },
      personality: {
        score: personality,
        roast: pickByScore(roasts.personality, personality + hash)
      },
      cultural_goodness: {
        score: cultural_goodness,
        roast: pickByScore(roasts.cultural_goodness, cultural_goodness + hash)
      },
      trustworthiness: {
        score: trustworthiness,
        roast: pickByScore(roasts.trustworthiness, trustworthiness + hash)
      },
      lifestyle: {
        score: lifestyle,
        roast: pickByScore(roasts.lifestyle, lifestyle + hash)
      },
      fake_meter: {
        score: fake_meter,
        roast: pickByScore(roasts.fake_meter, fake_meter + hash)
      }
    },
    average_score: avg,
    green_flags: pickByScore(
      [
        ["Reply speed fast", "Mummy se darta hai", "Good meme taste"],
        ["Financial independent", "Doesn't use emojis awkwardly", "Pets animals"],
        ["Always carries charger", "Likes adrak wali chai", "Actually reads books"]
      ],
      avg + hash
    ),
    red_flags: pickByScore(
      [
        ["Uses words like 'sus' unironically", "Has an ex trauma", "Pineapple on pizza advocate"],
        ["Never splits the bill", "Follows 2000 randoms", "Replies 'k'"],
        ["Takes astrology too seriously", "Listens to sad lofi 24/7", "Gym mirror selfies everyday"]
      ],
      fake_meter + hash
    ),
    verdict: vText,
    verdict_type: vType,
    closing_line: pickByScore(
      [
        "ya phir... teri life hai.",
        "shayad tu khud shaadi ke liye ready nahi hai.",
        "bhai/behen, teri marzi — hum toh bas AI hain.",
        "aage badh, better log milenge. probably."
      ],
      trustworthiness + hash
    )
  };
}
