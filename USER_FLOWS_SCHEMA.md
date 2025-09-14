# 🎭 WOLO USER TYPES & FLOW SCHEMA

## 👥 USER TYPES OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              WOLO USER ECOSYSTEM                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
            ┌───────▼──────┐   ┌───────▼──────┐   ┌──────▼──────┐
            │   BIRTHDAY   │   │   VISITORS   │   │  SPONSORS   │
            │    USERS     │   │  & GUESTS    │   │ & REFERRALS │
            │              │   │              │   │             │
            │ 🎂 Owner     │   │ 👤 Guest     │   │ 👨‍👧‍👦 Parrain │
            │ 🎉 Girl      │   │ 💰 Donator   │   │ 👶 Filleul  │
            └──────────────┘   └──────────────┘   └─────────────┘
```

---

## 🎂 BIRTHDAY PERSON (Propriétaire/Owner) - MAIN FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BIRTHDAY PERSON JOURNEY                          │
│                              🎂 Le Propriétaire                            │
└─────────────────────────────────────────────────────────────────────────────┘

                              ENTRY POINTS
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────▼─────┐ ┌──────▼──────┐ ┌─────▼─────┐
              │  DIRECT   │ │ SPONSORED   │ │  SOCIAL   │
              │  ACCESS   │ │   ACCESS    │ │   LOGIN   │
              │  /landing │ │ /accept/*   │ │  Google/  │
              └─────┬─────┘ └──────┬──────┘ │ Facebook  │
                    │              │       └─────┬─────┘
                    └──────────────┼─────────────┘
                                   │
                            ┌──────▼──────┐
                            │ ACCOUNT     │
                            │ CREATION    │
                            │ /create-    │
                            │ cagnotte    │
                            └──────┬──────┘
                                   │
                            ┌──────▼──────┐
                            │   POT       │
                            │ DASHBOARD   │
                            │ /user/      │
                            │ [userId]    │
                            │ ?owner=true │
                            └──────┬──────┘
                                   │
        ┌──────────────┬───────────┼───────────┬──────────────┐
        │              │           │           │              │
   ┌────▼────┐  ┌─────▼─────┐ ┌───▼───┐ ┌────▼─────┐  ┌─────▼─────┐
   │ MANAGE  │  │  SHARE &  │ │MONITOR│ │ RECEIVE  │  │ CELEBRATE │
   │   POT   │  │  INVITE   │ │ STATS │ │DONATIONS │  │& REDEEM   │
   └─────────┘  └───────────┘ └───────┘ └──────────┘  └───────────┘

```

### 🎂 BIRTHDAY PERSON - DETAILED SECTIONS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BIRTHDAY PERSON CAPABILITIES                        │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣ POT CREATION & MANAGEMENT
┌─────────────────────────────────────────────────────────────────────────────┐
│ Create Pot              │ Configure Settings       │ Update Content          │
│ ──────────────          │ ─────────────────────   │ ─────────────────────   │
│ • Set birthday date     │ • Privacy controls       │ • Change description    │
│ • Choose target amount  │ • Anonymous donations    │ • Upload photos         │
│ • Write description     │ • Show donor names       │ • Modify target         │
│ • Upload profile photo  │ • WhatsApp integration   │ • Update preferences    │
└─────────────────────────────────────────────────────────────────────────────┘

2️⃣ SHARING & VIRAL GROWTH
┌─────────────────────────────────────────────────────────────────────────────┐
│ Social Media Sharing    │ Direct Invitations       │ Viral Features          │
│ ────────────────────    │ ─────────────────────   │ ─────────────────────   │
│ • Facebook auto-share   │ • WhatsApp contacts      │ • Referral links        │
│ • Instagram stories     │ • SMS invitations        │ • Sponsorship system    │
│ • WhatsApp groups       │ • Email invites          │ • Point rewards         │
│ • Twitter posts         │ • Custom messages        │ • Leaderboards          │
└─────────────────────────────────────────────────────────────────────────────┘

3️⃣ MONITORING & ANALYTICS
┌─────────────────────────────────────────────────────────────────────────────┐
│ Real-time Dashboard     │ Engagement Metrics       │ Donor Management        │
│ ───────────────────     │ ─────────────────────   │ ─────────────────────   │
│ • Live amount counter   │ • View count tracking    │ • Donor list            │
│ • Progress percentage   │ • Social share stats     │ • Thank you messages    │
│ • Days remaining        │ • Conversion rates       │ • Anonymous handling    │
│ • Donor notifications   │ • Traffic sources        │ • Top donor highlights  │
└─────────────────────────────────────────────────────────────────────────────┘

