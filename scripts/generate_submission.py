import json
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='.env.local')

API_KEY = os.getenv('API_KEY', 'IVY26-05FB73DA5767')
CANDIDATE_NAME = os.getenv('CANDIDATE_NAME', 'Atul')
CANDIDATE_EMAIL = os.getenv('CANDIDATE_EMAIL', 'atul@mnnit.ac.in')
CANDIDATE_REPO_URL = os.getenv('CANDIDATE_REPO_URL', 'https://github.com/atul/ivy-homes-assignment')
CANDIDATE_DEMO_URL = os.getenv('CANDIDATE_DEMO_URL', 'https://ivy-homes-assignment.vercel.app')

# Load dataset
with open('data/listings.json', 'r', encoding='utf-8') as f:
    listings = json.load(f)

with open('data/rentals.json', 'r', encoding='utf-8') as f:
    rentals = json.load(f)

with open('data/projects.json', 'r', encoding='utf-8') as f:
    projects = json.load(f)

# 1. total_listing_records
total_listing_records = len(listings)

# 2. unique_properties
def clean_apt_name(name):
    if not name:
        return ''
    import re
    s = str(name).lower()
    s = re.sub(r'[\-_,.]', ' ', s)
    s = re.sub(r'\b(phase|phase\s*\d+|apartments?|towers?)\b', '', s)
    return ' '.join(s.split())

groups_unique = {}
for l in listings:
    k = (
        str(l.get('locality')).strip().lower(),
        clean_apt_name(l.get('apartment_name')),
        l.get('bedroom'),
        l.get('bathroom'),
        l.get('floor'),
        l.get('total_floors'),
        l.get('carpet_area')
    )
    groups_unique.setdefault(k, []).append(l)

unique_properties = len(groups_unique)

# 3. active_listings
active_listings = sum(1 for l in listings if l.get('is_live') is True)

# 4. corrupt_listing_ids
c_fl = [l['listing_id'] for l in listings if l.get('floor',0) > l.get('total_floors',0)]
c_pr = [l['listing_id'] for l in listings if l.get('price',0) <= 0]
c_ar = [l['listing_id'] for l in listings if l.get('carpet_area',0) > l.get('super_built_up_area',0)]
corrupt_listing_ids = sorted(list(set(c_fl + c_pr + c_ar)))

# 5. total_monthly_rent in assigned locality (guindy)
guindy_rentals = [r for r in rentals if str(r.get('locality')).strip().lower() == 'guindy']
total_monthly_rent = sum(r.get('price', 0) for r in guindy_rentals)

# 9. fake_listing_ids
by_contact = {}
for l in listings:
    by_contact.setdefault(l.get('posted_by_contact'), []).append(l)

fake_set = set()
fake_contacts = []
for c, items in by_contact.items():
    names = set(i.get('posted_by_name') for i in items if i.get('posted_by_name'))
    if len(names) >= 3:
        fake_contacts.append(c)
        fake_set.update(i['listing_id'] for i in items)

fake_listing_ids = sorted(list(fake_set))

# 6. avg_price_per_sqft_2bhk
corrupt_set = set(corrupt_listing_ids)
qualifying_rates = []
for l in listings:
    lid = l['listing_id']
    if l.get('is_live') is True and l.get('bedroom') == 2:
        if lid not in corrupt_set and lid not in fake_set:
            ca = l.get('carpet_area', 0)
            p = l.get('price', 0)
            if ca > 0 and p > 0:
                # Convert carpet_area to sq ft if reported in sq m (magichomes or ca < 300)
                ca_sqft = ca * 10.76391041671 if (l.get('website') == 'magichomes' or ca < 300) else ca
                qualifying_rates.append(p / ca_sqft)

avg_price_per_sqft_2bhk = round(sum(qualifying_rates) / len(qualifying_rates), 2) if qualifying_rates else 0.0

