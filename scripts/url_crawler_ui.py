#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""간단한 기사 크롤링 GUI.

기사 URL을 입력하고 버튼을 누르면 제목/본문/이미지 URL을 가져와 화면에 출력한다.
"""

from __future__ import annotations

import threading
import time
from datetime import datetime
from tkinter import messagebox, ttk
from tkinter.scrolledtext import ScrolledText
import tkinter as tk
from typing import Dict

import requests
from bs4 import BeautifulSoup

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/122.0.0.0 Safari/537.36"
)


def now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat()


def crawl_article(url: str) -> Dict[str, str]:
    """네이버 뉴스 기사를 단순 크롤링."""
    res = requests.get(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Referer": "https://news.naver.com/",
            "Accept-Language": "ko-KR,ko;q=0.9",
        },
        timeout=10,
    )
    res.raise_for_status()

    soup = BeautifulSoup(res.text, "html.parser")

    title_el = soup.select_one("h2#title_area, h2.media_end_head_headline")
    body_el = soup.select_one("article#dic_area, div#newsct_article")

    image_el = soup.select_one(
        "figure img, div#newsct_article img, article#dic_area img"
    )

    return {
        "title": title_el.get_text(strip=True) if title_el else "제목을 찾지 못했어요.",
        "content": body_el.get_text("\n", strip=True) if body_el else "본문을 찾지 못했어요.",
        "image_url": image_el["src"] if image_el and image_el.has_attr("src") else "",
        "crawled_at": now_iso(),
        "source_url": url,
    }


class CrawlApp:
    def __init__(self) -> None:
        self.root = tk.Tk()
        self.root.title("기사 크롤링 도구")
        self.root.geometry("880x640")
        self.root.configure(bg="#f4f6fb")

        self.url_var = tk.StringVar()
        self.status_var = tk.StringVar(value="기사 URL을 입력한 뒤 크롤링을 시작하세요.")

        self._build_layout()

    def _build_layout(self) -> None:
        container = ttk.Frame(self.root, padding=20)
        container.pack(fill=tk.BOTH, expand=True)

        ttk.Label(container, text="기사 URL", font=("Pretendard", 13, "bold")).pack(
            anchor="w"
        )
        url_entry = ttk.Entry(
            container, textvariable=self.url_var, font=("Pretendard", 12)
        )
        url_entry.pack(fill=tk.X, pady=(6, 0))
        url_entry.focus()

        button_bar = ttk.Frame(container)
        button_bar.pack(fill=tk.X, pady=16)

        self.crawl_button = ttk.Button(
            button_bar, text="크롤링 실행", command=self._on_click_crawl
        )
        self.crawl_button.pack(side=tk.LEFT)

        ttk.Label(
            container,
            textvariable=self.status_var,
            foreground="#4b5563",
            font=("Pretendard", 10),
        ).pack(anchor="w")

        self.output = ScrolledText(
            container,
            font=("Pretendard", 12),
            wrap=tk.WORD,
            height=22,
        )
        self.output.pack(fill=tk.BOTH, expand=True, pady=(10, 0))

    def _log(self, text: str) -> None:
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.output.insert(tk.END, f"[{timestamp}] {text}\n")
        self.output.see(tk.END)

    def _set_busy(self, busy: bool) -> None:
        state = tk.DISABLED if busy else tk.NORMAL
        self.crawl_button.config(state=state)
        self.status_var.set("크롤링 중..." if busy else "준비 완료")

    def _on_click_crawl(self) -> None:
        url = self.url_var.get().strip()
        if not url:
            messagebox.showwarning("URL 필요", "기사 URL을 입력해 주세요.")
            return

        threading.Thread(target=self._crawl_worker, args=(url,), daemon=True).start()

    def _crawl_worker(self, url: str) -> None:
        self._set_busy(True)
        self._log(f"크롤링 시작: {url}")

        try:
            article = crawl_article(url)
        except Exception as exc:
            self._log(f"에러 발생: {exc}")
            messagebox.showerror("크롤링 실패", str(exc))
            self._set_busy(False)
            return

        time.sleep(0.2)
        self._log("크롤링 완료\n")
        self.output.insert(
            tk.END,
            (
                f"제목: {article['title']}\n"
                f"이미지: {article['image_url'] or '없음'}\n"
                f"수집시각: {article['crawled_at']}\n"
                f"원본 URL: {article['source_url']}\n\n"
                f"{article['content']}\n\n"
                + "=" * 70
                + "\n\n"
            ),
        )
        self.output.see(tk.END)
        self._set_busy(False)

    def run(self) -> None:
        self.root.mainloop()


def main() -> None:
    app = CrawlApp()
    app.run()


if __name__ == "__main__":
    main()