4️⃣ CELEBRATION & REWARDS
┌─────────────────────────────────────────────────────────────────────────────┐
│ Birthday Celebration    │ Cinema Experience        │ Partner Rewards         │
│ ────────────────────    │ ─────────────────────   │ ─────────────────────   │
│ • Countdown completion  │ • QR code generation     │ • Package selection     │
│ • Success celebration   │ • Cinema ticket booking  │ • Spa treatments        │
│ • Thank you videos      │ • Popcorn & drinks       │ • Casino experiences    │
│ • Photo galleries       │ • Group bookings         │ • Cruise packages       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 📱 BIRTHDAY PERSON - PAGE NAVIGATION

```
BIRTHDAY PERSON PAGES & FLOWS:

/landing ────────────────┐
                         │
/create-cagnotte ────────┼─► 📝 POT CREATION
                         │
/user/[userId]?owner=true ──► 🏠 OWNER DASHBOARD
    │
    ├─► Monitor donations
    ├─► Share on social media  
    ├─► Manage invitations
    ├─► View analytics
    ├─► Configure settings
    └─► Redeem rewards

/birthday-owner ─────────────► 🎉 CELEBRATION PAGE
/owner ─────────────────────► 🎭 OWNER PORTAL
/dashboard ─────────────────► 📊 ANALYTICS DASHBOARD
```

---

## 👤 VISITOR/GUEST - DONATION FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GUEST JOURNEY                                 │
│                            👤 Le Visiteur/Invité                          │
└─────────────────────────────────────────────────────────────────────────────┘

                              ENTRY POINTS
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────▼─────┐ ┌──────▼──────┐ ┌─────▼─────┐
              │   DIRECT  │ │   SOCIAL    │ │ WHATSAPP  │
              │   LINK    │ │    SHARE    │ │ INVITATION│
              │ /user/X   │ │  Facebook   │ │   Link    │
              └─────┬─────┘ │ Instagram   │ └─────┬─────┘
                    │       │   etc.      │       │
                    │       └─────┬───────┘       │
                    └─────────────┼───────────────┘
                                  │
                           ┌──────▼──────┐
                           │   BIRTHDAY  │
                           │  POT PAGE   │
                           │ /user/      │
                           │ [userId]    │
                           └──────┬──────┘
                                  │
                          ┌───────▼──────┐
                          │   DECISION   │
                          │    POINT     │
                          │ Participate? │
                          └───┬─────┬────┘
                              │     │
                      ┌───────▼─┐ ┌─▼──────┐
                      │ DONATE  │ │ SHARE  │
                      │ & EXIT  │ │ & EXIT │
                      └─────────┘ └────────┘
```

### 👤 GUEST - DETAILED CAPABILITIES

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GUEST USER CAPABILITIES                          │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣ DISCOVERY & EXPLORATION
┌─────────────────────────────────────────────────────────────────────────────┐
│ Birthday Pot View       │ Information Access       │ Engagement Options      │
│ ─────────────────       │ ─────────────────────   │ ─────────────────────   │
│ • See countdown timer   │ • Birthday person info   │ • Like/react to pot     │
│ • View progress bar     │ • Target amount          │ • View donor list       │
│ • Check participants    │ • Current amount         │ • Read messages         │
│ • Browse photo gallery  │ • Success stories        │ • Share testimonials    │
└─────────────────────────────────────────────────────────────────────────────┘

2️⃣ DONATION PROCESS
┌─────────────────────────────────────────────────────────────────────────────┐
│ Donation Interface      │ Payment Options          │ Personalization        │
│ ──────────────────      │ ─────────────────────   │ ─────────────────────   │
│ • Quick amount buttons  │ • Wave Mobile payment    │ • Optional message      │
│ • Custom amount input   │ • Secure transactions    │ • Anonymous option      │
│ • Suggested amounts     │ • Receipt generation     │ • Public recognition    │
│ • Bulk donations        │ • Payment confirmation   │ • Emoji reactions       │
└─────────────────────────────────────────────────────────────────────────────┘

3️⃣ SOCIAL SHARING
┌─────────────────────────────────────────────────────────────────────────────┐
│ Share Pot              │ Invite Others            │ Viral Actions           │
│ ─────────────         │ ─────────────────────    │ ─────────────────────   │
│ • Share on Facebook   │ • WhatsApp forwarding     │ • Create own pot        │
│ • Instagram stories   │ • SMS invitations         │ • Start sponsorship     │
│ • Twitter posts       │ • Email sharing           │ • Join community        │
│ • Direct link copy    │ • Contact list access     │ • Follow birthday person│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 📱 GUEST - PAGE NAVIGATION

```
GUEST PAGES & FLOWS:

