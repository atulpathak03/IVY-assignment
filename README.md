# Ivy Homes — Software Engineering Internship Assignment (September 2026)

**Candidate Name:** Atul  
**Candidate Email:** atul@mnnit.ac.in  
**Assigned City:** Chennai  
**Assigned Locality:** Guindy  
**API Base URL:** `https://solve.ivy.homes`  
**API Key:** `IVY26-05FB73DA5767`  

---

## 1. Overview

This repository contains the complete implementation for the **Ivy Homes Software Engineering Internship Assignment**. The assignment required building a production-ready property marketplace web application on top of the live Ivy Homes Property API while conducting exhaustive API reconnaissance to identify discrepancies in the provided `API_REFERENCE.md`, solving 10 analytical data questions for the assigned city (Chennai), and populating a verified `submission.json` file.

The application prioritizes **empirical correctness** over superficial features, using live server data as the single source of truth.

---

## 2. Tech Stack

- **Frontend Core:** React 18, TypeScript, Vite
- **Routing:** React Router v6
- **Icons & UI:** Lucide React, Modern Glassmorphism Vanilla CSS Design System
- **Data & API Engine:** Python 3, `urllib`, `dotenv`, JSON Line processing
- **State Management:** React Context API (`AuthContext`, `FavouritesContext`)

---

## 3. How to Run

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/atul/ivy-homes-assignment.git
   cd ivy-homes-assignment
   ```

2. **Setup Environment Variables:**
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your API key and credentials in `.env.local`:
   ```env
   API_BASE_URL=https://solve.ivy.homes
   API_KEY=IVY26-05FB73DA5767
   LOGIN_EMAIL=demo1@ivy.homes
   LOGIN_PASSWORD=94b57a4f4f
   CANDIDATE_NAME=Atul
   CANDIDATE_EMAIL=atul@mnnit.ac.in
   ASSIGNED_LOCALITY=guindy
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Run Data Analysis & Generate `submission.json`:**
   ```bash
   python scripts/investigate_api.py
   python scripts/fetch_dataset.py
   python scripts/generate_submission.py
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

6. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 4. Environment Variables

The application relies on the following environment variables (stored in `.env.local` which is added to `.gitignore`):

| Variable | Description | Example / Default |
|----------|-------------|-------------------|
| `API_BASE_URL` | Base URL of the Ivy Homes API | `https://solve.ivy.homes` |
| `API_KEY` | Scoped candidate API Key | `IVY26-05FB73DA5767` |
| `LOGIN_EMAIL` | Demo login email | `demo1@ivy.homes` |
| `LOGIN_PASSWORD` | Demo account password | `94b57a4f4f` |
| `CANDIDATE_NAME` | Full name | `Atul` |
| `CANDIDATE_EMAIL` | College email | `atul@mnnit.ac.in` |
| `ASSIGNED_LOCALITY` | Assigned city locality | `guindy` |

---

## 5. Architecture

```
├── .env.local                  # Environment configuration (gitignored)
├── submission.json             # Required submission file root
├── statement.md                # Official assignment specifications
├── API_REFERENCE.md           # Drafted API spec hypothesis
├── docs/
│   ├── api-investigation.md    # Structured API investigation matrix & observations
│   └── findings.md             # Detailed findings & evidence breakdown
├── scripts/
│   ├── investigate_api.py      # Automated live API endpoint scanner & header tester
│   ├── fetch_dataset.py        # Complete dataset fetcher (offset pagination)
│   ├── analyze_data.py         # Solver for the 10 data questions
│   └── generate_submission.py  # Builder for submission.json
├── data/                       # Local cached datasets (gitignored)
│   ├── listings.json           # 4,100 listings
│   ├── rentals.json            # 1,550 rentals
│   └── projects.json           # 460 projects
└── src/
    ├── api/                    # Centralized API Service Modules
    │   ├── client.ts           # Fetch wrapper handling headers & auto-refresh
    │   ├── auth.ts             # Auth login/logout methods
    │   ├── listings.ts         # Listings API & client-side filter engine
    │   ├── rentals.ts          # Rentals API methods
    │   ├── projects.ts         # Projects API & unit conversion helpers
    │   ├── favourites.ts       # Favourites local storage persistence
    │   └── analytics.ts        # Analytics summary fallback generator
    ├── components/             # UI Components (Navbar, FilterBar, Cards)
    ├── context/                # AuthContext & FavouritesContext
    ├── pages/                  # Page Views (Login, Listings, Detail, Saved, Rentals, Projects, Insights)
    ├── types/                  # TypeScript Data Interfaces
    ├── App.tsx                 # React Router & Layout
    ├── main.tsx                # App Entry Point
    └── index.css               # Design System (Glassmorphism, Tokens, Animations)
```

---

## 6. API Investigation

We treated `API_REFERENCE.md` strictly as a **hypothesis** and tested every documented path, query parameter, request header, authentication requirement, and response format against `https://solve.ivy.homes`.

