"""나라셀라 와인 카탈로그 스크래퍼

목록 페이지(wine_list.php)에서 각 와인 상세 페이지(wine_view.php) 링크를 수집한 뒤,
상세 페이지에서 메타데이터를 추출하여 CSV/JSON으로 저장한다.
"""
from __future__ import annotations
import csv
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Optional

import requests
import urllib3
from bs4 import BeautifulSoup

urllib3.disable_warnings()

BASE = "https://www.naracellar.com"
LIST_URL = BASE + "/wine/wine_list.php?page={page}"
VIEW_URL = BASE + "/wine/wine_view.php?num={num}"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    )
}
OUT_DIR = Path(__file__).parent
CSV_PATH = OUT_DIR / "scraped_wines.csv"
JSON_PATH = OUT_DIR / "scraped_wines.json"

session = requests.Session()
session.headers.update(HEADERS)
session.verify = False


def get_html(url: str, retries: int = 3) -> Optional[str]:
  for attempt in range(retries):
    try:
      r = session.get(url, timeout=25)
      if r.status_code == 200:
        # 본문은 UTF-8 (charset=utf-8 선언, meta는 일부 깨져 있으나 본문은 정상)
        return r.content.decode("utf-8", errors="replace")
    except Exception as e:
      print(f"  [retry {attempt + 1}] {url}: {e}", file=sys.stderr)
      time.sleep(1 + attempt)
  return None


def get_product_nums(page: int) -> list[str]:
  """목록 페이지에서 와인 num 추출"""
  html = get_html(LIST_URL.format(page=page))
  if not html:
    return []
  nums = re.findall(r"wine_view\.php\?num=(\d+)", html)
  # 중복 제거 (각 카드에 이미지+이름 2개 링크)
  return list(dict.fromkeys(nums))


def parse_view(num: str) -> dict:
  """상세 페이지에서 와인 메타데이터 추출"""
  url = VIEW_URL.format(num=num)
  html = get_html(url)
  if not html:
    return {"num": num, "url": url, "error": "fetch_failed"}

  soup = BeautifulSoup(html, "lxml")
  item: dict = {"num": num, "url": url}

  # 페이지 내 모든 텍스트로 한글명/영문명 추출 후보 영역
  # 사이트는 보통 h2/h3, tit 클래스, 또는 table 형태
  # 추출 전략: 와인 정보 영역의 dt/dd 또는 table th/td 매핑
  # 메인 타이틀
  title_el = (
    soup.select_one(".wine_view .tit, .product_view .tit, .view_tit, .wine_tit, h2.tit, .sub_tit")
  )
  if title_el:
    item["title_block"] = title_el.get_text(" ", strip=True)

  # 페이지 내 dt/dd 또는 th/td 추출
  spec: dict[str, str] = {}

  # dt/dd 패턴
  for dl in soup.find_all("dl"):
    dts = dl.find_all("dt")
    dds = dl.find_all("dd")
    for dt, dd in zip(dts, dds):
      k = dt.get_text(" ", strip=True)
      v = dd.get_text(" ", strip=True)
      if k:
        spec[k] = v

  # table th/td 패턴
  for tr in soup.find_all("tr"):
    th = tr.find("th")
    td = tr.find("td")
    if th and td:
      k = th.get_text(" ", strip=True)
      v = td.get_text(" ", strip=True)
      if k:
        spec[k] = v

  # 나라셀라 사이트의 실제 spec 패턴: <li><span class="dbt">키</span><div class="dbDetail">값</div></li>
  for li in soup.select("li"):
    k_el = li.select_one("span.dbt")
    v_el = li.select_one("div.dbDetail")
    if k_el and v_el:
      k = k_el.get_text(" ", strip=True)
      v = v_el.get_text(" ", strip=True)
      if k and v and k not in spec:
        spec[k] = v

  # 와인 소개(스토리, 페어링 등)도 수집 — <div class="dtWine"><div class="dtt">제목</div><p>본문</p></div>
  for box in soup.select("div.dtWine"):
    title_el = box.select_one(".dtt")
    if not title_el:
      continue
    t_key = title_el.get_text(" ", strip=True)
    body = " ".join(p.get_text(" ", strip=True) for p in box.find_all(["p", "li"]))
    if t_key and body and t_key not in spec:
      spec[t_key] = body[:500]  # 본문은 500자로 제한

  item["spec"] = spec

  # 나라셀라 사이트 실제 구조: .itemInfo > .wt1(영문) + h1.wt(한글) + .wt2(부제)
  info = soup.select_one(".itemInfo")
  if info:
    en_el = info.select_one(".wt1")
    ko_el = info.select_one("h1.wt, .wt")
    sub_el = info.select_one(".wt2")
    item["name_en"] = en_el.get_text(" ", strip=True) if en_el else ""
    item["name_ko"] = ko_el.get_text(" ", strip=True) if ko_el else ""
    item["subtitle"] = sub_el.get_text(" ", strip=True) if sub_el else ""
  else:
    # fallback: h1
    h1 = soup.find("h1")
    item["name_ko"] = h1.get_text(" ", strip=True) if h1 else ""
    item["name_en"] = ""

  # 표준 필드 매핑 (한글 키 → 통일 키)
  key_map = {
    "원산지": "country_region",  # 나라셀라 실제 키
    "포도품종": "varietal",       # 나라셀라 실제 키
    "음용온도": "serving_temp",   # 나라셀라 실제 키
    "음식궁합": "pairing",        # 나라셀라 실제 키
    "수상 내역": "awards",        # 나라셀라 실제 키
    "타입": "type",               # 나라셀라 실제 키
    "용량": "volume",
    "와이너리": "winery",
    "생산지": "country_region",
    "생산국": "country",
    "지역": "region",
    "국가": "country",
    "품종": "varietal",
    "Variety": "varietal",
    "Varietal": "varietal",
    "Grape": "varietal",
    "빈티지": "vintage",
    "Vintage": "vintage",
    "타입": "type",
    "Type": "type",
    "종류": "type",
    "카테고리": "category",
    "스타일": "style",
    "당도": "sweetness",
    "산도": "acidity",
    "바디": "body",
    "타닌": "tannin",
    "Body": "body",
    "도수": "abv",
    "알코올": "abv",
    "용량": "volume",
    "Size": "volume",
    "가격": "price",
    "Price": "price",
    "와이너리": "winery",
    "Winery": "winery",
    "Producer": "winery",
    "브랜드": "brand",
    "음용온도": "serving_temp",
    "어울리는음식": "pairing",
    "푸드페어링": "pairing",
    "수상": "awards",
    "등급": "grade",
    "AOC": "grade",
  }
  std: dict = {}
  for k, v in spec.items():
    for src, dst in key_map.items():
      if src in k:
        if dst not in std:
          std[dst] = v
        break
  item.update(std)

  # "원산지" 형식이 "국가 > 지역 > 세부" 이므로 분리
  cr = std.get("country_region", "")
  if cr and ">" in cr:
    parts = [p.strip() for p in cr.split(">")]
    if parts:
      item.setdefault("country", parts[0])
      if len(parts) > 1:
        item.setdefault("region", " > ".join(parts[1:]))
  elif cr:
    item.setdefault("country", cr)

  # 와이너리 텍스트에서 영문명 분리 (예: "몬테스(Montes)")
  win = std.get("winery", "")
  m = re.match(r"^(.+?)\s*\((.+?)\)\s*$", win)
  if m:
    item["winery_ko"] = m.group(1).strip()
    item["winery_en"] = m.group(2).strip()

  # name 카테고리 추론 (타입에서)
  t = std.get("type", "")
  cat_map = {"레드": "Red", "화이트": "White", "스파클링": "Sparkling",
             "로제": "Rosé", "디저트": "Dessert", "포트": "Fortified", "주정강화": "Fortified"}
  for ko, en in cat_map.items():
    if ko in t:
      item.setdefault("category", en)
      break

  return item


