# WOLO SENEGAL — Product Requirements Document (PRD)

**Document Owner:** Joe Deep (Founder)
**Written by:** AI Assistant (Product & Tech)
**Version:** 1.2 (EN) — *integrates current project status, admin schema, user flows, and optimization recommendations*
**Date:** January 14, 2025

---

## 1) Executive Summary

WOLO is a local birthday celebration platform for Senegal. Users (the **birthday persons**) open a **pot** that their friends and family fund to unlock **Packs** (e.g., *Cinema Pack*). The main growth lever is **sponsorship**: any user can become a **sponsor**, invite their contacts (WhatsApp), and earn **points**. When a sponsored person accepts, confirms their identity and **date of birth**, a pot page is **pre-created** and will open **30 days** before their birthday. For **<18 years**, the same UI is used, but public visibility is blocked until **legal guardian consent** and **identity verification of both Sponsor & Sponsored**.

Tech-wise, we adopt a **hybrid architecture**: **Web (Next.js)** for admin, SEO and desktop donations, and **mobile Flutter** for core journeys (invites, Wave donations, QR redemption). **API-first** backend (PostgreSQL + PostgREST) with **microservices + MCP** (Model Context Protocol) to enable automation/agents without touching critical paths.

---

## 2) Current Project Status

> Status legend: ✅ Completed | 🚧 In progress | ❌ Not started | 🟡 Needs review

### Status Snapshot (At-a-glance)
- Frontend Implementation: ❌ Not started
- Backend APIs: ❌ Not started
- Mobile Optimization: 🚧 In planning
- Payment Integration (Wave): ❌ Not integrated
- WhatsApp Integration: ❌ Not started

### ✅ **COMPLETED & FUNCTIONAL**

#### **Frontend Infrastructure**
- ✅ Next.js 15.2.4 with TypeScript setup
- ✅ TailwindCSS + Radix UI component library
- ✅ React Hook Form with Zod validation
- ✅ Authentication structure with NextAuth
- ✅ Responsive mobile-first design foundation
- ✅ Auto-sync system with GitHub integration
- ✅ Vercel deployment pipeline configured

#### **New Engagement Features 🎆**
- ✅ **Daily Invitation Limits System** designed and documented
- ✅ **Batch vs Individual Selection** workflow specified
- ✅ **Daily Comeback Incentives** gamification strategy
- ✅ **Anti-Spam Protection** via 50/day invitation limit
- ✅ **Engagement Analytics** tracking for sponsor retention

#### **Core Features Implemented**
- ✅ Landing page with countdown timer functionality
- ✅ Email collection popup with toast notifications
- ✅ Basic responsive layout and navigation
- ✅ User authentication foundations
- ✅ Toast notification system (React Hot Toast)
- ✅ Form handling infrastructure

#### **Backend Foundations**
- ✅ API structure in `/api` directory
- ✅ Microservices architecture planned:
  - Identity service foundation
  - User management structure
  - Pot management skeleton  
  - Payment processing (Wave) framework
  - Analytics service foundation
  - Notification service structure
  - API Gateway configured

#### **Documentation & Planning**
- ✅ Complete Admin Schema (English + French)
- ✅ Comprehensive User Flows Schema (English + French)
- ✅ Timing analysis and optimization roadmap
- ✅ Viral growth strategies documented
- ✅ Performance targets and KPIs defined

### 🚧 **IN PROGRESS / PARTIALLY IMPLEMENTED**

#### **Authentication & User Management**
- 🔄 NextAuth configuration needs completion
- 🔄 Role-based access control (RBAC) implementation
- 🔄 User profile management system
- 🔄 Social login integration (Google/Facebook)

#### **Database & Backend**
- 🔄 PostgreSQL schema implementation
- 🔄 PostgREST configuration
- 🔄 Microservices API endpoints
- 🔄 Event bus system for inter-service communication

### ❌ **NOT YET IMPLEMENTED**

#### **Core Functionality**
- ❌ Pot creation and management system
- ❌ Wave Mobile Money integration
- ❌ WhatsApp integration for invitations
- ❌ Sponsorship/referral system
- ❌ Points and rewards system
- ❌ QR code generation and redemption
- ❌ Partner management system

#### **Advanced Features**
- ❌ Admin dashboards (regular, super admin, partners)
- ❌ Analytics and reporting system
- ❌ Notification system (email, SMS, WhatsApp)
- ❌ Mobile Flutter application
- ❌ Age verification for <18 users
- ❌ Content moderation system

#### **Integrations**
- ❌ Wave payment gateway
- ❌ WhatsApp Business API
- ❌ Cinema partner integrations
- ❌ SMS provider setup
- ❌ Email service provider

---

## 3) Objectives & KPIs

### 🟡 Pending Review (Needs Approval)
- UI StatusBadge component (Option B) — reusable React/Next component per STATUS_STYLE_GUIDE.md
- Red Cross partner integration (Option C) — scope: partner onboarding, pack alignment, compliance
- A/B testing framework scope — experiments, metrics, statistical thresholds
- WhatsApp Bot integration — scope, provider constraints, compliance review

