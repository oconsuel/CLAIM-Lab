"""
Practice: Trick the AI ("Обмани ИИ")

Accepts real user images (base64/data URL) and classifies them
via Hugging Face Inference API.
"""

import base64
import os
import re
import time
from io import BytesIO
from urllib.parse import quote

import numpy as np
import requests
from PIL import Image

from practices.base import BasePractice

HF_MODEL_ID = os.environ.get("HF_MODEL_ID", "google/vit-base-patch16-224")
HF_API_URLS = (
    f"https://router.huggingface.co/hf-inference/models/{HF_MODEL_ID}",
    f"https://api-inference.huggingface.co/models/{HF_MODEL_ID}",
)
HF_TOKEN = os.environ.get("HF_TOKEN", "")
WIKI_HEADERS = {"User-Agent": "CLAIM-Lab/1.0 (educational demo)"}


class TrickTheAIPractice(BasePractice):
    def __init__(self):
        self._wiki_cache = {}
        self._summary_cache = {}

    def _headers(self):
        token = os.environ.get("HF_TOKEN", HF_TOKEN)
        if not token:
            return {}
        return {"Authorization": f"Bearer {token}"}

    def _decode_image(self, image_data):
        if not image_data or not isinstance(image_data, str):
            raise ValueError("Пустое изображение. Передайте base64 или data URL.")

        payload = image_data.strip()
        if payload.startswith("data:"):
            parts = payload.split(",", 1)
            if len(parts) != 2:
                raise ValueError("Некорректный data URL изображения.")
            payload = parts[1]

        try:
            return base64.b64decode(payload, validate=True)
        except Exception as exc:
            raise ValueError("Не удалось декодировать изображение (base64).") from exc

    def _pil_to_jpeg_bytes(self, img):
        buf = BytesIO()
        img.save(buf, format="JPEG", quality=90)
        return buf.getvalue()

    def _normalize_hf_result(self, data):
        if not isinstance(data, list) or len(data) == 0:
            return {
                "top1_label": "unknown",
                "top1_score": 0,
                "top5": [],
            }

        top = []
        for item in data[:5]:
            label = str(item.get("label", "unknown"))
            score_raw = float(item.get("score", 0.0))
            score_pct = round(score_raw * 100, 2)
            top.append({"label_en": label, "score": score_pct})

        enriched = [self._enrich_top_item(item) for item in top]

        top1 = enriched[0]
        return {
            "top1_label": top1["label"],
            "top1_label_en": top1.get("label_en", ""),
            "top1_score": float(top1["score"]),
            "top5": enriched,
        }

    def _score_for_label(self, raw_data, target_label_en):
        target = str(target_label_en or "").strip().lower()
        if not isinstance(raw_data, list):
            return 0.0
        for item in raw_data:
            raw_label = str(item.get("label", "")).strip()
            if raw_label.lower() == target:
                return float(item.get("score", 0.0))
        return 0.0

    def _cell_visual_cues(self, cell_rgb):
        if cell_rgb.size == 0:
            return ["мало информации об этом кусочке картинки"]

        arr = cell_rgb.astype(np.float32)
        gray = arr.mean(axis=2)
        contrast = float(np.std(gray))
        color_std = float(np.std(arr, axis=(0, 1)).mean())
        gx = np.gradient(gray, axis=1)
        gy = np.gradient(gray, axis=0)
        edge_strength = float(np.mean(np.sqrt(gx * gx + gy * gy)))

        cues = []
        if edge_strength > 18:
            cues.append("чёткие очертания и границы")
        elif edge_strength > 10:
            cues.append("заметные переходы света и тени")
        else:
            cues.append("плавные переходы без резких линий")

        if contrast > 38:
            cues.append("яркие пятна и тени")
        elif contrast > 20:
            cues.append("есть светлые и тёмные участки")
        else:
            cues.append("примерно одинаковый свет")

        if color_std > 34:
            cues.append("много разных оттенков")
        elif color_std > 18:
            cues.append("разные цвета рядом")
        else:
            cues.append("одинаковый цвет на всём участке")

        return cues

    def _zone_name(self, gx, gy, grid):
        if gy <= 0:
            vertical = "верхняя"
        elif gy >= grid - 1:
            vertical = "нижняя"
        else:
            vertical = "средняя"

        if gx <= 0:
            horizontal = "левая"
        elif gx >= grid - 1:
            horizontal = "правая"
        else:
            horizontal = "центральная"

        return f"{vertical} {horizontal} область"

    def _run_classify_and_xai(self, image_bytes):
        try:
            with Image.open(BytesIO(image_bytes)) as img:
                base_img = img.convert("RGB")
        except Exception:
            return (
                {"top1_label": "unknown", "top1_label_en": "", "top1_score": 0, "top5": []},
                None,
            )

        base_img.thumbnail((256, 256))
        w, h = base_img.size
        if w < 16 or h < 16:
            recognition = self._classify(image_bytes)
            return (recognition, None)

        try:
            grid = int(os.environ.get("XAI_GRID", "3"))
        except Exception:
            grid = 3
        grid = max(2, min(6, grid))
        cell_w = max(1, w // grid)
        cell_h = max(1, h // grid)

        arr = np.asarray(base_img).astype(np.float32)
        avg_color = tuple(int(x) for x in arr.reshape(-1, 3).mean(axis=0))
        cells_data = []
        for gy in range(grid):
            for gx in range(grid):
                x0 = gx * cell_w
                y0 = gy * cell_h
                x1 = w if gx == grid - 1 else min(w, x0 + cell_w)
                y1 = h if gy == grid - 1 else min(h, y0 + cell_h)
                if x1 <= x0 or y1 <= y0:
                    continue
                masked = base_img.copy()
                patch = Image.new("RGB", (x1 - x0, y1 - y0), avg_color)
                masked.paste(patch, (x0, y0))
                masked_bytes = self._pil_to_jpeg_bytes(masked)
                cells_data.append((gy, gx, masked_bytes))

        batch_images = [image_bytes] + [mb for _, _, mb in cells_data]
        try:
            batch_results = self._hf_inference_batch(batch_images)
        except Exception:
            recognition = self._classify(image_bytes)
            return (recognition, None)

        recognition = self._normalize_hf_result(batch_results[0])
        target_label_en = str(recognition.get("top1_label_en", "")).strip()
        target_label_ru = str(recognition.get("top1_label", "")).strip() or target_label_en
        baseline = max(0.0, float(recognition.get("top1_score", 0)) / 100.0)

        impacts = np.zeros((grid, grid), dtype=np.float32)
        for i, (gy, gx, _) in enumerate(cells_data):
            raw_pred = batch_results[i + 1] if i + 1 < len(batch_results) else []
            perturbed = self._score_for_label(raw_pred, target_label_en)
            impacts[gy, gx] = max(0.0, baseline - perturbed)

        xai = self._build_xai_overlay_from_impacts(
            base_img, arr, impacts, recognition, grid, w, h, cell_w, cell_h
        )
        return (recognition, xai)

    def _build_xai_overlay_from_impacts(self, base_img, arr, impacts, recognition, grid, w, h, cell_w, cell_h):
        target_label_ru = str(recognition.get("top1_label", "")).strip()
        max_impact = float(np.max(impacts))
        if max_impact <= 0:
            return None
        heat = impacts / max_impact

        heat_img = Image.fromarray((heat * 255).astype(np.uint8), mode="L").resize((w, h), Image.Resampling.BILINEAR)
        heat_arr = np.asarray(heat_img).astype(np.float32) / 255.0

        alpha = 0.62
        overlay = arr.copy()
        overlay[:, :, 0] = overlay[:, :, 0] * (1.0 - alpha * heat_arr) + 255.0 * (alpha * heat_arr)
        overlay[:, :, 1] = overlay[:, :, 1] * (1.0 - alpha * heat_arr)
        overlay[:, :, 2] = overlay[:, :, 2] * (1.0 - alpha * heat_arr)
        overlay = np.clip(overlay, 0, 255).astype(np.uint8)

        out = Image.fromarray(overlay, mode="RGB")
        out_buf = BytesIO()
        out.save(out_buf, format="JPEG", quality=90)
        xai_b64 = base64.b64encode(out_buf.getvalue()).decode("utf-8")

        top_idx = int(np.argmax(impacts))
        top_gy = (top_idx // grid) + 1
        top_gx = (top_idx % grid) + 1
        cells = []
        for gy in range(grid):
            for gx in range(grid):
                x0 = gx * cell_w
                y0 = gy * cell_h
                x1 = w if gx == grid - 1 else min(w, x0 + cell_w)
                y1 = h if gy == grid - 1 else min(h, y0 + cell_h)
                impact = float(impacts[gy, gx])
                norm = float(heat[gy, gx])
                impact_pp = impact * 100.0
                zone = self._zone_name(gx, gy, grid)
                cell_rgb = arr[y0:y1, x0:x1, :]
                cues = self._cell_visual_cues(cell_rgb)
                if norm >= 0.66:
                    strength = "очень важная"
                elif norm >= 0.33:
                    strength = "довольно важная"
                else:
                    strength = "мало влияет"
                reason = (
                    f"{zone.capitalize()} — {strength}. Если закрасить эту часть, "
                    f"ИИ станет хуже угадывать «{target_label_ru}». "
                    f"Здесь на картинке: {', '.join(cues[:2])}."
                )
                cells.append(
                    {
                        "gx": gx,
                        "gy": gy,
                        "impact_pp": round(impact_pp, 2),
                        "impact_norm": round(norm, 4),
                        "zone": zone,
                        "strength": strength,
                        "cues": cues,
                        "reason": reason,
                    }
                )
        return {
            "method": "occlusion-sensitivity",
            "grid": grid,
            "overlay_b64": xai_b64,
            "cells": cells,
            "note": (
                "Красные участки — те, на которые ИИ смотрит в первую очередь, "
                f"когда решает, что на картинке «{target_label_ru}». "
                f"Самый важный кусочек — ячейка {top_gy}:{top_gx}. "
                "Наведи на любую ячейку, чтобы узнать, почему она важна."
            ),
        }

    def _capitalize_label(self, text):
        value = str(text or "").strip()
        if not value:
            return value
        return value[:1].upper() + value[1:]

    def _primary_term(self, label_en):
        raw = str(label_en or "")
        parts = [p.strip() for p in raw.split(",") if p and p.strip()]
        if parts:
            parts_sorted = sorted(
                parts,
                key=lambda p: (len(p.split()), len(p)),
                reverse=True,
            )
            term = parts_sorted[0]
        else:
            term = raw.strip()
        term = term.replace("_", " ")
        term = term.replace("bullterrier", "bull terrier")
        term = term.replace("bullmastiff", "bull mastiff")
        return " ".join(term.split())

    def _term_variants(self, term):
        base = (term or "").strip()
        variants = [base]
        if base:
            variants.append(base.lower())
            variants.append(base.title())
            variants.append(base.replace("-", " "))
        out = []
        for v in variants:
            if v and v not in out:
                out.append(v)
        return out

    def _wiki_summary(self, lang, title):
        key = (lang, title)
        if key in self._summary_cache:
            return self._summary_cache[key]
        if not title:
            self._summary_cache[key] = {"extract": "", "image": ""}
            return {"extract": "", "image": ""}

        url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{quote(title)}"
        try:
            resp = requests.get(url, headers=WIKI_HEADERS, timeout=10)
            if resp.status_code != 200:
                self._summary_cache[key] = {"extract": "", "image": ""}
                return {"extract": "", "image": ""}
            data = resp.json()
            text = str(data.get("extract") or "").strip()
            image = str(((data.get("thumbnail") or {}).get("source")) or "").strip()
            payload = {"extract": text, "image": image}
            self._summary_cache[key] = payload
            return payload
        except Exception:
            self._summary_cache[key] = {"extract": "", "image": ""}
            return {"extract": "", "image": ""}

    def _truncate_to_sentences(self, text, max_sentences=2):
        raw = str(text or "").strip()
        if not raw:
            return ""
        parts = re.split(r"(?<=[.!?])\s+", raw)
        chunks = [p.strip() for p in parts if p and p.strip()]
        if not chunks:
            return raw
        return " ".join(chunks[:max_sentences]).strip()

    def _ru_title_from_en(self, en_title):
        title = str(en_title or "").strip()
        if not title:
            return ""
        try:
            resp = requests.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "action": "query",
                    "titles": title,
                    "prop": "langlinks",
                    "lllang": "ru",
                    "lllimit": 1,
                    "format": "json",
                },
                headers=WIKI_HEADERS,
                timeout=10,
            )
            if resp.status_code != 200:
                return ""
            data = resp.json()
            pages = (data.get("query") or {}).get("pages") or {}
            page_obj = next(iter(pages.values())) if pages else {}
            links = page_obj.get("langlinks") or []
            if not links:
                return ""
            return str(links[0].get("*") or "").strip()
        except Exception:
            return ""

    def _lookup_wikidata(self, term):
        if term in self._wiki_cache:
            cached = self._wiki_cache[term]
            if str(cached.get("wiki_lang", "")).lower() in {"en", "ru"}:
                return cached

        fallback = {
            "label_ru": term,
            "wiki_url": "",
            "wiki_extract": "",
            "wiki_image": "",
            "wiki_title": "",
            "wiki_lang": "",
        }

        for vterm in self._term_variants(term):
            try:
                # 1) Find best EN Wikipedia title for the class label.
                search_en = requests.get(
                    "https://en.wikipedia.org/w/api.php",
                    params={
                        "action": "query",
                        "list": "search",
                        "srsearch": vterm,
                        "srlimit": 1,
                        "format": "json",
                    },
                    headers=WIKI_HEADERS,
                    timeout=10,
                )
                if search_en.status_code != 200:
                    continue
                data_en = search_en.json()
                hits_en = ((data_en.get("query") or {}).get("search") or [])
                if not hits_en:
                    continue
                en_title = str(hits_en[0].get("title", "")).strip()
                if not en_title:
                    continue

                # 2) Resolve EN title -> Wikidata item id (for RU label).
                pp = requests.get(
                    "https://en.wikipedia.org/w/api.php",
                    params={
                        "action": "query",
                        "titles": en_title,
                        "prop": "pageprops",
                        "format": "json",
                    },
                    headers=WIKI_HEADERS,
                    timeout=10,
                )
                if pp.status_code != 200:
                    continue
                pp_data = pp.json()
                pages = (pp_data.get("query") or {}).get("pages") or {}
                page_obj = next(iter(pages.values())) if pages else {}
                qid = ((page_obj.get("pageprops") or {}).get("wikibase_item") or "").strip()
                label_ru = term
                ru_title = ""
                en_title_exact = en_title
                if qid:
                    ent_resp = requests.get(
                        "https://www.wikidata.org/w/api.php",
                        params={
                            "action": "wbgetentities",
                            "ids": qid,
                            "props": "labels|sitelinks",
                            "languages": "ru|en",
                            "sitefilter": "ruwiki|enwiki",
                            "format": "json",
                        },
                        headers=WIKI_HEADERS,
                        timeout=10,
                    )
                    if ent_resp.status_code == 200:
                        ent_data = ent_resp.json()
                        entity = (ent_data.get("entities") or {}).get(qid) or {}
                        labels = entity.get("labels") or {}
                        sitelinks = entity.get("sitelinks") or {}
                        label_ru = ((labels.get("ru") or {}).get("value") or en_title or term).strip()
                        ru_title = str(((sitelinks.get("ruwiki") or {}).get("title")) or "").strip()
                        en_title_exact = str(((sitelinks.get("enwiki") or {}).get("title")) or en_title).strip()
                else:
                    label_ru = en_title or term

                # 3) Wiki link from EN Wikipedia; description in RU.
                if not ru_title:
                    ru_title = self._ru_title_from_en(en_title_exact or en_title)
                summary_ru = self._wiki_summary("ru", ru_title) if ru_title else {"extract": "", "image": ""}
                summary_en = self._wiki_summary("en", en_title_exact or en_title)
                extract_ru = self._truncate_to_sentences(summary_ru.get("extract", ""), max_sentences=2)
                if ru_title:
                    wiki_url = f"https://ru.wikipedia.org/wiki/{quote(ru_title.replace(' ', '_'))}"
                    wiki_title = ru_title
                    wiki_lang = "ru"
                else:
                    wiki_url = f"https://en.wikipedia.org/wiki/{quote((en_title_exact or en_title).replace(' ', '_'))}"
                    wiki_title = en_title_exact or en_title
                    wiki_lang = "en"

                result = {
                    "label_ru": label_ru,
                    "wiki_url": wiki_url,
                    "wiki_extract": extract_ru,
                    "wiki_image": summary_ru.get("image", "") or summary_en.get("image", ""),
                    "wiki_title": wiki_title,
                    "wiki_lang": wiki_lang,
                }
                self._wiki_cache[term] = result
                return result
            except Exception:
                continue

        # Fallback: direct EN wiki search, RU label = term.
        for vterm in self._term_variants(term):
            try:
                search_en = requests.get(
                    "https://en.wikipedia.org/w/api.php",
                    params={
                        "action": "query",
                        "list": "search",
                        "srsearch": vterm,
                        "srlimit": 1,
                        "format": "json",
                    },
                    headers=WIKI_HEADERS,
                    timeout=10,
                )
                if search_en.status_code == 200:
                    data_en = search_en.json()
                    hits = ((data_en.get("query") or {}).get("search") or [])
                    if hits:
                        title = str(hits[0].get("title", "")).strip()
                        if title:
                            ru_title = self._ru_title_from_en(title)
                            summary_ru = self._wiki_summary("ru", ru_title) if ru_title else {"extract": "", "image": ""}
                            summary_en = self._wiki_summary("en", title)
                            extract_ru = self._truncate_to_sentences(summary_ru.get("extract", ""), max_sentences=2)
                            if ru_title:
                                wiki_url = f"https://ru.wikipedia.org/wiki/{quote(ru_title.replace(' ', '_'))}"
                                wiki_title = ru_title
                                wiki_lang = "ru"
                            else:
                                wiki_url = f"https://en.wikipedia.org/wiki/{quote(title.replace(' ', '_'))}"
                                wiki_title = title
                                wiki_lang = "en"

                            result = {
                                "label_ru": term,
                                "wiki_url": wiki_url,
                                "wiki_extract": extract_ru,
                                "wiki_image": summary_ru.get("image", "") or summary_en.get("image", ""),
                                "wiki_title": wiki_title,
                                "wiki_lang": wiki_lang,
                            }
                            self._wiki_cache[term] = result
                            return result
            except Exception:
                continue

        self._wiki_cache[term] = fallback
        return fallback

    def _enrich_top_item(self, item):
        label_en = str(item.get("label_en", "unknown"))
        score = float(item.get("score", 0))
        term = self._primary_term(label_en)
        wiki = self._lookup_wikidata(term)

        return {
            "label": self._capitalize_label(wiki.get("label_ru") or term or label_en),
            "label_en": label_en,
            "score": score,
            "wiki_url": wiki.get("wiki_url", ""),
            "wiki_extract": wiki.get("wiki_extract", ""),
            "wiki_image": wiki.get("wiki_image", ""),
            "wiki_title": wiki.get("wiki_title", ""),
            "wiki_lang": wiki.get("wiki_lang", ""),
        }

    def _hf_inference(self, image_bytes):
        headers = self._headers()
        if not headers:
            raise RuntimeError("HF_TOKEN не задан. Установите переменную окружения HF_TOKEN.")
        headers["Accept"] = "application/json"
        headers["Content-Type"] = "application/octet-stream"

        last_error = ""
        custom_url = os.environ.get("HF_API_URL", "").strip()
        endpoints = [custom_url] if custom_url else []
        for url in HF_API_URLS:
            if url not in endpoints:
                endpoints.append(url)

        for endpoint in endpoints:
            for attempt in range(3):
                try:
                    resp = requests.post(
                        endpoint,
                        headers=headers,
                        data=image_bytes,
                        timeout=15,
                    )
                except Exception as exc:
                    last_error = f"Сетевой сбой: {exc}"
                    if attempt < 2:
                        time.sleep(3)
                        continue
                    break

                if resp.status_code == 503:
                    # Model warm-up.
                    last_error = "Модель прогревается, повторите запрос через несколько секунд."
                    if attempt < 2:
                        time.sleep(3)
                        continue
                    break

                if resp.status_code in (404, 410):
                    # Endpoint can be deprecated; try another known endpoint.
                    last_error = f"Эндпоинт HF ({endpoint}) недоступен: {resp.status_code}"
                    break

                if resp.status_code >= 400:
                    try:
                        err_json = resp.json()
                        err_text = err_json.get("error") or str(err_json)
                    except Exception:
                        err_text = resp.text[:300]
                    raise RuntimeError(f"Ошибка Hugging Face API ({resp.status_code}): {err_text}")

                data = resp.json()
                if isinstance(data, dict) and data.get("error"):
                    raise RuntimeError(f"Hugging Face API: {data.get('error')}")

                if not isinstance(data, list):
                    return []
                return data

        raise RuntimeError(last_error or "Не удалось классифицировать изображение.")

    def _hf_inference_batch(self, images_bytes_list):
        if not images_bytes_list:
            return []
        headers = self._headers()
        if not headers:
            raise RuntimeError("HF_TOKEN не задан. Установите переменную окружения HF_TOKEN.")
        headers["Accept"] = "application/json"
        headers["Content-Type"] = "application/json"

        inputs_b64 = [base64.b64encode(b).decode("utf-8") for b in images_bytes_list]
        payload = {"inputs": inputs_b64}

        last_error = ""
        custom_url = os.environ.get("HF_API_URL", "").strip()
        endpoints = [custom_url] if custom_url else []
        for url in HF_API_URLS:
            if url not in endpoints:
                endpoints.append(url)

        for endpoint in endpoints:
            for attempt in range(3):
                try:
                    resp = requests.post(
                        endpoint,
                        headers=headers,
                        json=payload,
                        timeout=60,
                    )
                except Exception as exc:
                    last_error = f"Сетевой сбой: {exc}"
                    if attempt < 2:
                        time.sleep(3)
                        continue
                    break

                if resp.status_code == 503:
                    last_error = "Модель прогревается, повторите запрос через несколько секунд."
                    if attempt < 2:
                        time.sleep(3)
                        continue
                    break

                if resp.status_code in (404, 410):
                    last_error = f"Эндпоинт HF ({endpoint}) недоступен: {resp.status_code}"
                    break

                if resp.status_code >= 400:
                    try:
                        err_json = resp.json()
                        err_text = err_json.get("error") or str(err_json)
                    except Exception:
                        err_text = resp.text[:300]
                    raise RuntimeError(f"Ошибка Hugging Face API ({resp.status_code}): {err_text}")

                data = resp.json()
                if isinstance(data, dict) and data.get("error"):
                    raise RuntimeError(f"Hugging Face API: {data.get('error')}")

                if isinstance(data, list) and len(data) == len(images_bytes_list):
                    return data
                return []

        raise RuntimeError(last_error or "Не удалось классифицировать изображения (batch).")

    def _classify(self, image_bytes):
        data = self._hf_inference(image_bytes)
        return self._normalize_hf_result(data)

    def _make_chart_data(self, top5):
        points = []
        for item in top5[:5]:
            label = str(item.get("label", "unknown"))
            score_pct = float(item.get("score", 0))
            points.append({"name": label, "value": round(score_pct / 100.0, 4)})

        return {
            "type": "bar",
            "data": points,
            "xKey": "name",
            "yKey": "value",
            "label": "Уверенность модели",
        }

    def _image_response(self, metric, message, mode, image_b64="", recognition=None, xai=None, explanation_text="", chart_data=None):
        rec = recognition or {"top1_label": "unavailable", "top1_score": 0, "top5": []}
        return {
            "metric": metric,
            "message": message,
            "total_samples": None, "train_size": None, "test_size": None,
            "errors_count": None, "confusion_matrix": None, "confusion_labels": None,
            "examples_correct": None, "examples_incorrect": None, "model_insights": None,
            "generation_steps": None, "mode": mode, "image_b64": image_b64,
            "recognition": rec, "xai": xai, "level_check": None, "explanation_text": explanation_text,
            "chartData": chart_data or self._make_chart_data(rec.get("top5", [])),
        }

    def run_beginner(self, params):
        image_b64 = str(params.get("image_b64", ""))
        if not image_b64:
            return self._image_response(
                0.0, "Изображение не передано.", "image", image_b64,
                explanation_text="Загрузите изображение и запустите распознавание.",
                chart_data=self._make_chart_data([]),
            )

        try:
            image_bytes = self._decode_image(image_b64)
            recognition, xai = self._run_classify_and_xai(image_bytes)
            top_score = float(recognition.get("top1_score", 0))
            top_score_text = f"{top_score:.2f}" if top_score < 1 else str(int(round(top_score)))
            return self._image_response(
                round(top_score / 100.0, 4),
                f"ИИ уверен на {top_score_text}%: {recognition.get('top1_label', 'unknown')}",
                "image", image_b64, recognition, xai,
                "Модель получила изображение и вернула top-5 наиболее вероятных классов. "
                "Подписи дополнительно сопоставляются с Wikimedia. "
                "Тепловая карта XAI показывает, какие области влияют на уверенность модели.",
            )
        except Exception as exc:
            return self._image_response(
                0.0, f"Не удалось распознать: {exc}", "image", image_b64,
                explanation_text="Сервис классификации недоступен. Проверьте HF_TOKEN и сеть.",
                chart_data=self._make_chart_data([]),
            )

    def run_researcher(self, model_type, params):
        _ = model_type
        _ = params
        return self._image_response(
            0.0, "Режим «Начинающий исследователь» находится в разработке.", "stub",
            explanation_text="Этот режим временно недоступен.",
            chart_data=self._make_chart_data([]),
        )
