#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import json
import random
import re
import time
from dataclasses import dataclass, replace
from datetime import datetime, timedelta
from typing import Any, Dict, Iterable, List, Optional, Tuple
from urllib.parse import parse_qs, urlparse, urljoin  # ✅ urljoin 추가

import requests
from bs4 import BeautifulSoup
from bs4.element import Tag
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ====================================================================
# 🧩 선택자 (사이트 구조 변경 시 여기 수정)
# ====================================================================
DEFAULT_SECTION_ITEM_SELECTOR = "ul.sa_list li"
DEFAULT_ARTICLE_LINK_SELECTOR = "div.sa_text a.sa_text_title"
DEFAULT_TITLE_SELECTORS = (
    "h2.media_end_head_headline",
    "h1.media_end_head_headline",
    "meta[property='og:title']",
)
DEFAULT_BODY_SELECTORS = (
    "div#newsct_article",
    "article#dic_area",
)
DEFAULT_PHOTO_CAPTION_SELECTORS = (
    ".end_photo_caption",
    ".end_photo_origin",
    ".end_photo_origin_source",
    ".photo_viewer_title",
    ".photo_viewer_origin",
    ".media_end_head_origin_photo",
    ".media_end_head_origin_image",
    ".photo_desc",
    ".img_desc",
    ".figure_caption",
    "figcaption",
)

# 본문 이미지 탐색 시 고려할 속성들
IMAGE_CANDIDATE_ATTRS = ("src", "data-src", "data-lazy-src", "data-original")

# ====================================================================
# 🧱 설정 데이터 클래스
# ====================================================================
@dataclass
class Config:
    section_url: str
    max_articles: int
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
    once: bool
    dry_run: bool
    top_n_from_latest: bool
    debug_save_section: bool
    article_url: Optional[str] = None


DEFAULT_META_TIME_SELECTORS = (
    "meta[property='article:published_time']",
    "meta[property='og:article:published_time']",
    "meta[name='ptime']",
    "meta[name='date']",
)

DEFAULT_TIME_SELECTORS = (
    "span.media_end_head_info_datestamp_time",
    "em.media_end_head_info_datestamp_time",
)

DEFAULT_TIME_ATTRS = (
    "data-date-time",
    "data-true-date-time",
    "data-txtexp-time",
    "datetime",
)


@dataclass(frozen=True)
class DomainProfile:
    name: str
    title_selectors: Tuple[str, ...]
    body_selectors: Tuple[str, ...]
    photo_caption_selectors: Tuple[str, ...] = DEFAULT_PHOTO_CAPTION_SELECTORS
    section_item_selector: Optional[str] = None
    article_link_selector: Optional[str] = None
    meta_time_selectors: Tuple[str, ...] = DEFAULT_META_TIME_SELECTORS
    time_selectors: Tuple[str, ...] = DEFAULT_TIME_SELECTORS
    time_attr_candidates: Tuple[str, ...] = DEFAULT_TIME_ATTRS
    publisher_selectors: Tuple[str, ...] = (
        "meta[property='og:article:author']",
        "meta[property='og:site_name']",
    )
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
    photo_caption_selectors=DEFAULT_PHOTO_CAPTION_SELECTORS,
    section_item_selector=DEFAULT_SECTION_ITEM_SELECTOR,
    article_link_selector=DEFAULT_ARTICLE_LINK_SELECTOR,
)

