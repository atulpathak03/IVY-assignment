import json
import re
from datetime import datetime, timezone, timedelta

print("=== DEEP DATA ANALYSIS & QUESTION SOLVER ===")

with open('data/listings.json', 'r', encoding='utf-8') as f:
    listings = json.load(f)

with open('data/rentals.json', 'r', encoding='utf-8') as f:
    rentals = json.load(f)

with open('data/projects.json', 'r', encoding='utf-8') as f:
    projects = json.load(f)

print(f"Loaded {len(listings)} listings, {len(rentals)} rentals, {len(projects)} projects.")

# Q1: total_listing_records
total_listing_records = len(listings)
print(f"\n1. total_listing_records: {total_listing_records}")

# Q2: unique_properties exploration
print("\n--- Investigating Q2: Unique Properties ---")
# Check listing_id uniqueness
listing_ids = [l['listing_id'] for l in listings]
print(f"Total listing_ids: {len(listing_ids)}, Unique listing_ids: {len(set(listing_ids))}")

# Check physical property signatures
# Signature 1: exact property specs (locality, apartment_name, bedroom, bathroom, floor, total_floors, carpet_area, super_built_up_area, latitude, longitude)
def get_prop_sig_strict(l):
    return (
        str(l.get('locality')).strip().lower(),
        str(l.get('apartment_name')).strip().lower(),
        l.get('bedroom'),
        l.get('bathroom'),
        l.get('floor'),
        l.get('total_floors'),
        l.get('carpet_area'),
        l.get('super_built_up_area'),
        round(float(l.get('latitude', 0)), 4),
        round(float(l.get('longitude', 0)), 4)
    )

sig_strict_map = {}
for l in listings:
    sig = get_prop_sig_strict(l)
    sig_strict_map.setdefault(sig, []).append(l['listing_id'])

print(f"Strict physical property signatures count: {len(sig_strict_map)}")

# Signature 2: Location + Area + BHK + Floor (without apartment name in case of typos)
def get_prop_sig_geo(l):
    return (
        str(l.get('locality')).strip().lower(),
        l.get('bedroom'),
        l.get('bathroom'),
        l.get('floor'),
        l.get('total_floors'),
        l.get('carpet_area'),
        round(float(l.get('latitude', 0)), 4),
        round(float(l.get('longitude', 0)), 4)
    )

sig_geo_map = {}
for l in listings:
    sig = get_prop_sig_geo(l)
    sig_geo_map.setdefault(sig, []).append(l['listing_id'])

print(f"Geo+Specs physical property signatures count: {len(sig_geo_map)}")

# Q3: active_listings
active_listings = sum(1 for l in listings if l.get('is_live') is True)
print(f"\n3. active_listings (is_live == True): {active_listings}")

# Q4: corrupt_listing_ids
print("\n--- Investigating Q4: Corrupt Listings ---")
corrupt_reasons = {}

for l in listings:
    lid = l['listing_id']
    reasons = []
    
    # Invariant 1: floor > total_floors
    fl = l.get('floor')
    tot_fl = l.get('total_floors')
    if fl is not None and tot_fl is not None:
        if fl > tot_fl:
            reasons.append(f"floor ({fl}) > total_floors ({tot_fl})")
    
    # Invariant 2: carpet_area > super_built_up_area
    ca = l.get('carpet_area')
    sba = l.get('super_built_up_area')
    if ca is not None and sba is not None:
        if ca > sba:
            reasons.append(f"carpet_area ({ca}) > super_built_up_area ({sba})")
    
    # Invariant 3: non-positive area or price or bedroom
    if ca is not None and ca <= 0:
        reasons.append(f"carpet_area <= 0 ({ca})")
    if sba is not None and sba <= 0:
        reasons.append(f"super_built_up_area <= 0 ({sba})")
    price = l.get('price')
    if price is not None and price <= 0:
        reasons.append(f"price <= 0 ({price})")
    bhk = l.get('bedroom')
    if bhk is not None and bhk <= 0:
        reasons.append(f"bedroom <= 0 ({bhk})")
    bath = l.get('bathroom')
    if bath is not None and bath < 0:
        reasons.append(f"bathroom < 0 ({bath})")
    
    # Invariant 4: Negative floor where total_floors > 0 (basement in multi-story without basement context) or impossible floor
    if fl is not None and fl < 0:
        reasons.append(f"negative floor ({fl})")

    if reasons:
        corrupt_reasons[lid] = reasons

