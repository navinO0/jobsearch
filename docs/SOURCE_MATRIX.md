# Source Matrix & Integration Registry

This document defines the 26 supported job sources, their integration methods, compliance status, credential requirements, and refresh policies.

## 1. Integration Status Definitions
- `API`: Direct, officially documented public or partner API.
- `RSS`: Permitted syndication feed.
- `SEARCH_PROVIDER`: Licensed search engine aggregator (e.g. SerpApi Google Jobs).
- `IMPORT`: User-uploaded CSV / manual URL ingestion.
- `PROVIDER_REQUIRED`: Requires partner credentials or search provider access; direct automated scraping without API is prohibited.

---

## 2. Comprehensive Source Matrix

| Source ID | Name | Category | Method | Status | Requires Credential | Refresh Policy | Notes |
|---|---|---|---|---|---|---|---|
| `serpapi_google_jobs` | Google Jobs | SEARCH | SEARCH_PROVIDER | ACTIVE | Yes (SerpApi Key) | Hourly / On-demand | Official Google Jobs aggregator proxy |
| `adzuna` | Adzuna | AGGREGATOR | API | ACTIVE | Yes (App ID + Key) | Hourly | Global coverage, strong salary data |
| `jooble` | Jooble | AGGREGATOR | API | ACTIVE | Yes (API Key) | Hourly | Broad international and Indian job feeds |
| `greenhouse` | Greenhouse | ATS | API | ACTIVE | No (Public Boards) | Hourly | Public company job board API |
| `lever` | Lever | ATS | API | ACTIVE | No (Public Postings) | Hourly | Public company posting JSON feed |
| `ashby` | Ashby | ATS | API | ACTIVE | No (Public Postings) | Hourly | Public posting API for fast-growing startups |
| `workable` | Workable | ATS | API | ACTIVE | No (Public Postings) | Hourly | Widget/posting feeds for tech companies |
| `smartrecruiters` | SmartRecruiters | ATS | API | ACTIVE | No (Public Postings) | Hourly | Enterprise & scale-up public postings |
| `recruitee` | Recruitee | ATS | API | ACTIVE | No (Public Postings) | Hourly | Careers API for mid-market and startups |
| `teamtailor` | Teamtailor | ATS | API | ACTIVE | No (Public Feeds) | Hourly | European & global tech companies |
| `arbeitnow` | Arbeitnow | AGGREGATOR | API | ACTIVE | No | Hourly | Remote & European tech jobs API |
| `jobicy` | Jobicy | REMOTE | API | ACTIVE | No | Hourly | Remote developer jobs API |
| `himalayas` | Himalayas | REMOTE | API | ACTIVE | No | Hourly | Remote jobs API with rich salary/tech data |
| `remotive` | Remotive | REMOTE | API | ACTIVE | No | Hourly | Curated remote tech jobs |
| `remoteok` | RemoteOK | REMOTE | RSS / API | ACTIVE | No | Daily | Remote tech roles RSS/JSON feed |
| `naukri` | Naukri | PORTAL | IMPORT / PROVIDER_REQUIRED | MANUAL | No direct API | On-demand / CSV | Automated scraping prohibited; use CSV / URL |
| `linkedin` | LinkedIn Jobs | PORTAL | IMPORT / SEARCH_PROVIDER | MANUAL | No direct API | On-demand / CSV | Use SerpApi or direct URL ingestion |
| `indeed` | Indeed | PORTAL | IMPORT / SEARCH_PROVIDER | MANUAL | Partner API req. | On-demand / CSV | Use SerpApi or direct URL ingestion |
| `foundit` | Foundit (Monster) | PORTAL | IMPORT / PROVIDER_REQUIRED | MANUAL | No direct API | On-demand / CSV | Use CSV or user-provided URL |
| `instahyre` | Instahyre | PORTAL | IMPORT / PROVIDER_REQUIRED | MANUAL | Auth required | On-demand / CSV | Ingest via authenticated webhook or CSV |
| `cutshort` | Cutshort | PORTAL | IMPORT / PROVIDER_REQUIRED | MANUAL | No direct API | On-demand / CSV | Ingest via manual URL or CSV |
| `hirist` | Hirist | PORTAL | IMPORT / PROVIDER_REQUIRED | MANUAL | No direct API | On-demand / CSV | High-tech Indian job portal; import via CSV |
| `iimjobs` | iimjobs | PORTAL | IMPORT / PROVIDER_REQUIRED | MANUAL | No direct API | On-demand / CSV | Management/tech roles; import via CSV |
| `shine` | Shine | PORTAL | IMPORT / PROVIDER_REQUIRED | MANUAL | No direct API | On-demand / CSV | Import via CSV / direct URL |
| `wellfound` | Wellfound (AngelList) | STARTUP | IMPORT / SEARCH_PROVIDER | MANUAL | Partner API req. | On-demand / CSV | Startup job search via URL or search API |
| `internshala` | Internshala | PORTAL | IMPORT / PROVIDER_REQUIRED | MANUAL | No direct API | On-demand / CSV | Entry-level & internships via CSV |

---

## 3. Compliance and Ethical Automation Rules
1. **Zero Bot-Scraping / Circumvention Policy**: No stealth browser automation, cookie farming, or CAPTCHA bypass scripts are deployed against job portals.
2. **Graceful Degraded Execution**: If a credentialed source (e.g. Adzuna, SerpApi) runs out of quota or fails, the orchestrator continues with remaining sources without halting the search run.
3. **Canonical Normalization**: Every source adapter outputs identical normalized schema records to guarantee predictable downstream matching and document generation.