# 7. costliest_project
max_p_inr = -1
costliest_pid = ""
for p in projects:
    pmax = p.get('price_max')
    if pmax is not None:
        if pmax < 15.0:
            inr = int(round(pmax * 10000000))
        else:
            inr = int(round(pmax * 100000))
        if inr > max_p_inr:
            max_p_inr = inr
            costliest_pid = p['project_id']

costliest_project = {
    "project_id": costliest_pid,
    "price_max_inr": max_p_inr
}

# 8. listings_last_7_days
from datetime import datetime, timezone, timedelta
ist = timezone(timedelta(hours=5, minutes=30))
ref_ist = datetime(2026, 9, 10, 0, 0, 0, tzinfo=ist)
start_ist = datetime(2026, 9, 3, 0, 0, 0, tzinfo=ist)

listings_last_7_days = 0
for l in listings:
    ts = l.get('posted_at')
    if not ts:
        continue
    clean_ts = ts.rstrip('Z')
    dt = datetime.fromisoformat(clean_ts).replace(tzinfo=ist)
    if start_ist <= dt < ref_ist:
        listings_last_7_days += 1

# 10. projects_with_wrong_listing_count
actual_proj_counts = {}
for l in listings:
    pid = l.get('project_id')
    if pid:
        actual_proj_counts[pid] = actual_proj_counts.get(pid, 0) + 1

projects_with_wrong_listing_count = 0
for p in projects:
    pid = p['project_id']
    rep = p.get('total_listings', 0)
    act = actual_proj_counts.get(pid, 0)
    if rep != act:
        projects_with_wrong_listing_count += 1

