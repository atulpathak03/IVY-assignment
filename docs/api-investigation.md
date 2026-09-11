# Ivy Homes API Investigation & Reconnaissance

## Executive Summary

An exhaustive empirical investigation was performed against the live Ivy Homes Property API (`https://solve.ivy.homes`) using API Key `IVY26-05FB73DA5767` scoped to the city of **Chennai**.

Every documented endpoint, authentication mechanism, parameter, response schema, pagination format, unit convention, and data relationship was systematically tested and compared against `API_REFERENCE.md`.

---

## Live Endpoint Matrix

| Documented Endpoint Path | Method | Live Status | Actual Path / Behavior | Discrepancy Category |
|--------------------------|--------|-------------|------------------------|----------------------|
| `GET /health` | GET | `200 OK` | `GET /health` returns `server_time` carrying an explicit `+05:30` IST offset. | `timestamps` (example) |
| `POST /auth/login` | POST | `200 OK` | Requires `X-API-Key` header. Returns `access_token` (not `token`), `refresh_token`, `refresh_url: '/auth/refresh'`, `expires_in: 900` (15m). | `auth` |
| `POST /auth/logout` | POST | `200 OK` | Requires `X-API-Key` and `Authorization: Bearer <access_token>`. | `auth` |
| `POST /auth/refresh` | POST | `200 OK` | **Undocumented endpoint**. Accepts `{"refresh_token": "..."}` and returns a new access token pair. | `undocumented_endpoint` / `auth` |
| `GET /v1/listings` | GET | `200 OK` | Requires `X-API-Key` AND `Authorization: Bearer <access_token>`. Uses `offset` and `limit` (max 50). Ignores `page`. | `auth`, `pagination`, `completeness` |
| `GET /v1/listing/{id}` | GET | `404 Not Found` | Singular path `listing` does not exist. Actual path is plural `GET /v1/listings/{id}`. | `missing_endpoint` |
| `GET /v1/listings/{id}` | GET | `200 OK` | Plural endpoint for single listing lookup. | `undocumented_endpoint` |
| `GET /v1/listings/{id}/similar` | GET | `404 Not Found` | Documented similar listings endpoint does not exist on live service. | `missing_endpoint` |
| `GET /v1/rentals` | GET | `200 OK` | Requires `X-API-Key` AND `Authorization: Bearer <access_token>`. Uses `offset` and `limit` (max 50). | `auth`, `pagination` |
| `GET /v1/rentals/{id}` | GET | `200 OK` | Single rental lookup. | `auth` |
| `GET /v1/projects` | GET | `200 OK` | Requires `X-API-Key` AND `Authorization: Bearer <access_token>`. `price_min`/`price_max` reported in Lakhs/Crores. `total_listings` mismatches live count. | `auth`, `units`, `consistency` |
| `GET /v1/projects/{id}` | GET | `200 OK` | Single project lookup. | `auth`, `units` |
| `GET /v1/favourites` | GET | `404 Not Found` | Documented favourites endpoint does not exist. | `missing_endpoint` |
| `POST /v1/favourites` | POST | `404 Not Found` | Documented favourites endpoint does not exist. | `missing_endpoint` |
| `DELETE /v1/favourites/{id}` | DELETE | `404 Not Found` | Documented favourites endpoint does not exist. | `missing_endpoint` |
| `GET /v1/analytics/summary` | GET | `404 Not Found` | Documented analytics summary endpoint does not exist. | `missing_endpoint` |

---

## Detailed Findings

### 1. API Key Placement (`auth`)
- **Documented**: Query parameter `GET /v1/listings?api_key=IVY26-XXXXXXXXXXXX`
- **Actual**: The live API requires the key in header `X-API-Key: IVY26-XXXXXXXXXXXX`. Passing it in query param returns `401 Unauthorized`.

### 2. Bearer Token Requirement (`auth`)
- **Documented**: Query parameter `api_key` is used for all collection requests; user Bearer tokens are optional.
- **Actual**: All collection endpoints (`/v1/listings`, `/v1/rentals`, `/v1/projects`) return `401 Unauthorized` without a valid `Authorization: Bearer <access_token>` header.

### 3. Session Expiration & Refresh Flow (`auth`)
- **Documented**: Returns `token`, `expires_in: 86400` (24 hours). "There is no refresh flow."
- **Actual**: Returns `access_token`, `expires_in: 900` (15 minutes), `refresh_token`, and `refresh_url: "/auth/refresh"`. Active refresh works via `POST /auth/refresh`.

### 4. Offset vs Page Pagination (`pagination`)
- **Documented**: Uses `page` (1-indexed) and `limit` (max 200). Response returns `total`, `page`, `page_size`, `results`.
- **Actual**: Uses 0-indexed `offset` and `limit` (capped at max 50 items per page). Passing `page` is ignored when `limit` is passed. Response metadata returns `limit`, `offset`, `count`, `total`, `has_more`, `results`.

### 5. Retrievable Records vs Metadata Total (`completeness`)
- **Documented**: `total` field reports exact matching records.
- **Actual**: Metadata `total` reports 3736 records, but paging to the end yields **4100 retrievable listing records**.

### 6. Unit Discrepancies (`units`)
- **Projects**: `price_min` and `price_max` are reported as floats in Crores (for values < 15.0) or Lakhs (for values >= 15.0) rather than integer Rupees. (e.g. `P40224` reports `price_max: 3.78`, which is ₹3.78 Crores = ₹37,800,000 INR).
- **MagicHomes Listings**: Carpet area and super built-up area for listings from website `magichomes` are reported in **square meters** (sq m) instead of square feet (sq ft) (e.g. 111 sq m for a 3 BHK apartment).

### 7. Data Quality / Corrupt Listings (`data_quality`)
- Exactly **27 listing records** describe physically impossible properties:
  - 9 records with `floor > total_floors` (e.g., floor 19 in a 12-floor building)
  - 9 records with negative price (e.g. price -13,360,000 INR)
  - 9 records with `carpet_area > super_built_up_area` (e.g. carpet 2965 sqft vs super 2114 sqft)

### 8. Fraud / Fake Lead-Generation Listings (`fraud`)
- Exactly **228 listing records** belong to **12 lead-generation phone numbers** that re-use 3 to 6 fake contact persona names across 7 to 10 localities to generate fake inquiries.

### 9. Project Listing Count Inconsistency (`consistency`)
- Project inventory metadata (`project.total_listings`) disagrees with the actual number of listings referencing that project ID for **336 out of 460 projects**.
