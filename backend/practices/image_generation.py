"""
Image generation practice — demonstrates the diffusion concept.

Shows how a generative process transforms pure noise into a recognizable
digit image step by step. An independent kNN recognizer evaluates each step.

The generation uses cosine interpolation between noise and a real digit
to produce a reliable, visually clear demonstration of the denoising idea
behind Stable Diffusion, DALL-E and similar models.
"""

import numpy as np
from sklearn.neighbors import KNeighborsClassifier

from practices.base import BasePractice
from practices.dataset import DigitsDataset

T = 10


def _cosine_alpha_bars(num_steps, s=0.008):
    t = np.arange(num_steps + 1) / num_steps
    f = np.cos((t + s) / (1 + s) * np.pi / 2) ** 2
    return np.clip(f[1:] / f[0], 0.001, 0.999)


ALPHA_BARS = _cosine_alpha_bars(T)


class ImageGenerationPractice(BasePractice):
    def __init__(self, dataset: DigitsDataset):
        self.data = dataset
        self._recognizer = KNeighborsClassifier(n_neighbors=5)
        self._recognizer.fit(self.data.X, self.data.y)

    # ── helpers ──────────────────────────────────────────────

    def _pick_target(self, digit, seed):
        """Pick a typical-looking digit from the dataset (close to class mean)."""
        indices = np.where(self.data.y == digit)[0]
        class_data = self.data.X[indices]
        mean = class_data.mean(axis=0)
        distances = np.linalg.norm(class_data - mean, axis=1)
        top_n = min(10, len(indices))
        best = indices[np.argsort(distances)[:top_n]]
        rng = np.random.RandomState(seed)
        return self.data.X[rng.choice(best)]

    def get_dataset_samples(self, digit, n=20):
        """Return n random images of the given digit from the dataset."""
        indices = np.where(self.data.y == digit)[0]
        if len(indices) == 0:
            return []
        n = min(n, len(indices))
        chosen = np.random.choice(indices, size=n, replace=False)
        return [self.data.X[i].reshape(8, 8).tolist() for i in chosen]

    def _get_training_examples(self, digit, n=4):
        indices = np.where(self.data.y == digit)[0]
        if len(indices) <= n:
            selected = indices
        else:
            step = len(indices) // n
            selected = indices[::step][:n]
        return [self.data.X[i].reshape(8, 8).tolist() for i in selected]

    def _find_representative(self, digit):
        indices = np.where(self.data.y == digit)[0]
        if len(indices) == 0:
            return 0
        class_data = self.data.X[indices]
        mean = class_data.mean(axis=0)
        return int(indices[np.argmin(np.linalg.norm(class_data - mean, axis=1))])

    # ── recognizer ───────────────────────────────────────────

    def _evaluate(self, x_norm, digit):
        x_16 = np.clip(x_norm * 16.0, 0, 16).reshape(1, -1)

        pred = int(self._recognizer.predict(x_16)[0])
        proba = self._recognizer.predict_proba(x_16)[0]
        confidence = int(round(proba[digit] * 100))

        distances, indices = self._recognizer.kneighbors(x_16, n_neighbors=1)
        nn_idx = int(indices[0][0])

        return {
            "predicted": pred,
            "confidence": confidence,
            "nn_label": int(self.data.y[nn_idx]),
            "nn_dist": round(float(distances[0][0]), 1),
            "nn_pixels": self.data.X[nn_idx].reshape(8, 8).tolist(),
        }

    # ── generation (interpolation simulation) ────────────────

    def _generate_trajectory(self, target_16, seed):
        """Noise → digit via cosine interpolation with diminishing perturbation."""
        target = target_16 / 16.0
        rng = np.random.RandomState(seed)
        noise = rng.randn(64)

        trajectory = [noise.copy()]
        for step in range(1, T + 1):
            progress = step / T
            alpha = (1 - np.cos(progress * np.pi)) / 2
            perturbation = rng.randn(64) * max(0, 0.12 * (1 - progress))
            x = alpha * target + (1 - alpha) * noise + perturbation
            x = np.clip(x, 0, 1)
            trajectory.append(x.copy())

        return trajectory

    # ── forward demo (real noise addition) ───────────────────

    def _forward_demo(self, image_16):
        x_0 = image_16 / 16.0
        rng = np.random.RandomState(42)
        noise = rng.randn(64)

        show_at = np.linspace(0, T - 1, 5, dtype=int)
        result = []
        for t in show_at:
            alpha_bar = ALPHA_BARS[t]
            x_t = np.sqrt(alpha_bar) * x_0 + np.sqrt(1 - alpha_bar) * noise
            noise_pct = int(np.sqrt(1 - alpha_bar) * 100)
            result.append({
                "pixels": np.clip(x_t * 16, 0, 16).reshape(8, 8).tolist(),
                "label": f"~{noise_pct}% шума",
            })
        return result

    # ── main pipeline ────────────────────────────────────────

    _PHASES = {
        "noise": {
            "title": "Чистый шум",
            "desc": (
                "Случайные значения в каждом пикселе. "
                "Модель не имеет информации об изображении "
                "и начинает процесс генерации с нуля."
            ),
        },
        "early": {
            "title": "Ранняя фаза",
            "desc": (
                "Модель делает первые грубые исправления: "
                "убирает сильные выбросы шума и начинает формировать "
                "общую структуру. На этом этапе ещё сложно "
                "угадать цифру."
            ),
        },
        "forming": {
            "title": "Проступает форма",
            "desc": (
                "Основная структура цифры становится видна: "
                "где проходят линии, где фон. Это ключевой момент — "
                "из хаоса возникает узнаваемый образ."
            ),
        },
        "refining": {
            "title": "Финальная доработка",
            "desc": (
                "Модель уточняет детали: толщину линий, "
                "чёткость границ, контрастность. "
                "Основная форма уже определена."
            ),
        },
        "done": {
            "title": "Готовое изображение",
            "desc": (
                "Процесс генерации завершён. Модель создала "
                "изображение цифры, которое можно сравнить "
                "с реальными примерами из датасета."
            ),
        },
    }

    def _generate(self, digit, seed):
        target_16 = self._pick_target(digit, seed)
        trajectory = self._generate_trajectory(target_16, seed)

        generation_steps = []
        chart_data = []
        prev_raw = None

        for i, x in enumerate(trajectory):
            x_clipped = np.clip(x, 0, 1)
            raw = x_clipped * 16.0
            pixels = np.clip(raw, 0, 16).reshape(8, 8).tolist()

            ev = self._evaluate(x_clipped, digit)

            if i == 0:
                phase_key = "noise"
            elif i == len(trajectory) - 1:
                phase_key = "done"
            elif i <= 3:
                phase_key = "early"
            elif i <= 7:
                phase_key = "forming"
            else:
                phase_key = "refining"

            phase = self._PHASES[phase_key]
            n_changed = None

            step_dict = {
                "step": i,
                "pixels": pixels,
                "quality_pct": ev["confidence"],
                "recognized_as": ev["predicted"],
                "nn_pixels": ev["nn_pixels"],
                "nn_label": ev["nn_label"],
                "label": f"Шаг {i} из {T}" if 0 < i < len(trajectory) - 1 else phase["title"],
                "phase_title": phase["title"],
                "phase_description": phase["desc"],
                "pixels_total": 64,
            }

            chart_data.append({
                "name": str(i),
                "value": round(ev["confidence"] / 100, 3),
            })

            if prev_raw is not None:
                diff = raw - prev_raw
                step_dict["diff_pixels"] = np.clip(diff, -16, 16).reshape(8, 8).tolist()
                n_changed = int(np.sum(np.abs(diff) > 0.5))

            step_dict["pixels_changed"] = n_changed

            prev_raw = raw.copy()
            generation_steps.append(step_dict)

        # Forward process strip
        sample_idx = self._find_representative(digit)
        forward_raw = self._forward_demo(self.data.X[sample_idx])
        forward_steps = [{
            "pixels": self.data.X[sample_idx].reshape(8, 8).tolist(),
            "label": "Оригинал",
        }] + forward_raw + [{
            "pixels": (np.random.RandomState(42).randn(64).clip(-3, 3) / 6 * 16 + 8
                       ).clip(0, 16).reshape(8, 8).tolist(),
            "label": "Чистый шум",
        }]

        training_examples = self._get_training_examples(digit)
        target_pixels_2d = np.clip(target_16, 0, 16).reshape(8, 8).tolist()
        final_confidence = generation_steps[-1]["quality_pct"]

        return {
            "metric": round(final_confidence / 100, 4),
            "message": f"Генерация цифры «{digit}»",
            "total_samples": len(self.data.X),
            "train_size": None,
            "test_size": None,
            "errors_count": None,
            "confusion_matrix": None,
            "confusion_labels": None,
            "examples_correct": None,
            "examples_incorrect": None,
            "model_insights": None,
            "generation_steps": generation_steps,
            "forward_steps": forward_steps,
            "generation_training_examples": training_examples,
            "generation_target_pixels": target_pixels_2d,
            "generation_digit": digit,
            "explanation_text": (
                "Здесь показан принцип работы диффузионных моделей: "
                "начиная с чистого шума, процесс шаг за шагом убирает его, "
                "пока не получится изображение. "
                "Независимый распознаватель (kNN) оценивает результат на каждом шаге. "
                "Этот принцип лежит в основе Stable Diffusion, DALL-E "
                "и других современных генераторов изображений."
            ),
            "chartData": {
                "type": "line",
                "data": chart_data,
                "xKey": "name",
                "yKey": "value",
                "label": "Уверенность распознавателя",
            },
        }

    def run_beginner(self, params):
        digit = max(0, min(9, int(params.get("digit", 5))))
        seed = digit * 7 + 42
        return self._generate(digit, seed)

    def run_researcher(self, model_type, params):
        digit = max(0, min(9, int(params.get("digit", 5))))
        seed = int(params.get("seed", 42))
        return self._generate(digit, seed)