# Verified Findings
findings = [
    {
        "endpoint": "*",
        "category": "auth",
        "documented": "Every request must carry the API key as a query parameter: GET /v1/listings?api_key=IVY26-XXXXXXXXXXXX",
        "actual": "Passing api_key as a query parameter returns HTTP 401 with detail 'send your key in the X-API-Key request header, not as a query parameter'. The API key is strictly required in the X-API-Key HTTP header.",
        "how_found": "Issued GET /v1/listings?api_key=... and received HTTP 401 error message.",
        "impact": "All API calls fail with HTTP 401 unless the X-API-Key header is sent.",
        "evidence": []
    },
    {
        "endpoint": "/v1/listings",
        "category": "auth",
        "documented": "Query parameter api_key is required; Bearer token is documented as optional and only needed for favourites.",
        "actual": "Collection endpoints /v1/listings, /v1/rentals, and /v1/projects require BOTH the X-API-Key header AND an Authorization: Bearer <token> header from /auth/login. Calls without a Bearer token return 401 Unauthorized.",
        "how_found": "Called GET /v1/listings with X-API-Key header alone and received HTTP 401.",
        "impact": "Users cannot view listings, rentals, or projects without authenticating via /auth/login first.",
        "evidence": []
    },
    {
        "endpoint": "/auth/login",
        "category": "auth",
        "documented": "Returns 'token', 'token_type': 'Bearer', 'expires_in': 86400 (24h), and states 'There is no refresh flow.'",
        "actual": "Returns 'access_token' (not 'token'), 'refresh_token', 'refresh_url': '/auth/refresh', and 'expires_in': 900 (15 minutes). Session refresh flow exists via POST /auth/refresh taking {'refresh_token': '...'}.",
        "how_found": "Inspected POST /auth/login response object keys and verified POST /auth/refresh endpoint.",
        "impact": "Access tokens expire after 15 minutes instead of 24 hours. Applications must handle session refresh via /auth/refresh.",
        "evidence": []
    },
    {
        "endpoint": "/v1/listings",
        "category": "pagination",
        "documented": "Every collection endpoint takes page (1-indexed) and limit (default 20, max 200). Response returns total, page, page_size, results.",
        "actual": "Collection endpoints accept offset (0-indexed record offset) and limit (capped at max 50 items per page). The page parameter is ignored when limit is passed. Response metadata returns limit, offset, count, total, has_more, results.",
        "how_found": "Tested page=2&limit=50 which returned offset 0 items repeatedly, whereas offset=50&limit=50 paginated correctly.",
        "impact": "Clients using page parameter get stuck on page 1. Pagination must use offset parameter.",
        "evidence": []
    },
    {
        "endpoint": "/v1/listings",
        "category": "completeness",
        "documented": "The endpoint total response field reports the exact number of records matching filters.",
        "actual": "The total field in response metadata reports 3736 records, but paging to the end yields 4100 retrievable listing records.",
        "how_found": "Paged through /v1/listings with offset += 50 until has_more was False.",
        "impact": "Relying on the total metadata field truncates pagination math by 364 records.",
        "evidence": []
    },
    {
        "endpoint": "/v1/listing/{id}",
        "category": "missing_endpoint",
        "documented": "GET /v1/listing/{listing_id} returns a single listing object.",
        "actual": "GET /v1/listing/{listing_id} (singular) returns 404 Not Found. The working endpoint is GET /v1/listings/{listing_id} (plural).",
        "how_found": "Called GET /v1/listing/MAG-4001518 (singular 404) vs GET /v1/listings/MAG-4001518 (plural 200).",
        "impact": "Single listing lookup using documented singular route fails.",
        "evidence": ["MAG-4001518"]
    },
    {
        "endpoint": "/v1/listings/{id}/similar",
        "category": "missing_endpoint",
        "documented": "GET /v1/listings/{listing_id}/similar returns up to ten comparable listings.",
        "actual": "GET /v1/listings/{listing_id}/similar returns 404 Not Found on the live server.",
        "how_found": "Called GET /v1/listings/MAG-4001518/similar and received 404 Not Found.",
        "impact": "Similar listings feature cannot rely on server endpoint.",
        "evidence": ["MAG-4001518"]
    },
    {
        "endpoint": "/v1/favourites",
        "category": "missing_endpoint",
        "documented": "GET /v1/favourites, POST /v1/favourites, and DELETE /v1/favourites/{id} manage saved listings.",
        "actual": "GET/POST/DELETE /v1/favourites returns 404 Not Found.",
        "how_found": "Called /v1/favourites with valid Bearer token and received 404 Not Found.",
        "impact": "Favourites must be maintained client-side in localStorage or application state.",
        "evidence": []
    },
    {
        "endpoint": "/v1/analytics/summary",
        "category": "missing_endpoint",
        "documented": "GET /v1/analytics/summary returns pre-computed aggregates for your city.",
        "actual": "GET /v1/analytics/summary returns 404 Not Found.",
        "how_found": "Called GET /v1/analytics/summary with valid headers and received 404 Not Found.",
        "impact": "Analytics dashboard metrics must be calculated directly from raw listing/project datasets.",
        "evidence": []
    },
    {
        "endpoint": "/v1/projects",
        "category": "units",
        "documented": "price_min and price_max are in Indian rupees (integer).",
        "actual": "price_min and price_max are reported as floats in Crores (for values < 15.0) or Lakhs (for values >= 15.0), rather than integer Rupees.",
        "how_found": "Inspected project objects, e.g. P40224 reports price_max: 3.78 (3.78 Cr = 37,800,000 INR).",
        "impact": "Displaying project prices without unit conversion displays ₹3.78 instead of ₹3.78 Cr.",
        "evidence": ["P40224", "P40441", "P40071"]
    },
    {
        "endpoint": "/v1/listings",
        "category": "units",
        "documented": "carpet_area is in square feet everywhere in the API.",
        "actual": "Listings from website magichomes report carpet_area and super_built_up_area in square meters (sq m) instead of square feet (e.g. 111 sq m for 3 BHK).",
        "how_found": "Identified 3 BHK listings with carpet_area = 111 sq m.",
        "impact": "Price per sqft calculations for magichomes listings are skewed unless converted to square feet.",
        "evidence": ["MAG-4003885", "MAG-4002264", "MAG-4003492"]
    },
    {
        "endpoint": "/v1/listings",
        "category": "timestamps",
        "documented": "Timestamps are ISO 8601, UTC, Z suffix, everywhere in the API.",
        "actual": "posted_at in /v1/listings is an ISO string without Z suffix or timezone offset (e.g. '2026-01-19T12:56:00'), representing local server time (IST).",
        "how_found": "Inspected posted_at values across all 4100 listing objects.",
        "impact": "Parsing naive string as UTC shifts posted dates by -5:30 hours.",
        "evidence": ["MAG-4001518"]
    },
    {
        "endpoint": "/v1/listings",
        "category": "data_quality",
        "documented": "Every listing_id is globally unique and corresponds to exactly one physical property.",
        "actual": "A set of 27 listing records contains physically impossible data (floor > total_floors, negative/zero prices, or carpet_area > super_built_up_area).",
        "how_found": "Ran validation rules on floor vs total_floors, price, and carpet_area vs super_built_up_area.",
        "impact": "Displays physically impossible properties unless filtered out.",
        "evidence": corrupt_listing_ids[:20]
    },
    {
        "endpoint": "/v1/listings",
        "category": "fraud",
        "documented": "Every listing is an active sale listing in your city.",
        "actual": "228 listing records belong to 12 lead-generation phone numbers that re-use 3 to 6 fake contact names across 7 to 10 localities to generate inquiries.",
        "how_found": "Analyzed contact number multi-persona name distribution and locality geographic spread.",
        "impact": "Distorts real estate marketplace pricing and availability.",
        "evidence": fake_contacts[:12]
    },
    {
        "endpoint": "/v1/projects",
        "category": "consistency",
        "documented": "total_listings in /v1/projects always agrees with what GET /v1/listings?project_id=... returns.",
        "actual": "total_listings in project records disagrees with the actual number of listing records referencing that project for 336 out of 460 projects.",
        "how_found": "Compared project.total_listings against count of listings referencing each project_id.",
        "impact": "Project cards display inaccurate listing inventory counts.",
        "evidence": ["P40001", "P40003", "P40004", "P40005", "P40006", "P40008", "P40009", "P40010", "P40011", "P40014"]
    },
    {
        "endpoint": "/v1/rentals",
        "category": "consistency",
        "documented": "Rental listing title and locality represent property location.",
        "actual": "Rental listings contain contradictory locality information (e.g. title says '1 BHK for rent in Velachery' while locality field says 't nagar').",
        "how_found": "Cross-referenced title string against locality attribute in rental objects.",
        "impact": "Confuses users searching for rentals in specific localities.",
        "evidence": ["R4000001"]
    }
]

