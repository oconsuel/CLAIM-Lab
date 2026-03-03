from abc import ABC, abstractmethod
from pathlib import Path
import numpy as np

DATA_DIR = Path(__file__).parent.parent / "data"


class BaseDataset(ABC):
    """
    Абстракция для загрузки и подготовки данных.
    Позволяет в будущем заменить источник (CSV → загрузка пользователем через POST).
    """

    def __init__(self):
        self._raw = None

    @abstractmethod
    def load(self):
        ...

    @abstractmethod
    def preprocess(self, **kwargs):
        ...

    def split(self, test_size=0.3, random_state=42):
        from sklearn.model_selection import train_test_split
        indices = np.arange(len(self._y))
        return train_test_split(indices, test_size=test_size, random_state=random_state)


class SpamDataset(BaseDataset):
    LABEL_MAP = {"спам": 1, "не_спам": 0}
    LABEL_NAMES = {0: "не_спам", 1: "спам"}

    def load(self):
        import pandas as pd
        self._raw = pd.read_csv(DATA_DIR / "spam_messages.csv")
        self._texts = self._raw["text"].tolist()
        self._labels = self._raw["label"].map(self.LABEL_MAP).values
        return self

    def preprocess(self, max_features=200):
        from sklearn.feature_extraction.text import TfidfVectorizer
        self._vectorizer = TfidfVectorizer(max_features=max_features)
        self._X = self._vectorizer.fit_transform(self._texts).toarray()
        self._y = self._labels
        self._feature_names = self._vectorizer.get_feature_names_out()
        return self

    @property
    def texts(self):
        return self._texts

    @property
    def X(self):
        return self._X

    @property
    def y(self):
        return self._y

    @property
    def feature_names(self):
        return self._feature_names

    @property
    def vectorizer(self):
        return self._vectorizer


class SentimentDataset(BaseDataset):
    LABEL_MAP = {"отрицательный": 0, "положительный": 1}
    LABEL_NAMES = {0: "отрицательный", 1: "положительный"}

    def load(self):
        import pandas as pd
        self._raw = pd.read_csv(DATA_DIR / "sentiment_reviews.csv")
        self._texts = self._raw["text"].tolist()
        self._labels = self._raw["label"].map(self.LABEL_MAP).values
        return self

    def preprocess(self, max_features=300):
        from sklearn.feature_extraction.text import TfidfVectorizer
        self._vectorizer = TfidfVectorizer(max_features=max_features)
        self._X = self._vectorizer.fit_transform(self._texts).toarray()
        self._y = self._labels
        self._feature_names = self._vectorizer.get_feature_names_out()
        return self

    @property
    def texts(self):
        return self._texts

    @property
    def X(self):
        return self._X

    @property
    def y(self):
        return self._y

    @property
    def feature_names(self):
        return self._feature_names

    @property
    def vectorizer(self):
        return self._vectorizer


class DigitsDataset(BaseDataset):
    def load(self):
        from sklearn.datasets import load_digits
        self._digits = load_digits()
        return self

    def preprocess(self, normalize=False):
        self._X = self._digits.data.copy()
        if normalize:
            self._X = self._X / 16.0
        self._y = self._digits.target.copy()
        return self

    @property
    def X(self):
        return self._X

    @property
    def y(self):
        return self._y


class RecommenderDataset(BaseDataset):
    ITEM_NAMES = [
        "Ноутбук", "Наушники", "Клавиатура", "Монитор", "USB-хаб", "Веб-камера", "SSD",
        "Кроссовки", "Гантели", "Коврик", "Мяч", "Фитнес-браслет", "Скакалка", "Бутылка",
        "Краски", "Альбом", "Карандаши", "Глина", "Холст", "Кисти",
    ]
    USER_NAMES = [f"Пользователь_{i + 1}" for i in range(30)]
    USER_GROUPS = {
        "Технари": list(range(0, 10)),
        "Спортсмены": list(range(10, 20)),
        "Творческие": list(range(20, 30)),
    }
    ITEM_GROUPS = {
        "Гаджеты": list(range(0, 7)),
        "Спорттовары": list(range(7, 14)),
        "Творчество": list(range(14, 20)),
    }

    def load(self):
        import pandas as pd
        self._raw = pd.read_csv(DATA_DIR / "recommender_ratings.csv")
        return self

    def preprocess(self):
        user_idx = {u: i for i, u in enumerate(self.USER_NAMES)}
        item_idx = {it: i for i, it in enumerate(self.ITEM_NAMES)}

        n_users = len(self.USER_NAMES)
        n_items = len(self.ITEM_NAMES)
        self._ratings = np.full((n_users, n_items), np.nan)

        for _, row in self._raw.iterrows():
            u = user_idx.get(row["user"])
            i = item_idx.get(row["item"])
            if u is not None and i is not None:
                self._ratings[u, i] = row["rating"]
        return self

    @property
    def ratings(self):
        return self._ratings

    @property
    def user_names(self):
        return self.USER_NAMES

    @property
    def item_names(self):
        return self.ITEM_NAMES

    def find_user_group(self, user_idx):
        for name, indices in self.USER_GROUPS.items():
            if user_idx in indices:
                return name
        return "Неизвестная"