**Business Objectives**
* Deliver a fast, smooth (Wave), and reliable MVP for Senegal
* Sponsorship becomes the #1 acquisition channel (≥ 60% new users via invitations at M+3)
* First operational partnership (cinema) with QR validation and payment tracking

**Quarterly KPIs**
* **Activation**: ≥ 55% of invited sponsored users accept + confirm DOB
* **Virality (K-factor)**: ≥ 1.2 accepted sponsored users per active sponsor
* **Daily Engagement**: ≥ 65% of sponsors return within 24 hours to use remaining invites
* **Sponsor Retention**: ≥ 40% of sponsors remain active for 7+ consecutive days
* **Conversion**: ≥ 35% of opened pots receive ≥ 1 donation before date
* **Redemption**: ≥ 85% of funded Packs consumed ≤ 45 days after birthday
* **Performance**: API P95 < 300ms | TTI P95 < 2.5s on 3G
* **Anti-Spam Effectiveness**: < 5% of users report invitation fatigue or spam complaints

---

## 4) User Roles & Personas

* **Birthday Person/Pot Owner**: creates/owns pot, invites, tracks, spends
* **Donor**: contributes via Wave; can remain anonymous; optional message
* **Sponsor**: invites contacts; earns points based on sponsored user progress
* **WOLO Admin**: full operations (moderation, refunds, content, splits, flags)
* **Partner Admin (Cinema)**: **read-only** analytics + QR validation flow
* **Sponsor Admin**: **read-only** campaign and performance metrics

---

## 5) Implementation Roadmap

### **Phase 0: Foundation Hardening (Current Priority)**
**Timeline: 2-3 weeks**
- [ ] Complete database schema implementation
- [ ] Finish authentication system with RBAC
- [ ] Implement core API endpoints
- [ ] Set up proper error handling and logging
- [ ] Establish testing framework

### **Phase 1: Core MVP Features**
**Timeline: 4-6 weeks**
- [ ] Pot creation and management system
- [ ] Wave payment integration (sandbox → production)
- [ ] **Daily Invitation Limits System** with batch/individual selection
- [ ] **Engagement Gamification** (streaks, daily rewards)
- [ ] Basic sponsorship/referral system
- [ ] WhatsApp invitation links
- [ ] Points system foundation
- [ ] QR code generation system

### **Phase 1.1: User Experience Enhancement**
**Timeline: 2-3 weeks**
- [ ] Implement timing optimizations from user flows analysis
- [ ] Mobile-first UX improvements
- [ ] Social login integration
- [ ] Smart defaults and pre-filling features
- [ ] One-click donation buttons

### **Phase 1.2: Admin & Analytics**
**Timeline: 3-4 weeks**
- [ ] Admin dashboard implementation
- [ ] Partner dashboard (read-only)
- [ ] Basic analytics and reporting
- [ ] Content moderation tools
- [ ] User management interface

### **Phase 2: Mobile Flutter Application**
**Timeline: 6-8 weeks**
- [ ] Flutter app foundation
- [ ] Core user journeys implementation
- [ ] Wave payment integration
- [ ] Camera/QR scanning functionality
- [ ] Push notifications
- [ ] Store submission preparation

### **Phase 3: Advanced Features**
**Timeline: 4-6 weeks**
- [ ] Age verification system for <18 users
- [ ] Advanced analytics and AI-powered optimizations
- [ ] Gamification features
- [ ] Partner onboarding system
- [ ] Advanced fraud detection

---

## 6) Technical Architecture

### **Current Stack**
- **Frontend**: Next.js 15.2.4, TypeScript, TailwindCSS, Radix UI
- **Authentication**: NextAuth (in setup)
- **Database**: PostgreSQL (planned)
- **API**: PostgREST + custom endpoints
- **Deployment**: Vercel with auto-deployment
- **Mobile**: Flutter (planned for Phase 2)

### **Microservices Architecture**
1. **Identity**: authentication, sessions, roles, guardian links
2. **Profiles**: profile data, DOB, preferences, identity verification
3. **Referral**: codes, invitations, acceptances, points ledger, **daily limits & batch management**
4. **Pots**: CRUD, states, J-30 scheduling
5. **Donations**: Wave integration, webhooks, ledger, refunds
6. **Packs**: catalog, pricing, sponsor promotions
7. **QR/Redemption**: generation, validation, audit trail
8. **Notifications**: email/WhatsApp/SMS templates, logs, retries
9. **Analytics**: event ingestion, dashboards, **engagement tracking**
10. **Admin**: feature flags, revenue splits, operational tools, **invitation limit controls**

### **Daily Invitation Limits System 🎆**

**Core Features:**
- **50 invitations per sponsor per day** (configurable via admin)
- **Batch selection**: "Select first 50 contacts" option
- **Individual selection**: Cherry-pick specific contacts
- **Mixed mode**: Combination of batch + individual selection
- **Daily reset at midnight** (Senegal timezone)
- **Visual limit counter**: "32/50 invites remaining today"
- **Engagement gamification**: Consecutive day streaks, daily comeback rewards