/landing ───────────────────► 🏠 DISCOVERY PAGE
    │
    ├─► View featured pots
    ├─► Browse success stories
    └─► Join community

/user/[userId] ─────────────► 🎁 BIRTHDAY POT VIEW
    │
    ├─► 💰 Donate (Wave payment)
    ├─► 📤 Share pot
    ├─► 💌 Leave message
    ├─► 👥 View other donors
    └─► 🎂 Create own pot

/guest ─────────────────────► 👤 GUEST PORTAL
/birthday-guest ────────────► 🎉 GUEST CELEBRATION
```

---

## 👨‍👧‍👦 PARRAIN (Sponsor) - REFERRAL FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               SPONSOR JOURNEY                              │
│                                👨‍👧‍👦 Le Parrain                                │
└─────────────────────────────────────────────────────────────────────────────┘

                              SPONSOR ENTRY
                                     │
                              ┌──────▼──────┐
                              │ SPONSOR     │
                              │ CREATION    │
                              │ /landing    │
                              │ (Sponsor    │
                              │  Dialog)    │
                              └──────┬──────┘
                                     │
                           ┌─────────▼─────────┐
                           │   INVITATION      │
                           │   PROCESS         │
                           │                   │
                           │ • Contact details │
                           │ • Relationship    │
                           │ • Custom message  │
                           │ • WhatsApp send   │
                           └─────────┬─────────┘
                                     │
                           ┌─────────▼─────────┐
                           │   FILLEUL         │
                           │   RECEIVES        │
                           │   INVITATION      │
                           │ /sponsorship/     │
                           │ accept/[token]    │
                           └─────────┬─────────┘
                                     │
                      ┌──────────────┼──────────────┐
                      │              │              │
               ┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐
               │   ACCEPT    │ │  DECLINE  │ │  IGNORE   │
               │ & CREATE    │ │& NOTIFY   │ │ (Expire)  │
               │  ACCOUNT    │ │ SPONSOR   │ └───────────┘
               └──────┬──────┘ └───────────┘
                      │
               ┌──────▼──────┐
               │   SPONSOR   │
               │   REWARDS   │
               │ • 10 points │
               │ • Bonuses   │
               │ • Tracking  │
               └─────────────┘
```

### 👨‍👧‍👦 PARRAIN - DETAILED CAPABILITIES

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SPONSOR (PARRAIN) CAPABILITIES                    │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣ SPONSORSHIP CREATION
┌─────────────────────────────────────────────────────────────────────────────┐
│ Contact Selection       │ Relationship Setting     │ Message Customization   │
│ ─────────────────       │ ────────────────────     │ ────────────────────   │
│ • WhatsApp contacts     │ • Family member          │ • Pre-written templates│
│ • Manual entry          │ • Friend                 │ • Personal messages     │
│ • Bulk invitations      │ • Close friend           │ • Emoji integration     │
│ • Contact validation    │ • Colleague              │ • Language options      │
└─────────────────────────────────────────────────────────────────────────────┘

2️⃣ INVITATION MANAGEMENT
┌─────────────────────────────────────────────────────────────────────────────┐
│ Send Invitations        │ Track Responses          │ Follow-up Actions       │
│ ────────────────────    │ ─────────────────────   │ ─────────────────────   │
│ • WhatsApp direct send  │ • Acceptance tracking    │ • Reminder messages     │
│ • Multiple recipients   │ • Response analytics     │ • Additional invites    │
│ • Scheduled sending     │ • Status dashboard       │ • Personal follow-up    │
│ • Delivery confirmation │ • Success metrics        │ • Support assistance    │
└─────────────────────────────────────────────────────────────────────────────┘

3️⃣ REWARDS & TRACKING
┌─────────────────────────────────────────────────────────────────────────────┐
│ Point System           │ Bonus Opportunities      │ Achievement Tracking    │
│ ────────────────       │ ────────────────────     │ ────────────────────   │
│ • 10 points per accept │ • Success milestones     │ • Total invitations     │
│ • Immediate rewards    │ • Performance bonuses    │ • Acceptance rate       │
│ • Tiered bonuses       │ • Loyalty rewards        │ • Point accumulation    │
│ • Point redemption     │ • Special achievements   │ • Rank progression      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 📱 PARRAIN - PAGE NAVIGATION

