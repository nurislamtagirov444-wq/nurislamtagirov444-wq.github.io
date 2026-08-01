#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI Browser — Мультивкладочный консольный браузер для Claude и ИИ-ассистентов.
Разработан для работы в Termux и Linux-пространстве.
Позволяет открывать сайты во вкладках, извлекать чистый Markdown-текст, искать в интернете и управлять ссылками.
"""

import os
import sys
import json
import argparse
import urllib.request
import urllib.parse
import urllib.error
from html.parser import HTMLParser
from pathlib import Path

# Попытка импорта сторонних библиотек для лучшего парсинга (с fallback на стандартные)
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False


SESSION_FILE = Path.home() / ".config" / "ai_browser_tabs.json"
if not SESSION_FILE.parent.exists():
    try:
        SESSION_FILE.parent.mkdir(parents=True, exist_ok=True)
    except Exception:
        SESSION_FILE = Path("/tmp") / "ai_browser_tabs.json"

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
}


class SimpleHTMLTextExtractor(HTMLParser):
    """Простой и устойчивый к ошибкам HTML парсер на стандартной библиотеке."""
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.links = []
        self.ignore_tags = {'script', 'style', 'noscript', 'svg'}
        self.void_tags = {'meta', 'link', 'br', 'hr', 'img', 'input', 'source', 'area', 'base', 'col', 'embed', 'param', 'track', 'wbr'}
        self.tag_stack = []
        self.current_href = None
        self.title = "Без заголовка"
        self.in_title = False
        self.in_ignore = 0

    def handle_starttag(self, tag, attrs):
        tag_lower = tag.lower()
        if tag_lower in self.ignore_tags:
            self.in_ignore += 1
            return
        if tag_lower in self.void_tags:
            return
        self.tag_stack.append(tag_lower)
        if tag_lower == 'title':
            self.in_title = True
        elif tag_lower == 'a':
            for attr, val in attrs:
                if attr.lower() == 'href' and val:
                    self.current_href = val

    def handle_endtag(self, tag):
        tag_lower = tag.lower()
        if tag_lower in self.ignore_tags:
            if self.in_ignore > 0:
                self.in_ignore -= 1
            return
        if tag_lower == 'title':
            self.in_title = False
        if tag_lower in {'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'br', 'tr', 'section', 'article'}:
            self.text_parts.append("\n")
        if tag_lower == 'a':
            self.current_href = None
        # Безопасное удаление тега со стека
        if tag_lower in self.tag_stack:
            for i in range(len(self.tag_stack) - 1, -1, -1):
                if self.tag_stack[i] == tag_lower:
                    self.tag_stack.pop(i)
                    break

    def handle_data(self, data):
        if self.in_ignore > 0:
            return
        clean = data.strip()
        if not clean:
            return
        if self.in_title and self.title == "Без заголовка":
            self.title = clean
            return
        
        current_tag = self.tag_stack[-1] if self.tag_stack else ""
        if current_tag == "h1":
            self.text_parts.append(f"\n# {clean}\n")
        elif current_tag == "h2":
            self.text_parts.append(f"\n## {clean}\n")
        elif current_tag == "h3":
            self.text_parts.append(f"\n### {clean}\n")
        elif current_tag == "a" and self.current_href:
            self.text_parts.append(f" [{clean}]({self.current_href}) ")
            self.links.append((clean, self.current_href))
        else:
            self.text_parts.append(clean + " ")


def load_tabs():
    if SESSION_FILE.exists():
        try:
            with open(SESSION_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"next_id": 1, "tabs": []}
    return {"next_id": 1, "tabs": []}


def save_tabs(data):
    try:
        with open(SESSION_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Ошибка сохранения сессии вкладок: {e}", file=sys.stderr)


def fetch_url(url):
    """Загрузка страницы с использованием requests, urllib или чтение локального файла."""
    if url.startswith("file://"):
        file_path = urllib.parse.unquote(url[7:])
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                return f.read(), f"file://{os.path.abspath(file_path)}"
        except Exception as e:
            raise RuntimeError(f"Ошибка чтения локального файла ({file_path}): {e}")
    elif os.path.exists(url) and not url.startswith("http://") and not url.startswith("https://"):
        try:
            with open(url, "r", encoding="utf-8", errors="replace") as f:
                return f.read(), f"file://{os.path.abspath(url)}"
        except Exception as e:
            raise RuntimeError(f"Ошибка чтения локального файла ({url}): {e}")

    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url
    if HAS_REQUESTS:
        try:
            resp = requests.get(url, headers=DEFAULT_HEADERS, timeout=15)
            resp.raise_for_status()
            resp.encoding = resp.apparent_encoding or "utf-8"
            return resp.text, resp.url
        except Exception as e:
            raise RuntimeError(f"Ошибка загрузки URL ({url}): {e}")
    else:
        try:
            req = urllib.request.Request(url, headers=DEFAULT_HEADERS)
            with urllib.request.urlopen(req, timeout=15) as resp:
                raw = resp.read()
                charset = resp.headers.get_content_charset() or "utf-8"
                return raw.decode(charset, errors="replace"), resp.geturl()
        except Exception as e:
            raise RuntimeError(f"Ошибка загрузки URL ({url}): {e}")


def html_to_markdown(html_content, base_url=""):
    """Преобразование HTML в чистый читаемый текст/Markdown для ИИ."""
    if HAS_BS4:
        soup = BeautifulSoup(html_content, "html.parser")
        for bad in soup(["script", "style", "nav", "footer", "noscript", "svg", "iframe"]):
            bad.decompose()
        title = soup.title.string.strip() if soup.title and soup.title.string else "Без заголовка"
        
        links = []
        for a in soup.find_all("a", href=True):
            href = urllib.parse.urljoin(base_url, a["href"])
            text = a.get_text(strip=True)
            if text and href.startswith("http"):
                links.append({"title": text, "url": href})
        
        # Генерация читаемого текста с заголовками и абзацами
        lines = []
        for elem in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "pre", "code"]):
            text = elem.get_text(" ", strip=True)
            if not text:
                continue
            if elem.name == "h1":
                lines.append(f"\n# {text}\n")
            elif elem.name == "h2":
                lines.append(f"\n## {text}\n")
            elif elem.name == "h3":
                lines.append(f"\n### {text}\n")
            elif elem.name == "li":
                lines.append(f"- {text}")
            else:
                lines.append(f"{text}\n")
        content = "\n".join(lines).strip()
        if not content:
            content = soup.get_text("\n", strip=True)
        return title, content, links
    else:
        parser = SimpleHTMLTextExtractor()
        parser.feed(html_content)
        title = parser.title
        content = "".join(parser.text_parts).strip()
        links = [{"title": t, "url": urllib.parse.urljoin(base_url, u)} for t, u in parser.links if u]
        return title, content, links


def cmd_open(args):
    url = args.url
    print(f"🌐 Загрузка {url}...", file=sys.stderr)
    try:
        html, final_url = fetch_url(url)
        title, content, links = html_to_markdown(html, final_url)
        
        session = load_tabs()
        tab_id = session.get("next_id", 1)
        session["next_id"] = tab_id + 1
        
        tab_data = {
            "id": tab_id,
            "url": final_url,
            "title": title,
            "content": content,
            "links": links[:100]  # Сохраняем первые 100 ссылок
        }
        session.setdefault("tabs", []).append(tab_data)
        save_tabs(session)
        
        print(f"✅ Вкладка [{tab_id}] открыта: {title} ({final_url})")
        print("--- Предпросмотр текста (первые 500 символов) ---")
        print(content[:500] + ("..." if len(content) > 500 else ""))
    except Exception as e:
        print(f"❌ {e}", file=sys.stderr)
        sys.exit(1)


def cmd_list(args):
    session = load_tabs()
    tabs = session.get("tabs", [])
    if not tabs:
        print("📭 Нет открытых вкладок. Используйте `ai-browser open <url>` чтобы открыть сайт.")
        return
    print(f"📑 Открытые вкладки ({len(tabs)}):")
    for t in tabs:
        print(f"  [{t['id']}] {t['title']} — {t['url']}")


def cmd_read(args):
    session = load_tabs()
    for t in session.get("tabs", []):
        if str(t["id"]) == str(args.tab_id):
            print(f"# {t['title']}\nURL: {t['url']}\n\n{t['content']}")
            return
    print(f"❌ Вкладка с ID {args.tab_id} не найдена.", file=sys.stderr)
    sys.exit(1)


def cmd_links(args):
    session = load_tabs()
    for t in session.get("tabs", []):
        if str(t["id"]) == str(args.tab_id):
            links = t.get("links", [])
            if not links:
                print(f"🔗 Во вкладке [{t['id']}] ссылки не найдены.")
                return
            print(f"🔗 Ссылки со страницы [{t['id']}] ({len(links)} шт.):")
            for idx, l in enumerate(links, 1):
                print(f"  {idx}. {l['title']} -> {l['url']}")
            return
    print(f"❌ Вкладка с ID {args.tab_id} не найдена.", file=sys.stderr)
    sys.exit(1)


def cmd_close(args):
    session = load_tabs()
    old_tabs = session.get("tabs", [])
    new_tabs = [t for t in old_tabs if str(t["id"]) != str(args.tab_id)]
    if len(old_tabs) == len(new_tabs):
        print(f"❌ Вкладка с ID {args.tab_id} не найдена.", file=sys.stderr)
        return
    session["tabs"] = new_tabs
    save_tabs(session)
    print(f"🗑️ Вкладка [{args.tab_id}] закрыта.")


def cmd_clear(args):
    session = load_tabs()
    session["tabs"] = []
    session["next_id"] = 1
    save_tabs(session)
    print("🧹 Все вкладки очищены.")


def cmd_search(args):
    query = args.query
    print(f"🔍 Поиск в DuckDuckGo: {query}...", file=sys.stderr)
    url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote_plus(query)
    try:
        html, _ = fetch_url(url)
        results = []
        if HAS_BS4:
            soup = BeautifulSoup(html, "html.parser")
            for a in soup.find_all("a", class_="result__url", href=True):
                title_tag = a.find_previous("a", class_="result__snippet") or a.find_previous("a", class_="result__a")
                title = title_tag.get_text(strip=True) if title_tag else a.get_text(strip=True)
                href = a["href"]
                if href.startswith("//"):
                    href = "https:" + href
                results.append({"title": title, "url": href})
        else:
            # Fallback простой поиск ссылок
            parser = SimpleHTMLTextExtractor()
            parser.feed(html)
            for t, u in parser.links:
                if "http" in u and "duckduckgo" not in u:
                    results.append({"title": t, "url": u})
        
        if not results:
            print("⚠️ Результаты не найдены или структура поиска изменилась.")
            return
        
        print(f"🎯 Результаты поиска для '{query}':\n")
        for idx, res in enumerate(results[:10], 1):
            print(f"  {idx}. {res['title']}\n     URL: {res['url']}\n")
    except Exception as e:
        print(f"❌ Ошибка поиска: {e}", file=sys.stderr)
        sys.exit(1)


def cmd_dump(args):
    url = args.url
    try:
        html, final_url = fetch_url(url)
        title, content, _ = html_to_markdown(html, final_url)
        print(f"# {title}\nURL: {final_url}\n\n{content}")
    except Exception as e:
        print(f"❌ {e}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="AI Browser — консольный браузер со вкладками для Claude и ИИ-ассистентов в Termux/Linux."
    )
    subparsers = parser.add_subparsers(dest="command", help="Доступные команды")

    p_open = subparsers.add_parser("open", help="Открыть сайт в новой вкладке")
    p_open.add_argument("url", help="URL сайта для открытия")
    p_open.set_defaults(func=cmd_open)

    p_list = subparsers.add_parser("list", help="Показать все открытые вкладки")
    p_list.set_defaults(func=cmd_list)

    p_read = subparsers.add_parser("read", help="Прочитать текст из вкладки в формате Markdown")
    p_read.add_argument("tab_id", help="ID вкладки")
    p_read.set_defaults(func=cmd_read)

    p_links = subparsers.add_parser("links", help="Показать все ссылки со страницы во вкладке")
    p_links.add_argument("tab_id", help="ID вкладки")
    p_links.set_defaults(func=cmd_links)

    p_close = subparsers.add_parser("close", help="Закрыть вкладку")
    p_close.add_argument("tab_id", help="ID вкладки")
    p_close.set_defaults(func=cmd_close)

    p_clear = subparsers.add_parser("clear", help="Очистить все вкладки")
    p_clear.set_defaults(func=cmd_clear)

    p_search = subparsers.add_parser("search", help="Поиск в интернете (DuckDuckGo)")
    p_search.add_argument("query", help="Поисковый запрос")
    p_search.set_defaults(func=cmd_search)

    p_dump = subparsers.add_parser("dump", help="Мгновенно выгрузить текст страницы (без создания вкладки)")
    p_dump.add_argument("url", help="URL сайта")
    p_dump.set_defaults(func=cmd_dump)

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    args.func(args)


if __name__ == "__main__":
    main()
