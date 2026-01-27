#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
from datetime import datetime
from bs4 import BeautifulSoup
import time
import uuid

def now_iso():
    return datetime.utcnow().replace(microsecond=0).isoformat()

def crawl_article(url):
    """뉴스 기사 크롤링 (네이버 기준)"""
    print(f"📰 크롤링 중: {url}")
    res = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    res.raise_for_status()

    soup = BeautifulSoup(res.text, "html.parser")

    title = soup.select_one("h2#title_area, h2.media_end_head_headline")
    title = title.get_text(strip=True) if title else "제목 없음"

    content = soup.select_one("article#dic_area, div#newsct_article")
    content = content.get_text(strip=True) if content else "본문 없음"

    img_tag = soup.select_one("img")
    image_url = img_tag["src"] if img_tag and img_tag.has_attr("src") else None

    return {
        "articleUrl": f"{url}?uid={uuid.uuid4()}",
        "title": title,
        "content": content,
        "publisher": "네이버뉴스",
        "categoryCode": "102-999",
        "publishedAt": now_iso(),
        "contentCrawledAt": now_iso(),
        "isFullContentCrawled": True,
        "definition": None,
        "link": None,
        "word": None,
        "image_url": image_url,
    }

def send_to_backend(payload):
    """백엔드로 전송"""
    backend_endpoint = "http://localhost:8080/api/articles"
    res = requests.post(backend_endpoint, json=payload, timeout=10)
    if res.status_code in (200, 201):
        print(f"✅ 저장 성공 ({res.status_code})")
    else:
        print(f"❌ 저장 실패 ({res.status_code}) → {res.text}")

if __name__ == "__main__":
    target_url = input("기사 링크를 입력하세요: ").strip()
    repeat_count = int(input("몇 번 반복 크롤링할까요?: ").strip())

    print(f"\n🎯 {target_url} 을(를) {repeat_count}회 크롤링 + 전송합니다.\n")

    for i in range(repeat_count):
        print(f"\n🚀 {i+1}/{repeat_count}회차 시작...\n")
        payload = crawl_article(target_url)
        send_to_backend(payload)
        time.sleep(2)  # 너무 빠른 요청 방지

    print("\n✅ 모든 크롤링 + 전송 완료!")
