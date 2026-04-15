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
  const rand = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const followerRatio =
    profile.followers > 0 ? profile.following / profile.followers : 5;
  const hasVerified = profile.is_verified;
  const hasBio = (profile.bio || "").length > 20;
  const highFollowers = profile.followers > 10000;

  const family_values = rand(30, 90);
  const financial_stability = hasVerified
    ? rand(60, 95)
    : highFollowers
      ? rand(55, 85)
      : rand(20, 75);
  const personality = hasBio ? rand(50, 90) : rand(20, 60);
  const cultural_goodness = rand(25, 85);
  const trustworthiness = followerRatio > 3 ? rand(10, 45) : rand(50, 90);
  const lifestyle = rand(30, 80);
  const fake_meter =
    highFollowers && followerRatio > 5 ? rand(60, 95) : rand(10, 60);

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
      "Sanskaar level: Only touches parents' feet when asking for money.",
      "Proper susheel vibe, mummy approved ngl.",
      "Family functions mein sabse aage, khaan-paan mein sabse peeche."
    ],
    financial_stability: [
      "Starbucks daily peeta hai but splitwise me ₹10 add karta hai.",
      "Crypto bro alert, run before he explains blockchain.",
      "Papa ka paisa but aesthetic tera bhai ka hai.",
      "FDs aur SIPs sort hain boss, subtle flex."
    ],
    personality: [
      "Main character energy but zero character arc.",
      "Bio me 'wanderlust' likha hai but Goa cancel hota rehta hai.",
      "Fluent in sarcasm and ghosting.",
      "10/10 vibe, would share my golgappa with."
    ],
    cultural_goodness: [
      "Navratri me only garba, no falahaar.",
      "Kurta pehnne ka shauk hai bas Diwali photo ke liye.",
      "Desi at heart, videshi on the grammar."
    ],
    trustworthiness: [
      "Phone face-down rakhta hai table pe 🚩",
      "Last seen frozen in 2019.",
      "100% transparent, open book literal.",
      "Caught in 4K multiple times in tagged photos."
    ],
    lifestyle: [
      "Gym selfie to workout ratio is heavily skewed.",
      "Sleeps at 4 AM, asks 'utha nai abhi tak?' at 12 PM.",
      "Actually touches grass, surprisingly healthy."
    ],
    fake_meter: [
      "Facetune subscription expire ho gaya shayad.",
      "Bro's entire personality is curated via Pinterest.",
      "Genuinely raw, no cap.",
      "Filters hata do toh pados ka Sonu lagta hai."
    ]
  };

  let vType = "maybe";
  let vText = "";

  if (avg > 75) {
    vType = "marry";
    vText = pick([
      "Lock kar do bhai yeh rishta, kundli matching ki zaroorat nahi.",
      "Total green flag, mummy ko photo bhej de.",
      "Slay kar diya boss, shaadi ka card chhapwa lo."
    ]);
  } else if (avg < 35 || trustworthiness < 20 || fake_meter > 85) {
    vType = "run";
    vText = pick([
      "Bhago bhai bhago, red flag ki dukaan hai.",
      "Block. Report. Delete. In that order.",
      "AI ne hath khade kar diye, yeh out of syllabus hai."
    ]);
  } else if (avg < 50) {
    vType = "dump";
    vText = pick([
      "Time waste mat kar, next swipe kar.",
      "Lowkey delulu lag raha/rahi hai.",
      "It's giving 'I ghost people for fun'."
    ]);
  } else {
    vType = "maybe";
    vText = pick([
      "Soch le thoda, risky investment hai.",
      "Not terrible, but not 'shaadi material' yet either.",
      "Potential hai, thoda aur scan karo real life mein."
    ]);
  }

  return {
    scores: {
      family_values: { score: family_values, roast: pick(roasts.family_values) },
      financial_stability: {
        score: financial_stability,
        roast: pick(roasts.financial_stability)
      },
      personality: { score: personality, roast: pick(roasts.personality) },
      cultural_goodness: {
        score: cultural_goodness,
        roast: pick(roasts.cultural_goodness)
      },
      trustworthiness: {
        score: trustworthiness,
        roast: pick(roasts.trustworthiness)
      },
      lifestyle: { score: lifestyle, roast: pick(roasts.lifestyle) },
      fake_meter: { score: fake_meter, roast: pick(roasts.fake_meter) }
    },
    average_score: avg,
    green_flags: pick([
      ["Reply speed fast", "Mummy se darta hai", "Good meme taste"],
      ["Financial independent", "Doesn't use emojis awkwardly", "Pets animals"],
      ["Always carries charger", "Likes adrak wali chai", "Actually reads books"]
    ]),
    red_flags: pick([
      ["Uses words like 'sus' unironically", "Has an ex trauma", "Pineapple on pizza advocate"],
      ["Never splits the bill", "Follows 2000 randoms", "Replies 'k'"],
      ["Takes astrology too seriously", "Listens to sad lofi 24/7", "Gym mirror selfies everyday"]
    ]),
    verdict: vText,
    verdict_type: vType,
    closing_line: pick([
      "ya phir... teri life hai.",
      "shayad tu khud shaadi ke liye ready nahi hai.",
      "bhai/behen, teri marzi — hum toh bas AI hain.",
      "aage badh, better log milenge. probably."
    ])
  };
}
