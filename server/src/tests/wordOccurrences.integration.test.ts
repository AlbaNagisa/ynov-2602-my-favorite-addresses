import express from "express";
import request from "supertest";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countWordOccurrences(text: string, word: string): number {
  const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, "gi");
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function createWordCountApp() {
  const app = express();
  app.use(express.json());

  app.post("/count-occurrences", (req, res) => {
    const text = req.body?.text;
    const word = req.body?.word;

    if (
      typeof text !== "string" ||
      typeof word !== "string" ||
      word.trim().length === 0
    ) {
      return res.status(400).json({ message: "text and word are required" });
    }

    return res.json({
      count: countWordOccurrences(text, word.trim()),
    });
  });

  return app;
}

describe("Word occurrences mini API", () => {
  it("POST /count-occurrences returns the number of occurrences", async () => {
    const app = createWordCountApp();

    const response = await request(app).post("/count-occurrences").send({
      text: "test test TEST tester re-test test",
      word: "test",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ count: 5 });
  });

  it("POST /count-occurrences returns 400 when payload is invalid", async () => {
    const app = createWordCountApp();

    const response = await request(app).post("/count-occurrences").send({
      text: "anything",
      word: "",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "text and word are required" });
  });
});
