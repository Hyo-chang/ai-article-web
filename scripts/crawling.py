#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import json
import random
import re
import time
import os
import sys
from dataclasses import dataclass, replace
from datetime import datetime, timedelta
from typing import Any, Dict, Iterable, List, Optional, Tuple
from urllib.parse import parse_qs, urlparse, urljoin

import requests
from bs4 import BeautifulSoup
from bs4.element import Tag
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from dotenv import load_dotenv

# --- rag-ai 폴더의 NewsKeywordExtractor를 가져오기 위해 경로 추가 ---
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'rag-ai'))
try:
    from news_keyword_extractor import NewsKeywordExtractor
except ImportError:
    print("❌ 'rag-ai/news_keyword_extractor.py'를 찾을 수 없습니다. 경로를 확인해주세요.")
    NewsKeywordExtractor = None

# ====================================================================
# 🔑 네이버 API 키 (환경 변수 또는 .env 파일에서 불러오기)
# ====================================================================
# 스크립트 위치 기준으로 상위 폴더의 rag-ai/.env 파일을 로드
dotenv_path = os.path.join(os.path.dirname(__file__), '..', 'rag-ai', '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)

NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_PASSWD", "") # 변수명 수정

# ====================================================================
# 🧩 선택자 (사이트 구조 변경 시 여기 수정)
# ====================================================================
DEFAULT_TITLE_SELECTORS = ("h2.media_end_head_headline", "h1.media_end_head_headline", "meta[property='og:title']")
DEFAULT_BODY_SELECTORS = ("div#newsct_article", "article#dic_area")
DEFAULT_PHOTO_CAPTION_SELECTORS = (
    ".end_photo_caption", ".end_photo_origin", ".end_photo_origin_source", ".photo_viewer_title",
    ".photo_viewer_origin", ".media_end_head_origin_photo", ".media_end_head_origin_image", ".photo_desc",
    ".img_desc", ".figure_caption", "figcaption",
)
IMAGE_CANDIDATE_ATTRS = ("src", "data-src", "data-lazy-src", "data-original")
DEFAULT_META_TIME_SELECTORS = ("meta[property='article:published_time']", "meta[property='og:article:published_time']", "meta[name='ptime']", "meta[name='date']")
DEFAULT_TIME_SELECTORS = ("span.media_end_head_info_datestamp_time", "em.media_end_head_info_datestamp_time")
DEFAULT_TIME_ATTRS = ("data-date-time", "data-true-date-time", "data-txtexp-time", "datetime")

# ====================================================================
# 🧱 데이터 클래스
# ====================================================================
@dataclass
class Config:
    keywords: List[str]
    max_articles_per_keyword: int
    total_phases: int
    backend_endpoint: str
    timeout: int
    wait_min: int
    wait_max: int
    sleep_min: float
    sleep_max: float
    user_agent: str
    accept_language: str
    referer: str
    max_retries: int
    loop: bool
    dry_run: bool
    debug_save_page: bool
    article_url: Optional[str] = None

@dataclass(frozen=True)
class DomainProfile:
    name: str
    title_selectors: Tuple[str, ...]
    body_selectors: Tuple[str, ...]
    photo_caption_selectors: Tuple[str, ...] = DEFAULT_PHOTO_CAPTION_SELECTORS
    meta_time_selectors: Tuple[str, ...] = DEFAULT_META_TIME_SELECTORS
    time_selectors: Tuple[str, ...] = DEFAULT_TIME_SELECTORS
    time_attr_candidates: Tuple[str, ...] = DEFAULT_TIME_ATTRS
    publisher_selectors: Tuple[str, ...] = ("meta[property='og:site_name']", "meta[property='og:article:author']")
    referer: Optional[str] = None
    user_agent: Optional[str] = None


GENERIC_PROFILE = DomainProfile(
    name="GENERIC",
    title_selectors=(
        "h1",
        "meta[property='og:title']",
        "title",
    ),
    body_selectors=(
        "article",
        "div.article-body",
        "div#articleBody",
        "div#newsct_article",
    ),
)

NAVER_PROFILE = DomainProfile(
    name="NAVER",
    title_selectors=DEFAULT_TITLE_SELECTORS,
    body_selectors=DEFAULT_BODY_SELECTORS,
    referer="https://news.naver.com/",
)

YONHAP_PROFILE = DomainProfile(
    name="YONHAP",
    title_selectors=(
        "h1.tit",
        "h1.tit-article",
        "div.article-tit h1",
        "meta[property='og:title']",
    ),
    body_selectors=(
        "div.article-body",
        "article.story-news",
        "div.story-news.article",
        "div#articleBody",
        "div.article-txt",
    ),
    photo_caption_selectors=DEFAULT_PHOTO_CAPTION_SELECTORS + (
        "p.figcaption",
        ".photo-caption",
    ),
    meta_time_selectors=DEFAULT_META_TIME_SELECTORS + (
        "meta[property='article:published_time']",
        "meta[name='ptime']",
        "meta[name='pubdate']",
        "meta[name='Date']",
    ),
    time_selectors=(
        "p.update-time",
        "div.article-tit span.txt-time",
        "span.update-time",
        "span.t11",
        "div.write-time",
    ),
    time_attr_candidates=("data-time", "datetime"),
    referer="https://www.yna.co.kr/",
)

JOONGANG_PROFILE = DomainProfile(
    name="JOONGANG",
    title_selectors=(
        "h1#article_title",
        "h1.article_title",
        "div.article_head h1",
        "meta[property='og:title']",
    ),
    body_selectors=(
        "div#article_body",
        "div.article_body",
        "div#article_body_content",
        "section#article_body",
        "article#article-view-content-div",
    ),
    photo_caption_selectors=DEFAULT_PHOTO_CAPTION_SELECTORS + (
        "span.caption",
        "p.caption",
    ),
    meta_time_selectors=DEFAULT_META_TIME_SELECTORS + (
        "meta[name='ptime']",
        "meta[name='datePublished']",
    ),
    time_selectors=(
        "div.article_info span.time",
        "div.article_writer span.time",
        "span.byline",
    ),
    time_attr_candidates=("data-time", "datetime"),
    referer="https://www.joongang.co.kr/",
)

CHOSUN_PROFILE = DomainProfile(
    name="CHOSUN",
    title_selectors=(
        "h1#title_text",
        "h1.news_tit",
        "div.news_title h1",
        "meta[property='og:title']",
    ),
    body_selectors=(
        "div#news_body_id",
        "section#news_body_id",
        "div.article-body",
        "div.article-body-wrap",
    ),
    photo_caption_selectors=DEFAULT_PHOTO_CAPTION_SELECTORS + (
        "em.cap",
        "span.cap",
    ),
    meta_time_selectors=DEFAULT_META_TIME_SELECTORS + (
        "meta[name='datePublished']",
        "meta[name='pubdate']",
    ),
    time_selectors=(
        "div.news_date",
        "p.news_date",
        "span.print_date",
        "div.byline span",
    ),
    time_attr_candidates=("data-time", "datetime"),
    referer="https://www.chosun.com/",
)

ECONOVILL_PROFILE = DomainProfile(
    name="ECONOVILL",
    title_selectors=(
        "header.article-view-header h3.heading",
        "meta[property='og:title']",
    ),
    body_selectors=("article#article-view-content-div",),
)

AMENEWS_PROFILE = DomainProfile(
    name="AMENEWS",
    title_selectors=("meta[property='og:title']", "div.titleWrap strong", "title"),
    body_selectors=("div#viewContent",),
    time_selectors=("div.registModifyDate li span",),
)

WIKITREE_PROFILE = DomainProfile(
    name="WIKITREE",
    title_selectors=("meta[property='og:title']",),
    body_selectors=("div#wikicon",),
    meta_time_selectors=("meta[property='article:published_time']",),
)

PRESS9_PROFILE = DomainProfile(
    name="PRESS9",
    title_selectors=("meta[property='og:title']", "h3.heading"),
    body_selectors=("div[itemprop='articleBody']",),
    meta_time_selectors=("meta[property='article:published_time']",),
)

AJUNEWS_PROFILE = DomainProfile(
    name="AJUNEWS",
    title_selectors=("meta[property='og:title']", "h1.tit_view"),
    body_selectors=("div[itemprop='articleBody']",),
    meta_time_selectors=("meta[property='article:published_time']",),
)

ZIKKIR_PROFILE = DomainProfile(
    name="ZIKKIR",
    title_selectors=("meta[property='og:title']", "h3.heading"),
    body_selectors=("article#article-view-content-div",),
    meta_time_selectors=("meta[property='article:published_time']",),
)

DEFAULT_PROFILE = GENERIC_PROFILE

HOST_PROFILES = {
    "news.naver.com": NAVER_PROFILE,
    "n.news.naver.com": NAVER_PROFILE,
    "media.naver.com": NAVER_PROFILE,
    "www.yna.co.kr": YONHAP_PROFILE,
    "yna.co.kr": YONHAP_PROFILE,
    "m.yna.co.kr": YONHAP_PROFILE,
    "www.joongang.co.kr": JOONGANG_PROFILE,
    "joongang.co.kr": JOONGANG_PROFILE,
    "news.joins.com": JOONGANG_PROFILE,
    "m.joongang.co.kr": JOONGANG_PROFILE,
    "www.chosun.com": CHOSUN_PROFILE,
    "chosun.com": CHOSUN_PROFILE,
    "news.chosun.com": CHOSUN_PROFILE,
    "www.econovill.com": ECONOVILL_PROFILE,
    "amenews.kr": AMENEWS_PROFILE,
    "www.wikitree.co.kr": WIKITREE_PROFILE,
    "www.press9.kr": PRESS9_PROFILE,
    "www.ajunews.com": AJUNEWS_PROFILE,
    "www.ziksir.com": ZIKKIR_PROFILE,
}


def _add_query_param(url: str, key: str, value: str) -> List[str]:
    parsed = urlparse(url)
    existing = parse_qs(parsed.query or "")
    if existing.get(key):
        return url
    new_query = parsed.query + ("&" if parsed.query else "") + f"{key}={value}"
    return parsed._replace(query=new_query).geturl()


def _chosun_variants(url: str) -> List[str]:
    parsed = urlparse(url)
    if "chosun.com" not in parsed.netloc:
        return []
    hosts = [parsed.netloc]
    if parsed.netloc != "www.chosun.com":
        hosts.append("www.chosun.com")
    if parsed.netloc != "news.chosun.com":
        hosts.append("news.chosun.com")
    variants: List[str] = []
    params = (("output", "1"), ("print", "1"), ("svc", "print"), ("view", "print"))
    for host in hosts:
        base = parsed._replace(netloc=host).geturl()
        variants.append(base)
        for key, value in params:
            variants.append(_add_query_param(base, key, value))
    return variants


def _dedupe_preserve(urls: Iterable[str]) -> List[str]:
    seen = set()
    result = []
    for u in urls:
        if not u or u in seen:
            continue
        seen.add(u)
        result.append(u)
    return result


def generate_article_variants(url: str, profile: DomainProfile) -> List[str]:
    variants = [url]
    if profile.name.upper() == "CHOSUN":
        variants.extend(_chosun_variants(url))
    return _dedupe_preserve(variants)


def _normalize_host(host: str) -> str:
    host = host.lower().split(":")[0]
    if host.startswith("www."):
        host = host[4:]
    return host


def resolve_profile(url: Optional[str]) -> DomainProfile:
    if not url:
        return DEFAULT_PROFILE
    host = _normalize_host(urlparse(url).netloc or "")
    for domain, profile in HOST_PROFILES.items():
        if host == _normalize_host(domain) or host.endswith("." + _normalize_host(domain)):
            return profile
    return DEFAULT_PROFILE

# ====================================================================
# 🔧 유틸 및 파싱 함수들
# ====================================================================

def create_session(cfg: Config) -> requests.Session:
    s = requests.Session()
    s.headers.update({"User-Agent": cfg.user_agent, "Accept-Language": cfg.accept_language, "Referer": cfg.referer})
    retry = Retry(total=cfg.max_retries, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    s.mount("https://", HTTPAdapter(max_retries=retry))
    s.mount("http://", HTTPAdapter(max_retries=retry))
    return s

def fetch_page(session: requests.Session, url: str, cfg: Config, profile: Optional[DomainProfile] = None) -> requests.Response:
    ua = (profile.user_agent or cfg.user_agent) if profile else cfg.user_agent
    ref = (profile.referer or cfg.referer) if profile else cfg.referer
    session.headers.update({"User-Agent": ua, "Referer": ref})
    time.sleep(random.uniform(cfg.sleep_min, cfg.sleep_max))
    r = session.get(url, timeout=cfg.timeout)
    r.raise_for_status()
    return r

def to_iso(dt: Optional[datetime]) -> Optional[str]:
    if dt is None: return None
    if dt.tzinfo is not None: dt = dt.astimezone().replace(tzinfo=None)
    return dt.replace(microsecond=0).isoformat()

def _parse_datetime_string(raw: Optional[str]) -> Optional[datetime]:
    if not raw: return None
    raw = raw.strip()
    if not raw: return None
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError: pass
    text = re.sub(r"(입력|수정)\s*", "", raw)
    m = re.search(r"(20\d{2})[.\-](\d{2})[.\-](\d{2}).*?(오전|오후)?\s*(\d{1,2}):(\d{2})", text)
    if m:
        year, month, day, period, hour, minute = m.groups()
        hour = int(hour)
        if period == "오후" and hour != 12: hour += 12
        if period == "오전" and hour == 12: hour = 0
        return datetime(int(year), int(month), int(day), hour, int(minute))
    return None

def parse_published_at(soup: BeautifulSoup, profile: DomainProfile) -> Optional[datetime]:
    for selector in profile.meta_time_selectors:
        meta = soup.select_one(selector)
        if meta and meta.get("content"):
            dt = _parse_datetime_string(meta.get("content"))
            if dt: return dt
    for selector in profile.time_selectors:
        el = soup.select_one(selector)
        if el:
            for attr in profile.time_attr_candidates:
                if el.get(attr):
                    dt = _parse_datetime_string(el.get(attr))
                    if dt: return dt
            dt = _parse_datetime_string(el.get_text(" ", strip=True))
            if dt: return dt
    return None

def _title_text(el: Optional[Tag]) -> str:
    if el is None: return ""
    return (el.get("content") or "").strip() if el.name == "meta" else el.get_text(strip=True)

def pick_first(soup: BeautifulSoup, selectors: Iterable[str]) -> Optional[Tag]:
    for selector in selectors:
        if el := soup.select_one(selector):
            return el
    return None

def extract_body_text(body_el: Optional[Tag], profile: DomainProfile) -> str:
    if body_el is None: return ""
    for tag in body_el.find_all(["script", "style", "iframe", "div.related-article", "div.ad_wrap", "aside"]): tag.decompose()
    for selector in profile.photo_caption_selectors:
        for caption in body_el.select(selector): caption.decompose()
    for br in body_el.find_all("br"): br.replace_with("\n")
    body = body_el.get_text("\n", strip=True)
    return re.sub(r"\n{3,}", "\n\n", body)

def extract_image_url(soup: BeautifulSoup) -> Optional[str]:
    """기사의 대표 이미지 URL을 추출합니다."""
    # 1순위: og:image 메타 태그 (가장 안정적)
    og_image = soup.select_one("meta[property='og:image']")
    if og_image and og_image.get("content"):
        og_url = og_image.get("content")
        # 네이버 기본 로고 이미지는 제외
        if "pstatic.net/static.news" not in og_url:
            return og_url

    # 2순위: 본문 내 첫 번째 이미지
    for selector in ("div#newsct_article img", "article#dic_area img", "div.article-body img"):
        img = soup.select_one(selector)
        if img:
            for attr in IMAGE_CANDIDATE_ATTRS:
                if img.get(attr):
                    return img.get(attr)

    return None

def parse_article_fields(article_url: str, soup: BeautifulSoup, profile: DomainProfile) -> Dict[str, Any]:
    title_el = pick_first(soup, profile.title_selectors)
    body_el = pick_first(soup, profile.body_selectors)
    publisher_el = pick_first(soup, profile.publisher_selectors)

    title = _title_text(title_el)
    body = extract_body_text(body_el, profile)
    publisher = _title_text(publisher_el)
    published_at = parse_published_at(soup, profile)
    image_url = extract_image_url(soup)

    return {"title": title, "body": body, "publisher": publisher, "published_at": published_at, "image_url": image_url}

# ====================================================================
# 🚚 백엔드 전송
# ====================================================================
def send_to_backend(session: requests.Session, cfg: Config, payload: Dict[str, Any]) -> bool:
    if cfg.dry_run:
        print("🧪 DRY-RUN (POST 생략):", payload.get("title"))
        return True
    try:
        res = session.post(cfg.backend_endpoint, json=payload, timeout=cfg.timeout)
        if res.status_code >= 400:
            print(f"❌ 서버 응답 내용 (상태 코드: {res.status_code}):")
            print(res.text)
        res.raise_for_status()
        print(f"📦 저장 완료: {payload.get('title')}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ 저장 실패: {e}")
        return False

# ====================================================================
# 🧠 API 기반 수집 및 처리 로직
# ====================================================================

def fetch_articles_from_naver_api(session: requests.Session, cfg: Config, keyword: str) -> List[Dict[str, Any]]:
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        print("❌ 네이버 API 클라이언트 ID 또는 시크릿이 설정되지 않았습니다.")
        return []

    print(f"🔍 API 검색: '{keyword}'")
    headers = {"X-Naver-Client-Id": NAVER_CLIENT_ID, "X-Naver-Client-Secret": NAVER_CLIENT_SECRET}
    params = {"query": keyword, "display": cfg.max_articles_per_keyword, "start": 1, "sort": "date"}
    try:
        res = session.get("https://openapi.naver.com/v1/search/news.json", headers=headers, params=params, timeout=cfg.timeout)
        res.raise_for_status()
        data = res.json()
        # 네이버 뉴스 URL(n.news.naver.com)이 있는 기사만 필터링 (HTML 구조 통일)
        articles = [
            item for item in data.get("items", [])
            if item.get("link") and "n.news.naver.com" in item.get("link", "")
        ]
        print(f"  ➡️ API 응답: {len(articles)}개 네이버 뉴스 기사 발견")
        return articles
    except requests.exceptions.RequestException as e:
        print(f"❌ API 요청 실패: {e}")
        return []

def process_article(session: requests.Session, cfg: Config, article_api_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    # 네이버 뉴스 URL 사용 (HTML 구조 통일)
    link = article_api_data.get("link")
    if not link: return None

    print(f"  C: GET article {link}")
    try:
        page_res = fetch_page(session, link, cfg, resolve_profile(link))
        page_html = page_res.text
        soup = BeautifulSoup(page_html, "lxml")
        
        parsed_data = parse_article_fields(link, soup, resolve_profile(link))
        
        title = parsed_data.get("title") or BeautifulSoup(article_api_data.get("title", ""), "html.parser").get_text(strip=True)
        body = parsed_data.get("body")
        
        if not body:
            print(f"  C ERR: 본문을 추출하지 못했습니다: {link}")
            return None
        
        payload = {
            "articleUrl": link,
            "title": title,
            "content": body,
            "publisher": parsed_data.get("publisher"),
            "publishedAt": to_iso(parsed_data.get("published_at") or _parse_datetime_string(article_api_data.get("pubDate"))),
            "contentCrawledAt": to_iso(datetime.utcnow()),
            "isFullContentCrawled": True,
            "image_url": parsed_data.get("image_url"),
        }
        
        return {"payload": payload, "html": page_html, "metadata": {}}

    except Exception as e:
        print(f"  C ERR: 기사 처리 중 오류 ({link}): {e}")
        if cfg.debug_save_page and 'page_html' in locals():
            with open("error_page.html", "w", encoding="utf-8") as f: f.write(page_html)
        return None

def crawl_with_api_2_phase(session: requests.Session, cfg: Config, keyword_extractor: Optional[NewsKeywordExtractor]):
    processed_urls = set()
    articles_for_phase2 = []

    print("\n--- 🟢 1단계 수집 시작 ---")
    for keyword in cfg.keywords:
        for article_api_data in fetch_articles_from_naver_api(session, cfg, keyword):
            url = article_api_data.get("link")
            if not url or url in processed_urls: continue
            processed_urls.add(url)
            
            result = process_article(session, cfg, article_api_data)
            if result:
                send_to_backend(session, cfg, result["payload"])
                if keyword_extractor:
                    articles_for_phase2.append(result)
        time.sleep(1)

    if not keyword_extractor or cfg.total_phases < 2 or not articles_for_phase2:
        print("\n--- ✅ 수집 완료 (1단계로 종료) ---")
        return

    print("\n--- 🟡 2단계 수집 시작 ---")
    phase2_keywords = set()
    print("   키워드 추출 중...")
    for article_data in articles_for_phase2:
        keywords = keyword_extractor.extract_keywords(article_data["html"], n=5, metadata=article_data["metadata"])
        for kw, score in keywords:
            if score > 0.3: phase2_keywords.add(kw)
    
    unique_new_keywords = list(phase2_keywords - set(cfg.keywords))
    if not unique_new_keywords:
        print("  추가적인 핵심 키워드가 발견되지 않았습니다.")
        print("\n--- ✅ 수집 완료 (2단계 생략) ---")
        return

    print(f"  2단계 수집을 위한 신규 키워드: {unique_new_keywords}")
    for keyword in unique_new_keywords:
        for article_api_data in fetch_articles_from_naver_api(session, cfg, keyword):
            url = article_api_data.get("link")
            if not url or url in processed_urls: continue
            processed_urls.add(url)
            
            result = process_article(session, cfg, article_api_data)
            if result:
                send_to_backend(session, cfg, result["payload"])
        time.sleep(1)

    print("\n--- ✅ 수집 완료 (2단계 종료) ---")

# ====================================================================
# 🚀 엔트리포인트(main)
# ====================================================================
def main():
    DEFAULTS = Config(
        keywords=["경제", "사회", "IT"],
        max_articles_per_keyword=5,
        total_phases=2,
        backend_endpoint="http://localhost:8080/api/articles/v2",
        timeout=300, wait_min=10, wait_max=20, sleep_min=1.0, sleep_max=3.0,
        user_agent="Mozilla/5.0", accept_language="ko-KR,ko;q=0.9",
        referer="https://news.naver.com/", max_retries=2,
        loop=False, dry_run=False, debug_save_page=False, article_url=None,
    )

    parser = argparse.ArgumentParser(description="Naver News API-based Crawler")
    parser.add_argument("--keywords", nargs="+", default=DEFAULTS.keywords, help="초기 검색 키워드 목록")
    parser.add_argument("--max-articles-per-keyword", type=int, default=DEFAULTS.max_articles_per_keyword)
    parser.add_argument("--total-phases", type=int, default=DEFAULTS.total_phases, help="키워드 확장 수집 단계 (1 또는 2)")
    parser.add_argument("--backend-endpoint", default=DEFAULTS.backend_endpoint)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--loop", action="store_true", help="주기적으로 반복 수집")
    parser.add_argument("--article-url", default=DEFAULTS.article_url, help="단일 기사 URL 직접 처리")
    parser.add_argument("--wait-min", type=int, default=DEFAULTS.wait_min)
    parser.add_argument("--wait-max", type=int, default=DEFAULTS.wait_max)

    args = parser.parse_args()
    
    cli_args = {k: v for k, v in vars(args).items() if v is not None}
    if not args.loop: #
        cli_args['loop'] = DEFAULTS.loop
    cfg = replace(DEFAULTS, **cli_args)
    
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        print("🚨 네이버 API 키가 설정되지 않았습니다. NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 환경변수를 설정해주세요.")
        sys.exit(1)

    session = create_session(cfg)

    # 2단계 수집 시에만 키워드 추출기 로드 (모델 로딩이 오래 걸림)
    keyword_extractor = None
    if cfg.total_phases > 1:
        if NewsKeywordExtractor:
            print("🔄 2단계 수집을 위해 키워드 추출기를 로드합니다...")
            keyword_extractor = NewsKeywordExtractor()
        else:
            print("⚠️ 2단계 수집을 위해 'news_keyword_extractor'가 필요하지만, 로드에 실패했습니다. 1단계 수집만 진행합니다.")
            cfg = replace(cfg, total_phases=1)
        
    def crawl_job():
        if cfg.article_url:
            print("▶ 단일 기사 모드 실행")
            result = process_article(session, cfg, {"originallink": cfg.article_url})
            if result:
                send_to_backend(session, cfg, result["payload"])
        else:
            crawl_with_api_2_phase(session, cfg, keyword_extractor)

    if not cfg.loop:
        crawl_job()
    else:
        try:
            while True:
                crawl_job()
                wait = random.randint(cfg.wait_min, cfg.wait_max)
                print(f"⏳ 다음 주기까지 {wait}초 대기...")
                time.sleep(wait)
        except KeyboardInterrupt:
            print("\n👋 사용자 요청으로 종료합니다.")


if __name__ == "__main__":
    main()
