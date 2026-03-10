from practices.dataset import DigitsDataset
from practices.image_generation import ImageGenerationPractice
from practices.trick_the_ai import TrickTheAIPractice

_practice_cache = {}


def _get_practice(practice_id):
    if practice_id in _practice_cache:
        return _practice_cache[practice_id]
    if practice_id == "image-generation":
        digits_data = DigitsDataset().load().preprocess()
        practice = ImageGenerationPractice(digits_data)
        _practice_cache[practice_id] = practice
        return practice
    if practice_id == "trick-the-ai":
        practice = TrickTheAIPractice()
        _practice_cache[practice_id] = practice
        return practice
    return None


class Registry:
    def get(self, key, default=None):
        return _get_practice(key) or default


registry = Registry()