```
SPONSOR (PARRAIN) PAGES & FLOWS:

/landing ───────────────────► 🏠 START SPONSORSHIP
    │                           (Sponsor Dialog)
    │
    ├─► Select contacts
    ├─► Choose relationship
    ├─► Write message
    └─► Send invitations

Sponsor Dashboard ─────────► 📊 TRACK INVITATIONS
    │
    ├─► View sent invitations
    ├─► Check acceptance rates  
    ├─► Monitor point earnings
    └─► Send follow-ups
```

---

## 👶 FILLEUL (Sponsored Person) - ACCEPTANCE FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             FILLEUL JOURNEY                                │
│                            👶 Le Filleul (Sponsored)                       │
└─────────────────────────────────────────────────────────────────────────────┘

                            FILLEUL ENTRY POINT
                                     │
                              ┌──────▼──────┐
                              │ RECEIVES    │
                              │ WHATSAPP    │
                              │ INVITATION  │
                              │ From Parrain│
                              └──────┬──────┘
                                     │
                              ┌──────▼──────┐
                              │ CLICKS LINK │
                              │ /sponsorship/│
                              │ accept/      │
                              │ [token]     │
                              └──────┬──────┘
                                     │
                              ┌──────▼──────┐
                              │ INVITATION  │
                              │ DETAILS     │
                              │ • Sponsor   │
                              │ • Message   │
                              │ • Benefits  │
                              └──────┬──────┘
                                     │
                       ┌─────────────┼─────────────┐
                       │             │             │
                ┌──────▼──────┐ ┌───▼────┐ ┌─────▼─────┐
                │   ACCEPT    │ │DECLINE │ │   IGNORE  │
                │ INVITATION  │ │        │ │ (Timeout) │
                └──────┬──────┘ └────────┘ └───────────┘
                       │
                ┌──────▼──────┐
                │ ACCOUNT     │
                │ CREATION    │
                │ • Social    │
                │ • Manual    │
                └──────┬──────┘
                       │
                ┌──────▼──────┐
                │ POT CREATED │
                │ AUTOMATICALLY│
                │ /user/      │
                │ [userId]    │
                │ ?sponsored  │
                └──────┬──────┘
                       │
                ┌──────▼──────┐
                │ SPONSOR     │
                │ RECEIVES    │
                │ 10 POINTS   │
                └─────────────┘
```

### 👶 FILLEUL - DETAILED CAPABILITIES

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FILLEUL (SPONSORED) CAPABILITIES                    │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣ INVITATION REVIEW
┌─────────────────────────────────────────────────────────────────────────────┐
│ Sponsor Information     │ Invitation Details       │ Benefits Overview       │
│ ───────────────────     │ ─────────────────────   │ ─────────────────────   │
│ • Sponsor name & photo  │ • Personal message       │ • Free pot management   │
│ • Relationship type     │ • Birthday reminder      │ • Cinema rewards        │
│ • Connection history    │ • Invitation timestamp   │ • Social sharing tools  │
│ • Trust indicators      │ • Expiration date        │ • Point system access  │
└─────────────────────────────────────────────────────────────────────────────┘

2️⃣ DECISION PROCESS
┌─────────────────────────────────────────────────────────────────────────────┐
│ Accept Options         │ Account Creation         │ Quick Setup             │
│ ──────────────────     │ ────────────────────     │ ─────────────────────   │
│ • Social login (fast)  │ • Google/Facebook auth   │ • Pre-filled data       │
│ • Manual registration  │ • Email verification     │ • Birthday auto-detect  │
│ • Terms acceptance     │ • Profile completion     │ • Target suggestions    │
│ • Privacy settings     │ • Password setup         │ • Instant activation    │
└─────────────────────────────────────────────────────────────────────────────┘

3️⃣ POST-ACCEPTANCE EXPERIENCE
┌─────────────────────────────────────────────────────────────────────────────┐
│ Automatic Pot Creation  │ Sponsor Recognition      │ Enhanced Features       │
│ ──────────────────────  │ ────────────────────     │ ─────────────────────   │
│ • Birthday date setup   │ • Thank sponsor message  │ • Premium templates     │
│ • Target amount guide   │ • Points notification    │ • Priority support      │
│ • Photo upload assist   │ • Success celebration    │ • Advanced analytics    │
│ • Sharing tools ready   │ • Mutual connection      │ • Referral bonuses      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 📱 FILLEUL - PAGE NAVIGATION

```
FILLEUL (SPONSORED) PAGES & FLOWS:

WhatsApp Link ──────────────► 🔗 INVITATION LANDING
    │                          /sponsorship/accept/[token]
    │
    ├─► Review invitation
    ├─► See sponsor details
    ├─► Understand benefits
    └─► Make decision

