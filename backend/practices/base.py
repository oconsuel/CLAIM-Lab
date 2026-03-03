from abc import ABC, abstractmethod
from typing import Any


class BasePractice(ABC):
    @abstractmethod
    def run_beginner(self, params: dict[str, Any]) -> dict:
        ...

    @abstractmethod
    def run_researcher(self, model_type: str, params: dict[str, Any]) -> dict:
        ...

    def run_engineer(self, code: str) -> dict:
        return {
            "status": "disabled",
            "message": "Раздел находится в разработке. Скоро здесь можно будет писать собственный код.",
        }
