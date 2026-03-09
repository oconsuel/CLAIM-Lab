from practices.dataset import DigitsDataset
from practices.image_generation import ImageGenerationPractice
from practices.trick_the_ai import TrickTheAIPractice

digits_data = DigitsDataset().load().preprocess()

registry = {
    "image-generation": ImageGenerationPractice(digits_data),
    "trick-the-ai": TrickTheAIPractice(),
}