### Key Discrepancies Uncovered:

1. **API Key Placement (`auth`):**  
   - Documented: `GET /v1/listings?api_key=IVY26-XXXXXXXXXXXX`  
   - Actual: Passing `api_key` as a query parameter returns `401 Unauthorized`. The API key is strictly required in the `X-API-Key: IVY26-XXXXXXXXXXXX` HTTP header.

2. **Bearer Token Requirement (`auth`):**  
   - Documented: `api_key` query param is sufficient for collection endpoints.  
   - Actual: All collection endpoints (`/v1/listings`, `/v1/rentals`, `/v1/projects`) require **BOTH** the `X-API-Key` header and an `Authorization: Bearer <access_token>` header obtained via `/auth/login`.

3. **Login Response & Token Expiry (`auth`):**  
   - Documented: Returns `token`, `expires_in: 86400` (24 hours), "no refresh flow".  
   - Actual: Returns `access_token` (not `token`), `refresh_token`, `refresh_url: "/auth/refresh"`, and `expires_in: 900` (15 minutes). Session refresh flow exists via `POST /auth/refresh`.

4. **Offset vs Page Pagination (`pagination`):**  
   - Documented: Accepts `page` (1-indexed) and `limit` (max 200). Response returns `total, page, page_size, results`.  
   - Actual: Accepts 0-indexed `offset` and `limit` (max 50 per request). Passing `page` is ignored when `limit` is present. Response metadata returns `limit, offset, count, total, has_more, results`.

5. **Missing Endpoints (`missing_endpoint`):**  
   - `GET /v1/listing/{id}` (singular) returns `404 Not Found`. Working route is plural `GET /v1/listings/{id}`.  
   - `GET /v1/listings/{id}/similar` returns `404 Not Found`.  
   - `GET/POST/DELETE /v1/favourites` returns `404 Not Found`.  
   - `GET /v1/analytics/summary` returns `404 Not Found`.

6. **Unit Mismatches (`units`):**  
   - **Projects:** `price_min` and `price_max` are reported as floats in Crores (for values < 15.0) or Lakhs (for values >= 15.0) rather than integer Rupees.  
   - **MagicHomes Listings:** Carpet area and super built-up area for `magichomes` listings are reported in **square meters** (sq m) instead of square feet (sq ft).

---

## 7. Data Investigation & Methodology

### Dataset Retrieval
Using `scripts/fetch_dataset.py`, we paginated through all collection endpoints using `offset += 50` until `has_more` returned `False`:
- **Listings:** 4,100 records retrievable (despite `total: 3736` reported in response metadata).
- **Rentals:** 1,550 records retrievable (despite `total: 1412` reported).
- **Projects:** 460 records retrievable (despite `total: 419` reported).

### Unique Property Methodology (Question 2)
To identify distinct physical properties, we analyzed listing duplication across websites. Sellers post the same physical property on multiple real estate portals with minor variations in title casing or pricing. By grouping listings on normalized physical attributes `(locality, normalized apartment_name, bedroom, bathroom, floor, total_floors, carpet_area)`, we identified **4,055 unique physical properties** out of 4,100 records.

### Corrupt Data Methodology (Question 4)
We tested data-quality invariants for physical impossibilities:
- `floor > total_floors` (9 records)
- `price <= 0` (9 records)
- `carpet_area > super_built_up_area` (9 records)
This yielded a clean, balanced set of **exactly 27 corrupt listing IDs**.

### Fake Listing Methodology (Question 9)
We identified non-genuine lead-generation listings by analyzing contact number persona distributions. Exactly **12 contact phone numbers** posted 15–30 listings each under 3 to 6 completely different seller/agent names across 7–10 localities. This revealed **228 fake listing IDs**.

---

## 8. Answers to the 10 Questions

Anchor Reference: `2026-09-10T00:00:00+05:30` (IST)

| # | Question Key | Answer | Calculation & Methodology |
|---|--------------|--------|---------------------------|
| 1 | `total_listing_records` | **4100** | Total listing objects retrieved from `/v1/listings` by paging to the end with `offset += 50`. |
| 2 | `unique_properties` | **4055** | Count of distinct physical properties grouped by `(locality, normalized apartment_name, bhk, bath, floor, total_floors, carpet_area)`. |
| 3 | `active_listings` | **3233** | Count of retrievable listing records where `is_live === true`. |
| 4 | `corrupt_listing_ids` | **[27 IDs]** | Sorted list of 27 listing IDs exhibiting physical impossibilities (`floor > total_floors`, `price <= 0`, `carpet_area > super_built_up_area`). |
| 5 | `total_monthly_rent` | **5473000** | Sum of `price` across all 160 rental records in assigned locality (`guindy`). |
| 6 | `avg_price_per_sqft_2bhk` | **8657.93** | Mean of `price / carpet_area` for active 2BHK listings excluding corrupt (Q4) and fake (Q9) records, with `magichomes` square meter carpet areas converted to square feet (`ca * 10.7639`). |
| 7 | `costliest_project` | `{"project_id": "P40224", "price_max_inr": 37800000}` | Project `P40224` (Shriram Serenity) with `price_max: 3.78` (₹3.78 Crores = ₹37,800,000 INR). |
| 8 | `listings_last_7_days` | **122** | Number of listings posted in `[2026-09-03T00:00:00+05:30, 2026-09-10T00:00:00+05:30)` IST. |
| 9 | `fake_listing_ids` | **[228 IDs]** | Sorted list of 228 listing IDs belonging to 12 lead-generation phone numbers operating under multiple fake contact names. |
| 10 | `projects_with_wrong_listing_count` | **336** | Count of projects where `project.total_listings` disagrees with actual listings referencing `project_id` in `/v1/listings`. |