submission_data = {
    "api_key": API_KEY,
    "candidate": {
        "name": CANDIDATE_NAME,
        "email": CANDIDATE_EMAIL,
        "repo_url": CANDIDATE_REPO_URL,
        "demo_url": CANDIDATE_DEMO_URL
    },
    "answers": {
        "total_listing_records": total_listing_records,
        "unique_properties": unique_properties,
        "active_listings": active_listings,
        "corrupt_listing_ids": corrupt_listing_ids,
        "total_monthly_rent": total_monthly_rent,
        "avg_price_per_sqft_2bhk": avg_price_per_sqft_2bhk,
        "costliest_project": costliest_project,
        "listings_last_7_days": listings_last_7_days,
        "fake_listing_ids": fake_listing_ids,
        "projects_with_wrong_listing_count": projects_with_wrong_listing_count
    },
    "findings": findings
}

with open('submission.json', 'w', encoding='utf-8') as f:
    json.dump(submission_data, f, indent=2)

print("\n=== SUBMISSION.JSON GENERATED SUCCESSFULLY ===")
print("Answers Summary:")
for k, v in submission_data['answers'].items():
    if isinstance(v, list):
        print(f"  {k:35s}: count={len(v)}")
    else:
        print(f"  {k:35s}: {v}")

print(f"Total findings: {len(findings)}")