def main():
  print("=== 나라셀라 와인 카탈로그 스크래핑 ===", file=sys.stderr)
  print("Step 1: 목록 페이지에서 product num 수집 (1~93p)", file=sys.stderr)

  all_nums: list[str] = []
  with ThreadPoolExecutor(max_workers=8) as ex:
    futures = {ex.submit(get_product_nums, p): p for p in range(1, 94)}
    done = 0
    for fut in as_completed(futures):
      p = futures[fut]
      try:
        nums = fut.result()
        all_nums.extend(nums)
        done += 1
        if done % 10 == 0:
          print(f"  목록 진행: {done}/93 페이지", file=sys.stderr)
      except Exception as e:
        print(f"  page {p} failed: {e}", file=sys.stderr)

  # 중복 제거
  unique_nums = list(dict.fromkeys(all_nums))
  print(f"수집된 고유 SKU num: {len(unique_nums)}", file=sys.stderr)

  print("Step 2: 상세 페이지 파싱", file=sys.stderr)
  results: list[dict] = []
  with ThreadPoolExecutor(max_workers=10) as ex:
    futures = {ex.submit(parse_view, num): num for num in unique_nums}
    done = 0
    for fut in as_completed(futures):
      try:
        item = fut.result()
        results.append(item)
      except Exception as e:
        print(f"  num={futures[fut]} failed: {e}", file=sys.stderr)
      done += 1
      if done % 50 == 0:
        print(f"  상세 진행: {done}/{len(unique_nums)}", file=sys.stderr)

  # 저장
  JSON_PATH.write_text(
    json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
  )
  print(f"JSON 저장: {JSON_PATH} ({len(results)}건)", file=sys.stderr)

  # CSV 컬럼
  cols = [
    "num", "url", "name_ko", "name_en",
    "country", "region", "country_region",
    "varietal", "vintage", "type", "category", "style",
    "winery", "winery_ko", "winery_en", "brand", "grade",
    "price", "volume", "abv",
    "sweetness", "acidity", "body", "tannin",
    "serving_temp", "pairing", "awards",
    "title_block",
  ]
  with CSV_PATH.open("w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
    w.writeheader()
    for r in results:
      w.writerow({c: r.get(c, "") for c in cols})
  print(f"CSV 저장: {CSV_PATH}", file=sys.stderr)

  # 통계
  filled = {c: sum(1 for r in results if r.get(c)) for c in cols if c != "num"}
  print("=== 필드별 채움률 ===", file=sys.stderr)
  for k, v in sorted(filled.items(), key=lambda x: -x[1]):
    print(f"  {k}: {v}/{len(results)}", file=sys.stderr)


if __name__ == "__main__":
  main()