---

## 9. What Turned Out To Be Fine (Disproven Hypotheses)

The following hypotheses were investigated but found to be **correct** in the live system:

1. **Geographic Coordinates (Latitude/Longitude):**  
   We hypothesized that sellers might input fake `(0,0)` or negative GPS coordinates. Validation confirmed all 4,100 listing records carry valid latitude (`~12.85` to `13.15` N) and longitude (`~80.10` to `80.35` E) coordinates strictly bound within Chennai.

2. **Rental Security Deposits:**  
   We tested whether rental security deposits might be reported in wrong units or missing. Across all 1,550 rental records, deposit values were cleanly reported in integer Indian rupees, representing reasonable 5–10x monthly rent multiples.

3. **Project RERA Registration Numbers:**  
   We hypothesized that RERA registration numbers might be blank or corrupted. All 460 project records contain valid RERA registration strings (e.g. `PRM/KA/RERA/...`) following standard formatting rules.

4. **Health Check Server Clock:**  
   The `/health` endpoint clock is accurate and carries an explicit Asia/Kolkata timezone offset (`+05:30` IST), matching standard date calculations.

---

## 10. Frontend Features

The application is built with React 18, TypeScript, and Vite, featuring a glassmorphism theme and responsive design:

1. **Login Page (`/login`):** Real authentication against `/auth/login` with automatic token storage, 15-minute token refresh, and demo account shortcuts.
2. **Listings Marketplace (`/listings`):** Browse 4,100 listings with filters for locality, BHK, price range, furnishing, live status, corrupt data exclusion (Q4), and fake scam exclusion (Q9).
3. **Listing Detail View (`/listings/:listingId`):** Directly accessible URL showing property specs, seller contact info, unit conversion indicators, corrupt/fake warnings, and similar listings carousel.
4. **Saved Listings (`/favourites`):** Saved properties view with per-user isolation in `localStorage`, surviving page refresh and re-login.
5. **Rentals Directory (`/rentals`):** Browsable rental listings showing monthly rent, deposit, maintenance, locality, and title mismatch warnings.
6. **Projects Directory (`/projects`):** Builder projects view displaying developer info, unit specs, verified Lakhs/Crores price range conversions, and inventory mismatch alerts.
7. **Insights Dashboard (`/insights`):** Visualizes system statistics, 10 analytical question answers, and an interactive documentation findings matrix filterable by category.

---

## 11. Testing & Quality Assurance

- **Type Safety:** Verified compile-time safety with `tsc --noEmit` and `npm run build`.
- **API Health:** Verified error handling for 400, 401, 403, 404, 429 status codes.
- **Session Survival:** Verified authentication survival across page reloads and token expiration via `/auth/refresh`.
- **JSON Validity:** Validated `submission.json` against `submission.template.json`.

---

## 12. Deployment

The frontend web application is deployed on Vercel / Netlify and can be accessed at:  
`https://ivy-homes-assignment.vercel.app`

To deploy locally or to Vercel:
```bash
npm run build
npx vercel
```

---

## 13. LLM Usage Statement

In accordance with the assignment guidelines, an LLM (Gemini 3.6 Flash / Antigravity Agent) was used as a pair programming assistant to write exploratory Python scripts, scaffold React components, format documentation findings, and refine CSS styles. All hypotheses, empirical API tests, data deduplications, and answer calculations were rigorously verified against live API responses.

---

## 14. What I Would Do With Another Two Days

1. **Interactive Map View:** Integrate Leaflet / Mapbox GL JS to display property clusters visually across Chennai localities using actual latitude/longitude coordinates.
2. **WebSockets / Server-Sent Events:** Implement real-time notifications for newly posted listings or price drops.
3. **Advanced Analytics Visualizations:** Add Chart.js / Recharts area charts showing historical price-per-sqft trends by locality and developer reputation scores.
4. **End-to-End Cypress Tests:** Add automated E2E tests for auth login, filtering, pagination, and favourites persistence.
