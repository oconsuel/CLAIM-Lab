from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Optional

from practices import registry

app = FastAPI(title="CLAIM Lab API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class BeginnerRequest(BaseModel):
    practice_id: str
    params: dict[str, Any]


class ResearcherRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    practice_id: str
    model_type: str
    params: dict[str, Any]


class EngineerRequest(BaseModel):
    practice_id: str
    code: str


class RunResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    metric: float
    message: str
    total_samples: Optional[int] = None
    train_size: Optional[int] = None
    test_size: Optional[int] = None
    errors_count: Optional[int] = None
    confusion_matrix: Optional[list] = None
    confusion_labels: Optional[list[str]] = None
    examples_correct: Optional[list[dict]] = None
    examples_incorrect: Optional[list[dict]] = None
    model_insights: Optional[dict] = None
    explanation_text: Optional[str] = None
    chartData: Optional[dict] = None

    # CV
    test_images: Optional[list[dict]] = None
    neighbors: Optional[dict] = None

    # NLP
    word_highlights: Optional[list[dict]] = None

    # Generative
    original_images: Optional[list[list]] = None
    reconstructed_images: Optional[list[list]] = None

    # Generator / Representation
    generation_steps: Optional[list[dict]] = None
    forward_steps: Optional[list[dict]] = None
    generation_training_examples: Optional[list] = None
    generation_target_pixels: Optional[list] = None
    generation_digit: Optional[int] = None

    # Recommender
    recommendation_explanations: Optional[list[dict]] = None


@app.post("/run-beginner")
async def run_beginner(req: BeginnerRequest):
    practice = registry.get(req.practice_id)
    if not practice:
        return {"metric": 0, "message": "Практика не найдена"}
    return practice.run_beginner(req.params)


@app.post("/run-researcher")
async def run_researcher(req: ResearcherRequest):
    practice = registry.get(req.practice_id)
    if not practice:
        return {"metric": 0, "message": "Практика не найдена"}
    return practice.run_researcher(req.model_type, req.params)


@app.post("/run-engineer")
async def run_engineer(req: EngineerRequest):
    return {
        "status": "disabled",
        "message": "Раздел находится в разработке. Скоро здесь можно будет писать собственный код.",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/practices/image-generation/dataset-samples")
async def get_image_generation_samples(digit: int = 0):
    """Return 20 random images of the given digit from the dataset."""
    practice = registry.get("image-generation")
    if not practice:
        return {"digit": digit, "samples": []}
    samples = practice.get_dataset_samples(digit=max(0, min(9, digit)), n=20)
    return {"digit": digit, "samples": samples}
