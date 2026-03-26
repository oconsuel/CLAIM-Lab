import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "https://ai.philippovich.ru";

// Use your real base64 image via IMAGE_B64 env for representative measurements.
// Fallback is a tiny valid image to keep the script runnable out of the box.
const FALLBACK_IMAGE_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAgMBgN6hA7cAAAAASUVORK5CYII=";

const IMAGE_B64 = __ENV.IMAGE_B64 || FALLBACK_IMAGE_B64;

export const options = {
  scenarios: {
    one_iteration_30_users: {
      executor: "per-vu-iterations",
      vus: 30,
      iterations: 1,
      maxDuration: "5m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<60000", "p(99)<90000"],
  },
};

export default function () {
  const payload = JSON.stringify({
    practice_id: "trick-the-ai",
    params: { image_b64: IMAGE_B64 },
  });

  const res = http.post(`${BASE_URL}/api/run-beginner`, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: "120s",
  });

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response has metric": (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.metric === "number";
      } catch (_) {
        return false;
      }
    },
  });

  sleep(0.2);
}