corrupt_listing_ids = sorted(list(corrupt_reasons.keys()))
print(f"Corrupt listing count: {len(corrupt_listing_ids)}")
for cid in corrupt_listing_ids:
    print(f"  {cid}: {corrupt_reasons[cid]}")

# Q5: total_monthly_rent in assigned locality (guindy)
print("\n--- Investigating Q5: Total Monthly Rent in Guindy ---")
guindy_rentals = [r for r in rentals if str(r.get('locality')).strip().lower() == 'guindy']
total_monthly_rent = sum(r.get('price', 0) for r in guindy_rentals)
print(f"Guindy rental records count: {len(guindy_rentals)}")
print(f"5. total_monthly_rent: {total_monthly_rent}")

# Q7: costliest_project
print("\n--- Investigating Q7: Costliest Project ---")
# Inspect project price units
max_p = None
max_p_inr = -1
max_p_proj = None

for p in projects:
    p_max = p.get('price_max')
    if p_max is None:
        continue
    # Let's check value of p_max: e.g. 21.4 (Crores), 85.0 (Lakhs), 21400000 (INR)
    # If p_max is float < 100, e.g. 1.95 (Crores) or 66.1 (Lakhs)?
    # Let's inspect all price_max values to see their scale!
    pass

project_prices = [(p['project_id'], p.get('apartment_name'), p.get('price_min'), p.get('price_max')) for p in projects]
# Sort by price_max descending
print("Sample project price_max values:")
for item in project_prices[:10]:
    print(" ", item)

# Q8: listings_last_7_days
print("\n--- Investigating Q8: Listings Posted Last 7 Days ---")
# Reference timestamp: 2026-09-10T00:00:00+05:30
# 7 days before: 2026-09-03T00:00:00+05:30
# IST is UTC+5:30.
# Convert 2026-09-10T00:00:00+05:30 to UTC: 2026-09-09T18:30:00Z
# Convert 2026-09-03T00:00:00+05:30 to UTC: 2026-09-02T18:30:00Z
ist = timezone(timedelta(hours=5, minutes=30))
ref_dt = datetime(2026, 9, 10, 0, 0, 0, tzinfo=ist)
start_dt = ref_dt - timedelta(days=7)

print(f"Reference IST: {ref_dt.isoformat()}")
print(f"Start IST:     {start_dt.isoformat()}")

in_range_count = 0
for l in listings:
    ts_str = l.get('posted_at')
    if not ts_str:
        continue
    # Parse timestamp
    # ISO strings might be like "2026-06-14T09:20:00Z" or "2026-06-14T09:20:00"
    ts_str = ts_str.rstrip('Z')
    # If no tz offset in string, assume IST or UTC? Let's check documentation vs reality!
    dt = datetime.fromisoformat(ts_str)
    if dt.tzinfo is None:
        # If naive timestamp, let's test if it represents IST or UTC
        dt = dt.replace(tzinfo=ist) # Or timezone.utc
    
    if start_dt <= dt < ref_dt:
        in_range_count += 1

print(f"8. listings_last_7_days (assuming IST for naive timestamps): {in_range_count}")

# Q9: fake_listing_ids investigation
print("\n--- Investigating Q9: Fake Listings ---")
# Let's inspect phone numbers, descriptions, price anomalies, repeat contacts
contact_counts = {}
for l in listings:
    c = l.get('posted_by_contact')
    if c:
        contact_counts[c] = contact_counts.get(c, 0) + 1

print("Top 10 contact numbers by listing count:")
sorted_contacts = sorted(contact_counts.items(), key=lambda x: x[1], reverse=True)
for c, cnt in sorted_contacts[:10]:
    print(f"  {c}: {cnt} listings")

# Q10: projects_with_wrong_listing_count
print("\n--- Investigating Q10: Project Listing Count Discrepancies ---")
# Count actual listings per project_id
actual_proj_counts = {}
for l in listings:
    pid = l.get('project_id')
    if pid:
        actual_proj_counts[pid] = actual_proj_counts.get(pid, 0) + 1

mismatch_count = 0
mismatches = []
for p in projects:
    pid = p['project_id']
    reported = p.get('total_listings', 0)
    actual = actual_proj_counts.get(pid, 0)
    if reported != actual:
        mismatch_count += 1
        mismatches.append((pid, reported, actual))

print(f"10. projects_with_wrong_listing_count: {mismatch_count} out of {len(projects)} projects")
print("Sample mismatches (project_id, reported, actual):")
for m in mismatches[:10]:
    print(" ", m)