NAVER_PROFILE = DomainProfile(
    name="NAVER",
    title_selectors=DEFAULT_TITLE_SELECTORS,
    body_selectors=DEFAULT_BODY_SELECTORS,
    photo_caption_selectors=DEFAULT_PHOTO_CAPTION_SELECTORS,
    section_item_selector=DEFAULT_SECTION_ITEM_SELECTOR,
    article_link_selector=DEFAULT_ARTICLE_LINK_SELECTOR,
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
    meta_time_selectors=(
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
}


def _add_query_param(url: str, key: str, value: str) -> str:
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


def pick_first(soup: BeautifulSoup, selectors: Iterable[str]) -> Optional[Tag]:
    for selector in selectors:
        if not selector:
            continue
        el = soup.select_one(selector)
        if el:
            return el
    return None


def apply_profile_headers(session: requests.Session, cfg: Config, profile: Optional[DomainProfile]) -> None:
    profile = profile or DEFAULT_PROFILE
    ua = profile.user_agent or cfg.user_agent
    if ua:
        session.headers["User-Agent"] = ua
    session.headers["Accept-Language"] = cfg.accept_language
    ref = profile.referer or cfg.referer
    if ref:
        session.headers["Referer"] = ref



def _parse_section_code_spec(spec: Optional[str]) -> List[str]:
    if not spec:
        return []
    codes: List[str] = []
    for raw in re.split(r"[,\s]+", spec):
        part = raw.strip()
        if not part:
            continue
        if "-" in part:
            start_str, end_str = part.split("-", 1)
            if start_str.isdigit() and end_str.isdigit():
                start, end = int(start_str), int(end_str)
                step = 1 if start <= end else -1
                for code in range(start, end + step, step):
                    codes.append(f"{code:03d}")
                continue
        if part.isdigit():
            codes.append(f"{int(part):03d}")
        else:
            codes.append(part)
    return codes


def build_section_urls(section_code_spec: Optional[str], fallback_url: str) -> List[str]:
    codes = _parse_section_code_spec(section_code_spec)
    if not codes:
        return [fallback_url]
    urls: List[str] = []
    for code in codes:
        if code.startswith("http"):
            urls.append(code)
        else:
            urls.append(f"https://news.naver.com/section/{code}")
    return urls


# ====================================================================
# 🔧 세션/네트워크 유틸
# ====================================================================
def create_session(cfg: Config) -> requests.Session:
    s = requests.Session()
    s.headers.update({
        "User-Agent": cfg.user_agent,
        "Accept-Language": cfg.accept_language,
        "Referer": cfg.referer,
    })
    retry = Retry(
        total=cfg.max_retries,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    s.mount("https://", HTTPAdapter(max_retries=retry))
    s.mount("http://", HTTPAdapter(max_retries=retry))
    return s


def fetch(
    session: requests.Session,
    url: str,
    cfg: Config,
    profile: Optional[DomainProfile] = None,
) -> requests.Response:
    """Session을 이용해 HTTP GET 요청을 보내고 응답을 반환."""
    apply_profile_headers(session, cfg, profile)
    time.sleep(random.uniform(cfg.sleep_min, cfg.sleep_max))  # 서버 부하 방지
    r = session.get(url, timeout=cfg.timeout)
    r.raise_for_status()
    return r


def to_iso(dt: Optional[datetime]) -> Optional[str]:
    if dt is None:
        return None
    if dt.tzinfo is not None:
        dt = dt.astimezone().replace(tzinfo=None)
    return dt.replace(microsecond=0).isoformat()


# ====================================================================
# 🗓️ 날짜/메타 파싱 유틸
# ====================================================================
def _parse_datetime_string(raw: Optional[str]) -> Optional[datetime]:
    """여러 포맷의 날짜 문자열을 datetime으로 변환."""
    if not raw:
        return None
    raw = raw.strip()
    if not raw:
        return None

    normalized = raw.replace("Z", "+00:00")
    candidates = [normalized]
    alt = normalized.replace(" ", "T", 1)
    if alt != normalized:
        candidates.append(alt)
    for c in candidates:
        try:
            return datetime.fromisoformat(c)
        except ValueError:
            pass

    # 예: 2024.01.25. 오후 3:40
    text = re.sub(r"(입력|수정)\s*", "", raw)
    pattern = re.compile(
        r"(20\d{2})[.\-](\d{2})[.\-](\d{2})"
        r"(?:[.\-])?\s*(오전|오후)?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?"
    )
    m = pattern.search(text)
    if m:
        year, month, day, period, hour, minute, second = m.groups()
        hour = int(hour)
        if period == "오전":
            hour = 0 if hour == 12 else hour
        elif period == "오후":
            hour = hour if hour == 12 else hour + 12
        second_val = int(second) if second else 0
        return datetime(int(year), int(month), int(day), hour, int(minute), second_val)

    return None


def _parse_relative_time_ko(txt: str) -> Optional[datetime]:
    """'3분 전', '2시간 전', '어제', '방금' 등 상대시각을 UTC 기준 절대시각으로 변환."""
    if not txt:
        return None
    now = datetime.utcnow()
    txt = txt.strip()
    m = re.search(r"(\d+)\s*분\s*전", txt)
    if m:
        return now - timedelta(minutes=int(m.group(1)))
    m = re.search(r"(\d+)\s*시간\s*전", txt)
    if m:
        return now - timedelta(hours=int(m.group(1)))
    m = re.search(r"(\d+)\s*일\s*전", txt)
    if m:
        return now - timedelta(days=int(m.group(1)))
    if "방금" in txt:
        return now
    if "어제" in txt:
        return now - timedelta(days=1)
    return None


def parse_section_published_at(item: Tag, profile: DomainProfile) -> Optional[datetime]:
    """섹션 목록 아이템에서 발행시각을 추출."""
    dt = _parse_datetime_string(item.get("data-time"))
    if dt:
        return dt

    time_el = item.select_one("span.sa_text_datetime") or item.select_one("time")
    if time_el is None:
        return None

    if hasattr(time_el, "get"):
        for attr in ("data-date-time", "data-true-date-time", "datetime"):
            dt = _parse_datetime_string(time_el.get(attr))
            if dt:
                return dt
        text = time_el.get_text(" ", strip=True)
    else:
        text = str(time_el)

    return _parse_relative_time_ko(text) or _parse_datetime_string(text)


def parse_published_at(soup: BeautifulSoup, profile: DomainProfile) -> Optional[datetime]:
    """상세 페이지 메타/시간 태그에서 발행시각 추출."""
    for selector in profile.meta_time_selectors or DEFAULT_META_TIME_SELECTORS:
        meta = soup.select_one(selector)
        if meta:
            dt = _parse_datetime_string(meta.get("content"))
            if dt:
                return dt

    time_selectors = profile.time_selectors or DEFAULT_TIME_SELECTORS
    attr_candidates = profile.time_attr_candidates or DEFAULT_TIME_ATTRS
    for selector in time_selectors:
        el = soup.select_one(selector)
        if not el:
            continue
        for attr in attr_candidates:
            dt = _parse_datetime_string(el.get(attr))
            if dt:
                return dt
        dt = _parse_datetime_string(el.get_text(" ", strip=True))
        if dt:
            return dt
    return None


def parse_publisher(soup: BeautifulSoup, profile: DomainProfile) -> Optional[str]:
    meta = pick_first(soup, profile.publisher_selectors)
    content = meta.get("content") if meta else None
    return content.strip() if content else None


def _title_text(el: Optional[Tag]) -> str:
    if el is None:
        return "(제목 없음)"
    if el.name == "meta":
        return (el.get("content") or "").strip() or "(제목 없음)"
    return el.get_text(strip=True) or "(제목 없음)"


def extract_body_text(body_el: Optional[Tag], profile: DomainProfile) -> str:
    if body_el is None:
        return ""
    for tag in body_el.find_all(["script", "iframe", "div.related-article"]):
        tag.decompose()
    caption_selectors = profile.photo_caption_selectors or DEFAULT_PHOTO_CAPTION_SELECTORS
    for selector in caption_selectors:
        for caption in body_el.select(selector):
            caption.decompose()
    for br in body_el.find_all("br"):
        br.replace_with("\n")
    body = body_el.get_text("\n", strip=True)
    return re.sub(r"\n{3,}", "\n\n", body)


def _balanced_json_extract(source: str, marker: str) -> Optional[str]:
    if not source:
        return None
    marker_idx = source.find(marker)
    if marker_idx == -1:
        return None
    start = source.find("{", marker_idx)
    if start == -1:
        return None
    depth = 0
    in_string = False
    escape = False
    for idx in range(start, len(source)):
        ch = source[idx]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
        else:
            if ch == '"':
                in_string = True
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return source[start : idx + 1]
    return None


def _chosun_clean_text_fragment(text: Optional[str]) -> str:
    if not text:
        return ""
    fragment = BeautifulSoup(text, "lxml")
    for br in fragment.find_all("br"):
        br.replace_with("\n")
    cleaned = fragment.get_text("\n", strip=True)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def _chosun_collect_text_from_element(element: Any) -> List[str]:
    parts: List[str] = []
    if isinstance(element, list):
        for sub in element:
            parts.extend(_chosun_collect_text_from_element(sub))
        return parts

    if isinstance(element, dict):
        etype = element.get("type")
        if etype in {"text", "raw_html", "header", "correction"}:
            cleaned = _chosun_clean_text_fragment(element.get("content"))
            if cleaned:
                parts.append(cleaned)
        elif etype == "list":
            for item in element.get("items") or []:
                if isinstance(item, dict):
                    cleaned = _chosun_clean_text_fragment(
                        item.get("content") or item.get("text")
                    )
                else:
                    cleaned = _chosun_clean_text_fragment(str(item))
                if cleaned:
                    parts.append(cleaned)
        elif etype == "quote":
            for key in ("content", "citation"):
                cleaned = _chosun_clean_text_fragment(element.get(key))
                if cleaned:
                    parts.append(cleaned)

        nested = element.get("content_elements") if isinstance(element, dict) else None
        if nested:
            for child in nested:
                parts.extend(_chosun_collect_text_from_element(child))
    elif isinstance(element, str):
        cleaned = _chosun_clean_text_fragment(element)
        if cleaned:
            parts.append(cleaned)
    return parts


def _chosun_collect_text_from_elements(elements: Any) -> str:
    if not elements:
        return ""
    parts = _chosun_collect_text_from_element(elements)
    parts = [p for p in parts if p]
    return "\n\n".join(parts).strip()


def _chosun_extract_image_from_item(item: Optional[Dict[str, Any]]) -> Optional[str]:
    if not isinstance(item, dict):
        return None
    url = item.get("url") or item.get("resized_url")
    if url:
        return url
    resized = item.get("resized_urls")
    if isinstance(resized, list):
        for candidate in resized:
            if isinstance(candidate, dict):
                src = candidate.get("src") or candidate.get("url")
            else:
                src = candidate
            if src:
                return src
    additional = item.get("additional_properties")
    if isinstance(additional, dict):
        for key in ("fullSizeResizeUrl", "originalUrl"):
            if additional.get(key):
                return additional[key]
    streams = item.get("streams")
    if isinstance(streams, list):
        for stream in streams:
            if isinstance(stream, dict):
                src = stream.get("url") or stream.get("stream")
            else:
                src = stream
            if src:
                return src
    return None


def _chosun_extract_image_url(payload: Dict[str, Any]) -> Optional[str]:
    promo = payload.get("promo_items")
    if not isinstance(promo, dict):
        return None
    priority = ("lead_art", "basic", "square1", "square2", "default")
    for key in priority:
        candidate = promo.get(key)
        image = _chosun_extract_image_from_item(candidate)
        if image:
            return image
    for candidate in promo.values():
        image = _chosun_extract_image_from_item(candidate)
        if image:
            return image
    return None


def _chosun_extract_image_from_elements(elements: Any) -> Optional[str]:
    if isinstance(elements, list):
        for el in elements:
            url = _chosun_extract_image_from_elements(el)
            if url:
                return url
    elif isinstance(elements, dict):
        if elements.get("type") == "image":
            url = _chosun_extract_image_from_item(elements)
            if url:
                return url
        for key in ("content_elements", "items", "children"):
            nested = elements.get(key)
            if nested:
                url = _chosun_extract_image_from_elements(nested)
                if url:
                    return url
    return None


def extract_chosun_fusion_data(soup: BeautifulSoup) -> Dict[str, Any]:
    script = soup.find("script", id="fusion-metadata")
    if not script:
        return {}
    script_text = script.string or script.get_text()
    blob = _balanced_json_extract(script_text or "", "Fusion.globalContent")
    if not blob:
        return {}
    try:
        payload = json.loads(blob)
    except json.JSONDecodeError:
        return {}

    body = _chosun_collect_text_from_elements(payload.get("content_elements"))
    image_url = _chosun_extract_image_url(payload)
    if not image_url:
        image_url = _chosun_extract_image_from_elements(payload.get("content_elements"))
    published_raw = _first_value(
        payload.get("publish_date"),
        payload.get("display_date"),
        payload.get("last_updated_date"),
    )
    published_at = _parse_datetime_string(published_raw)
    title = _first_value(
        (payload.get("headlines") or {}).get("basic"),
        (payload.get("promo_headlines") or {}).get("basic"),
        payload.get("title"),
    )
    publisher = _first_value(
        (payload.get("source") or {}).get("system"),
        (payload.get("source") or {}).get("name"),
        (payload.get("owner") or {}).get("name"),
        "조선일보",
    )

    result: Dict[str, Any] = {}
    if body:
        result["body"] = body
    if image_url:
        result["image_url"] = image_url
    if published_at:
        result["published_at"] = published_at
    if title:
        result["title"] = title
    if publisher:
        result["publisher"] = publisher
    return result


def parse_article_fields(article_url: str, soup: BeautifulSoup, profile: DomainProfile) -> Dict[str, Any]:
    title_el = pick_first(soup, profile.title_selectors or DEFAULT_TITLE_SELECTORS)
    body_el = pick_first(soup, profile.body_selectors or DEFAULT_BODY_SELECTORS)
    body = extract_body_text(body_el, profile)
    image_url = extract_main_image_url(article_url, soup, profile, body_el)
    published_at = parse_published_at(soup, profile)
    publisher = parse_publisher(soup, profile)

    fusion_data: Dict[str, Any] = {}
    if profile.name.upper() == "CHOSUN":
        fusion_data = extract_chosun_fusion_data(soup)
        if not body:
            body = fusion_data.get("body", "")
        if not image_url:
            image_url = fusion_data.get("image_url")
        if not published_at:
            published_at = fusion_data.get("published_at")
        if not publisher:
            publisher = fusion_data.get("publisher")

    title = _title_text(title_el)
    if not title and fusion_data:
        title = fusion_data.get("title")

    return {
        "title": title,
        "body": body,
        "image_url": image_url,
        "published_at": published_at,
        "publisher": publisher,
    }


# ====================================================================
# 🏷️ 카테고리 코드(sid1-sid2)
# ====================================================================
def _first_value(*candidates: Optional[str]) -> Optional[str]:
    for c in candidates:
        if isinstance(c, list):
            for v in c:
                if v:
                    return v
        elif c:
            return c
    return None


def _extract_sid_from_section_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    m = re.search(r"/section/(\d+)", url)
    return m.group(1) if m else None


def extract_category_code(
    article_url: str,
    section_item: Optional[Tag],
    section_url: Optional[str],
    page_text: str,
) -> Optional[str]:
    parsed = urlparse(article_url)
    params = parse_qs(parsed.query)

    sid1 = _first_value(params.get("sid1"), params.get("sid"))
    sid2 = _first_value(params.get("sid2"))

    if not sid1 or not sid2:
        sid_pattern = re.compile(r'"sid(?P<idx>[12])"\s*:\s*"(?P<val>\d{3})"')
        for m in sid_pattern.finditer(page_text):
            if m.group("idx") == "1" and not sid1:
                sid1 = m.group("val")
            elif m.group("idx") == "2" and not sid2:
                sid2 = m.group("val")

    if section_item is not None:
        if not sid1:
            sid1 = _first_value(
                section_item.get("data-sid1"),
                section_item.get("data-sid"),
                section_item.get("data-section"),
            )
        if not sid2:
            sid2 = _first_value(
                section_item.get("data-sid2"),
                section_item.get("data-subsection"),
                section_item.get("data-subcategory"),
            )

    if not sid1:
        sid1 = _extract_sid_from_section_url(section_url)

    codes = [c for c in (sid1, sid2) if c]
    return "-".join(codes) if codes else None


# ====================================================================
# 🖼 대표 이미지 URL 추출
# ====================================================================
def extract_main_image_url(
    article_url: str,
    soup: BeautifulSoup,
    profile: DomainProfile,
    body_el: Optional[Tag] = None,
) -> Optional[str]:
    """
    본문(div#newsct_article) 내부의 이미지만 추출한다.
    - lazy 속성(src, data-src, data-lazy-src, data-original 등) 지원
    - 작은 이미지(아이콘/스프라이트) 및 광고성 후보를 제외
    - 가급적 가장 의미 있어 보이는(크기가 큰) 이미지를 우선 선택
    """
    body = body_el or pick_first(soup, profile.body_selectors)
    if not body:
        return None

    # 후보 수집
    IMAGE_CANDIDATE_ATTRS = ("src", "data-src", "data-lazy-src", "data-original", "data-image-src")
    candidates = []

    for img in body.find_all("img"):
        # 스킵 기준: 아이콘/스프라이트/이모지/투명 GIF 등
        cls = " ".join(img.get("class", [])).lower()
        alt = (img.get("alt") or "").lower()
        role = (img.get("role") or "").lower()

        if any(bad in cls for bad in ["icon", "sprite", "emoji", "emoticon", "thumb", "btn", "badge"]):
            continue
        if any(bad in alt for bad in ["이모지", "아이콘", "로고"]):
            continue
        if role in ("presentation", "none"):
            continue

        # URL 추출 (lazy 속성 포함)
        src = None
        for attr in IMAGE_CANDIDATE_ATTRS:
            val = img.get(attr)
            if val:
                src = val.strip()
                break
        if not src:
            continue

        # data:image 또는 svg/gif(투명/애니메이션 가능성) 제외
        if src.startswith("data:"):
            continue
        low = src.lower()
        if low.endswith(".svg") or low.endswith(".gif"):
            continue

        # 절대 URL로 보정
        from urllib.parse import urljoin
        abs_url = urljoin(article_url, src)

        # 가급적 큰 이미지를 뽑기 위해 width/height/size 힌트 수집
        def to_int(v):
            try:
                return int(re.sub(r"[^\d]", "", str(v or "")) or 0)
            except Exception:
                return 0

        width = to_int(img.get("width"))
        height = to_int(img.get("height"))

        # style="width:123px; height:45px"에서도 수치 추출
        style = img.get("style") or ""
        m_w = re.search(r"width\s*:\s*(\d+)", style)
        m_h = re.search(r"height\s*:\s*(\d+)", style)
        width = max(width, int(m_w.group(1)) if m_w else 0)
        height = max(height, int(m_h.group(1)) if m_h else 0)

        # 너무 작은 후보는 제거(예: 썸네일/아이콘)
        if width and height and (width < 120 or height < 80):
            continue

        # 후보 점수: 면적 우선
        score = (width * height) if (width and height) else 0
        candidates.append((score, abs_url))

    if not candidates:
        return None

    # 점수(대략적 크기) 기준 내림차순 정렬 후 최상위 반환
    candidates.sort(key=lambda x: x[0], reverse=True)
    return candidates[0][1]

# ====================================================================
# 🚚 백엔드 전송
# ====================================================================
def send_to_backend(session: requests.Session, cfg: Config, payload: Dict[str, Optional[str]]) -> bool:
    if cfg.dry_run:
        print("🧪 DRY-RUN (POST 생략)")
        return True
    try:
        apply_profile_headers(session, cfg, None)
        # data=payload 대신 json=payload를 사용하여 JSON으로 전송
        res = session.post(cfg.backend_endpoint, json=payload, timeout=cfg.timeout)
        res.raise_for_status()
        print("📦 저장 완료:", payload.get("title"))
        return True
    except Exception as e:
        print("❌ 저장 실패:", e)
        return False


# ====================================================================
# 🧠 섹션 수집 → 최신 정렬 → 상세 파싱
# ====================================================================
def collect_section_items(session: requests.Session, cfg: Config) -> Tuple[List[Tuple[Tag, Optional[datetime], Tag]], str]:
    print("A: GET section:", cfg.section_url)
    section_profile = resolve_profile(cfg.section_url)
    try:
        res = fetch(session, cfg.section_url, cfg, profile=section_profile)
        print("A1: STATUS", res.status_code, "len:", len(res.text))
    except Exception as e:
        print(f"A ERR: 섹션 페이지 요청 실패: {e}")
        return [], ""
    soup = BeautifulSoup(res.text, "lxml")

    items: List[Tuple[Tag, Optional[datetime], Tag]] = []
    section_selector = section_profile.section_item_selector or DEFAULT_SECTION_ITEM_SELECTOR
    article_selector = section_profile.article_link_selector or DEFAULT_ARTICLE_LINK_SELECTOR
    for li in soup.select(section_selector):
        a = li.select_one(article_selector)
        if not a:
            continue
        dt = parse_section_published_at(li, section_profile)
        items.append((a, dt, li))

    if cfg.debug_save_section:
        with open("section_debug.html", "w", encoding="utf-8") as f:
            f.write(res.text)
        print("📝 saved section_debug.html (디버그용)")

    print(f"B0: collected items: {len(items)}")
    return items, res.text


def process_article(
    session: requests.Session,
    cfg: Config,
    link: str,
    section_published_at: Optional[datetime] = None,
    section_item: Optional[Tag] = None,
) -> None:
    profile = resolve_profile(link)
    article_variants = generate_article_variants(link, profile)
    article_data: Optional[Dict[str, Any]] = None
    page_text = ""
    last_error: Optional[Exception] = None

    for candidate in article_variants:
        print(f"C: GET article {candidate}")
        try:
            page_text = fetch(session, candidate, cfg, profile=profile).text
        except Exception as e:
            print(f"C ERR: 기사 페이지 요청 실패 ({candidate}): {e}")
            last_error = e
            continue

        psoup = BeautifulSoup(page_text, "lxml")
        parsed = parse_article_fields(candidate, psoup, profile)
        parsed["page_text"] = page_text
        article_data = parsed
        if parsed.get("body"):
            break
        if profile.name.upper() == "CHOSUN":
            print("⚠️ 본문 추출 실패, 다른 보기 시도")

    if article_data is None:
        print(f"C ERR: 기사 페이지를 가져오지 못했습니다: {link} ({last_error})")
        return

    body = article_data.get("body") or ""
    if not body:
        print(f"C ERR: 본문을 추출하지 못했습니다: {link}")
        return

    title = article_data.get("title") or "(제목 없음)"
    image_url = article_data.get("image_url")
    page = article_data["page_text"]

    category_code = extract_category_code(link, section_item, cfg.section_url, page)

    print("=" * 80)
    print(title)
    print("len:", len(body))
    print(body[:200].replace("\n", " "))
    print("image_url:", image_url or "(없음)")
    print("=" * 80)

    published_at = (article_data.get("published_at") or section_published_at)
    content_crawled_at = datetime.utcnow()
    publisher = article_data.get("publisher")

    payload = {
        "articleUrl": link,
        "title": title,
        "content": body,
        "publisher": publisher,
        "categoryCode": category_code,
        "publishedAt": to_iso(published_at),
        "contentCrawledAt": to_iso(content_crawled_at),
        "isFullContentCrawled": "true" if body else "false",
        "image_url": image_url,
        "definition": None,
        "link": None,
        "word": None,
    }

    print("📄 PAYLOAD")
    print(json.dumps(payload, ensure_ascii=False, indent=2))

    send_to_backend(session, cfg, {k: v for k, v in payload.items() if v is not None})


def crawl_once(session: requests.Session, cfg: Config) -> None:
    if cfg.article_url:
        print("▶ 단일 기사 모드 실행")
        process_article(session, cfg, cfg.article_url.strip())
        return

    items, section_html = collect_section_items(session, cfg)
    if not items:
        print("B1: 섹션 아이템 없음 (선택자 점검 필요)")
        return

    # 최신순 정렬 (발행시각 없는 항목은 뒤로)
    if cfg.top_n_from_latest:
        def _sort_key(item: Tuple[Tag, Optional[datetime], Tag]):
            _a, _dt, _li = item
            return (_dt is not None, _dt or datetime.min)
        items.sort(key=_sort_key, reverse=True)

    # 상위 N개
    selected = items[: cfg.max_articles]
    print(f"B: selected top {len(selected)} by latest (Max {cfg.max_articles}개)")

    # 상세 파싱
    for i, (a, section_published_at, section_item) in enumerate(selected, 1):
        link = a.get("href")
        print(f"C{i}:")
        process_article(session, cfg, link, section_published_at, section_item)


# ====================================================================
# 🚀 엔트리포인트(main): 기본값 블록 + argparse
# ====================================================================
def build_arg_parser(defaults: Config) -> argparse.ArgumentParser:
    # argparse 파서 생성: CLI 도움말의 상단 설명 문구
    p = argparse.ArgumentParser(description="Naver News Latest Crawler")

    # ---- 기본 동작 파라미터들 (main()의 DEFAULTS 값을 기본으로 사용) ----
    # 수집 대상 섹션 URL (예: 정치=100, 경제=101 등)
    p.add_argument("--section-url", default=defaults.section_url)
    # 섹션 코드 목록(콤마/공백/구간 표기 지원) - 지정 시 위 URL 대신 여러 섹션 순회
    p.add_argument(
        "--section-codes",
        default=None,
        help="예) 100,101 또는 100-105 처럼 지정하면 여러 섹션을 순회합니다."
    )
    # 단일 기사 URL (지정 시 섹션 수집을 생략하고 해당 기사만 처리)
    p.add_argument("--article-url", default=defaults.article_url)
    # 섹션에서 최신순으로 수집할 기사 개수
    p.add_argument("--max-articles", type=int, default=defaults.max_articles)
    # 크롤링 결과를 POST할 스프링부트 백엔드 엔드포인트
    p.add_argument("--backend-endpoint", default=defaults.backend_endpoint)
    # HTTP 요청 타임아웃(초)
    p.add_argument("--timeout", type=int, default=defaults.timeout)
    # 반복 모드에서 루프 대기 시간 하한(초)
    p.add_argument("--wait-min", type=int, default=defaults.wait_min)
    # 반복 모드에서 루프 대기 시간 상한(초)하
    p.add_argument("--wait-max", type=int, default=defaults.wait_max)
    # 각 기사 요청 사이 랜덤 슬립 하한(초)
    p.add_argument("--sleep-min", type=float, default=defaults.sleep_min)
    # 각 기사 요청 사이 랜덤 슬립 상한(초)
    p.add_argument("--sleep-max", type=float, default=defaults.sleep_max)
    # HTTP 요청에 사용할 User-Agent 문자열
    p.add_argument("--user-agent", default=defaults.user_agent)
    # Accept-Language 헤더 값(한국어 우선)
    p.add_argument("--accept-language", default=defaults.accept_language)
    p.add_argument("--referer", default=defaults.referer)
    # 429/5xx 등에 대한 재시도 횟수
    p.add_argument("--max-retries", type=int, default=defaults.max_retries)

    # ---- 실행 모드: once vs loop (둘 중 하나만 설정 가능) ----
    mode = p.add_mutually_exclusive_group(required=False)  # 상호 배타적 그룹 생성
    # --once: 한 번만 수집하고 종료(플래그이므로 있으면 True, 없으면 False)
    mode.add_argument("--once", action="store_true", help="한 번만 수집하고 종료")
    # --loop: 일정 간격으로 반복 수집(플래그이므로 있으면 True, 없으면 False)
    mode.add_argument("--loop", action="store_true", help="주기적으로 반복 수집")

    # ---- 기타 토글/디버그 옵션 ----
    # --dry-run: 백엔드 POST를 실제로 보내지 않고 콘솔 출력만 수행
    p.add_argument("--dry-run", action="store_true", default=defaults.dry_run)
    # --top-n-from-latest: 최신순 정렬 후 상위 N개만 선택
    p.add_argument(
        "--top-n-from-latest",
        action="store_true" if defaults.top_n_from_latest else "store_false",
        help="최신순 정렬 후 상위 N개만 선택 (기본 True)"
    )
    # --debug-save-section: 섹션 HTML을 section_debug.html로 저장(선택자 점검용)
    p.add_argument("--debug-save-section", action="store_true", default=defaults.debug_save_section)

    # 완성된 파서 반환
    return p



def main():
    # =========================
    # 🧭 사용자 설정 기본값 블록
    # (여기만 고치면 됨 / CLI가 있으면 CLI가 우선)
    # =========================
    DEFAULTS = Config(
        # 100 정치, 101 경제, 102 사회, 103 생활/문화, 104 세계, 105 IT/과학 
        section_url="https://news.naver.com/section/100",
        max_articles=3,
        backend_endpoint="http://localhost:8080/api/articles",
        timeout=8,
        wait_min=10,
        wait_max=20,
        sleep_min=5.5,
        sleep_max=40.5,
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
        accept_language="ko-KR,ko;q=0.9,en-US;q=0.8",
        referer="https://news.naver.com/",
        max_retries=3,
        once=True,                 # 기본은 1회 실행
        dry_run=False,             # True면 POST 생략
        top_n_from_latest=True,    # 최신순 상위 N
        debug_save_section=False,  # 섹션 HTML 저장
        article_url=None,
    )

    parser = build_arg_parser(DEFAULTS)
    args = parser.parse_args()

    # CLI 반영해 최종 설정 구성
    cfg = Config(
        section_url=args.section_url,
        max_articles=args.max_articles,
        backend_endpoint=args.backend_endpoint,
        timeout=args.timeout,
        wait_min=args.wait_min,
        wait_max=args.wait_max,
        sleep_min=args.sleep_min,
        sleep_max=args.sleep_max,
        user_agent=args.user_agent,
        accept_language=args.accept_language,
        referer=args.referer,
        max_retries=args.max_retries,
        once=(args.once or (not args.loop)),  # 기본 once=True
        dry_run=args.dry_run,
        top_n_from_latest=True if "--top-n-from-latest" in " ".join(__import__("sys").argv) else DEFAULTS.top_n_from_latest,
        debug_save_section=args.debug_save_section,
        article_url=args.article_url,
    )

    section_targets = build_section_urls(args.section_codes, args.section_url)

    session = create_session(cfg)

    def crawl_all_targets():
        for target_url in section_targets:
            print(f"\n🌐 섹션 이동: {target_url}")
            section_cfg = replace(cfg, section_url=target_url)
            crawl_once(session, section_cfg)

    if cfg.once:
        crawl_all_targets()
        return

    # 반복 모드
    try:
        while True:
            crawl_all_targets()
            wait = random.randint(cfg.wait_min, cfg.wait_max)
            print(f"⏳ {wait}초 대기")
            for s in range(wait, 0, -1):
                print(f"\r다음 수집까지 {s:02d}초", end="", flush=True)
                time.sleep(1)
            print()
    except KeyboardInterrupt:
        print("\n👋 사용자 요청으로 종료합니다.")


if __name__ == "__main__":
    main()
