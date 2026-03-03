# Реестр практик. При добавлении новых практик — добавьте импорт и запись в registry.
from practices.dataset import DigitsDataset
from practices.image_generation import ImageGenerationPractice

digits_data = DigitsDataset().load().preprocess()

registry = {
    "image-generation": ImageGenerationPractice(digits_data),
}