**Technical Implementation:**
- `sponsor_daily_limits` table tracks daily quotas and usage
- `sponsor_contact_batches` table manages batch selections
- Smart queueing system for contact prioritization
- Automated reset job at midnight
- Real-time limit checking before invitation sends
- Analytics dashboard for admin monitoring

**Business Benefits:**
- **Increased Daily Engagement**: Sponsors return multiple times per day
- **Reduced Spam Complaints**: Prevents mass invitation abuse
- **Strategic Contact Selection**: Forces sponsors to prioritize high-quality invites
- **Improved Conversion Rates**: Quality over quantity approach
- **Platform Stickiness**: Creates daily usage habits

---

## 7) Key User Flows (Implemented vs Planned)

### **Sponsorship Flow (Primary Growth Loop)**
**Status**: ❌ Not implemented
**Target Timing**: < 2 minutes total
- [ ] Sponsor clicks "Sponsor & Earn" CTA
- [ ] WhatsApp contact selection and invitation sending
- [ ] Sponsored user receives and accepts invitation
- [ ] Identity collection and pot pre-creation
- [ ] Points award system

### **Pot Creation Flow**
**Status**: ❌ Not implemented  
**Target Timing**: < 3 minutes total
- [ ] Birthday person creates account
- [ ] Pot configuration with smart defaults
- [ ] Social sharing and invitation system
- [ ] Real-time progress tracking

### **Donation Flow**
**Status**: ❌ Not implemented
**Target Timing**: < 2 minutes total
- [ ] Guest discovers pot via link/social
- [ ] Quick donation amount selection
- [ ] Wave payment processing
- [ ] Success confirmation and sharing

### **Admin Management Flow**
**Status**: ❌ Not implemented
- [ ] Multi-level admin access (Regular, Super, Partner)
- [ ] Content moderation and user management
- [ ] Analytics dashboards
- [ ] Payment reconciliation tools

---

## 8) Performance & Optimization Targets

### **Speed Optimization Goals**
- **Pot Creation**: 3m 00s → 1m 30s (50% improvement)
- **Guest Donation**: 2m 00s → 45s (63% improvement)
- **Sponsorship**: 2m 00s → 30s (75% improvement)
- **Mobile Load Time**: <1s (world-class target)

### **Viral Growth Targets**
- **Overall Viral Coefficient**: 0.65 → 1.25+ (92% improvement)
- **Sponsor Activation Rate**: 20% → 35%
- **Invitation Accept Rate**: 35% → 50%
- **Share-to-Conversion Rate**: 15% → 25%

### **Technical Performance**
- **API Response Time**: P95 < 300ms, P99 < 800ms
- **Time to Interactive**: P95 < 2.5s on 3G
- **System Availability**: 99.9% uptime
- **Security**: JWT + HTTP-only cookies, RBAC, audit logging

---

## 9) Risk Assessment & Mitigation

### **High Priority Risks**
1. **Wave Integration Complexity**: Mitigation - Start with sandbox, thorough testing
2. **Mobile User Experience**: Mitigation - Mobile-first design, Flutter implementation
3. **Viral Loop Adoption**: Mitigation - Incentive optimization, user testing
4. **Regulatory Compliance**: Mitigation - Early legal review, age verification system

### **Medium Priority Risks**
1. **Performance at Scale**: Mitigation - Load testing, caching strategy
2. **Partner Integration**: Mitigation - Simple initial partnership, iterate
3. **Fraud Prevention**: Mitigation - Points system anti-abuse measures

---

## 10) Success Metrics & Monitoring

### **Business Metrics**
- Monthly Active Users (MAU)
- Sponsorship funnel conversion rates
- Pot success rate (funded vs unfunded)
- Average donation amount
- Partner redemption rates

### **Technical Metrics**
- API response times and error rates
- User journey completion rates
- System uptime and availability
- Security incident frequency
- Cost per transaction

### **User Experience Metrics**
- Time to complete key actions
- User satisfaction scores (NPS)
- Support ticket volume
- Feature adoption rates

---

## 11) Open Questions & Decisions Needed

1. **Final points system rates and caps** - sponsor financing policy
2. **Exact identity verification requirements** - document types, countries, acceptable proofs
3. **Points trigger event** (acceptance vs first donation vs J-30) based on unit economics
4. **WhatsApp Business API vs deep-links** - cost/latency at scale
5. **Partner settlement schedule and process**
6. **Flutter vs Web prioritization** based on user behavior data

---

## 12) Definition of Done (DoD)

### **Technical DoD**
- [ ] OpenAPI specifications published
- [ ] PostgREST configurations versioned
- [ ] MCP servers documented (tool schemas + examples)
- [ ] CI/CD with migrations and demo data seeding
- [ ] Monitoring: logs/metrics/traces + alerts
- [ ] Service dashboards implemented

### **Operational DoD**  
- [ ] Webhook replay procedures
- [ ] Refund processing workflows
- [ ] QR incident response playbooks
- [ ] PII export/deletion procedures
- [ ] Performance monitoring dashboards
- [ ] Security audit completion

---

**This PRD will be updated as development progresses and new features are implemented.**

— **End PRD v1.2 (EN)** —