Accept ─────────────────────► 📝 ACCOUNT CREATION
    │                          • Social login options
    │                          • Manual registration
    │                          • Profile setup
    │
    └─► /user/[userId] ──────► 🎂 BIRTHDAY POT DASHBOARD
        ?owner=true              (Same as Birthday Person)
        &sponsored=true
```

---

## 🔄 COMPLETE USER INTERACTION FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMPLETE WOLO ECOSYSTEM FLOW                        │
└─────────────────────────────────────────────────────────────────────────────┘

                              🏠 LANDING PAGE
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
              ┌─────▼─────┐    ┌─────▼─────┐    ┌────▼─────┐
              │🎂 CREATE  │    │👤 DONATE  │    │👨‍👧‍👦 SPONSOR│
              │   POT     │    │   TO POT  │    │ SOMEONE  │
              └─────┬─────┘    └─────┬─────┘    └────┬─────┘
                    │                │               │
              ┌─────▼─────┐    ┌─────▼─────┐    ┌────▼─────┐
              │   OWNER   │    │   GUEST   │    │ PARRAIN  │
              │DASHBOARD  │    │ DONATION  │    │INVITATION│
              └─────┬─────┘    └─────┬─────┘    └────┬─────┘
                    │                │               │
                    │                │               ▼
                    │                │         ┌────────────┐
                    │                │         │📱 WhatsApp │
                    │                │         │ INVITATION │
                    │                │         └────┬───────┘
                    │                │              │
                    │                │         ┌────▼─────┐
                    │                │         │👶 FILLEUL│
                    │                │         │ ACCEPTS  │
                    │                │         └────┬─────┘
                    │                │              │
                    └────────────────┼──────────────┘
                                     │
                              ┌──────▼──────┐
                              │🎉 BIRTHDAY  │
                              │ CELEBRATION │
                              │ & REWARDS   │
                              └─────────────┘
```

---

## 📊 USER CAPABILITIES MATRIX

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER CAPABILITIES MATRIX                         │
└─────────────────────────────────────────────────────────────────────────────┘

FEATURE                    │🎂Owner│👤Guest│👨‍👧‍👦Parrain│👶Filleul│
──────────────────────────┼───────┼───────┼────────┼────────┤
Create Pot                │   ✅  │   ❌  │   ❌   │   ✅   │
Donate to Pot             │   ❌  │   ✅  │   ✅   │   ✅   │
Share Pot                 │   ✅  │   ✅  │   ✅   │   ✅   │
Manage Settings           │   ✅  │   ❌  │   ❌   │   ✅   │
View Analytics            │   ✅  │   ❌  │   ✅   │   ✅   │
Send Invitations          │   ✅  │   ❌  │   ✅   │   ✅   │
Receive Notifications     │   ✅  │   ❌  │   ✅   │   ✅   │
Earn Points               │   ✅  │   ❌  │   ✅   │   ✅   │
Access WhatsApp Contacts  │   ✅  │   ❌  │   ✅   │   ✅   │
Cinema Rewards            │   ✅  │   ❌  │   ❌   │   ✅   │
Sponsor Others            │   ✅  │   ❌  │   ✅   │   ✅   │
Admin Dashboard Access    │   ❌  │   ❌  │   ❌   │   ❌   │
```

---

## 📱 PAGE STRUCTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PAGE STRUCTURE                                │
└─────────────────────────────────────────────────────────────────────────────┘

📁 MAIN PAGES
├── 🏠 /landing ─────────────────────► Entry point for all users
├── 🎂 /create-cagnotte ─────────────► Pot creation form
├── 👤 /user/[userId] ───────────────► Birthday pot view/dashboard
├── 🎉 /owner ───────────────────────► Owner-specific features
├── 👥 /guest ───────────────────────► Guest-specific features
├── 🔗 /sponsorship/accept/[token] ──► Sponsored user onboarding
└── 🎭 /birthday-* ──────────────────► Role-specific celebration pages

📁 SPECIALIZED FLOWS
├── 📊 /dashboard/* ─────────────────► Analytics and management
├── 🔐 /auth/* ──────────────────────► Authentication flows
├── 👶 /minor-transfer/* ────────────► Minor account management
└── 🤖 /api/* ───────────────────────► Backend API endpoints

📁 ADMIN SECTION
├── ⚙️ /admin ───────────────────────► Regular admin panel
├── 👑 /super-admin ─────────────────► Super admin panel
└── 🔧 /next_api/* ──────────────────► Admin API endpoints
```

This comprehensive schema shows exactly how each user type flows through your WoloApp system, their capabilities, and page interactions. Each user journey is clearly mapped with entry points, decision points, and outcomes.

Would you like me to focus on any specific user type or modify any particular flow?