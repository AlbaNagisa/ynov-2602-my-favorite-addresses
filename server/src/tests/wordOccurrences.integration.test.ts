import { Router } from "express";
import { createMockRes } from "./testHelpers";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countWordOccurrences(text: string, word: string): number {
  const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, "gi");
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function createWordCountRouter() {
  const router = Router();

  router.post("/count-occurrences", (req, res) => {
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

  return router;
}

function getPostHandler(router: Router, path: string) {
  const layer = (router as any).stack.find(
    (entry: any) => entry.route?.path === path && entry.route?.methods?.post,
  );

  if (!layer) {
    throw new Error(`Route POST ${path} not found`);
  }

  return layer.route.stack[0].handle as (req: any, res: any) => unknown | Promise<unknown>;
}

describe("Word occurrences mini API", () => {
  it("POST /count-occurrences returns the number of occurrences", async () => {
    const router = createWordCountRouter();
    const handler = getPostHandler(router, "/count-occurrences");
    const req: any = {
      text: "test test TEST tester re-test test",
      word: "test",
    };
    req.body = { text: req.text, word: req.word };
    const res = createMockRes();

    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith({ count: 5 });
  });

  it("POST /count-occurrences returns 400 when payload is invalid", async () => {
    const router = createWordCountRouter();
    const handler = getPostHandler(router, "/count-occurrences");
    const req: any = {
      body: {
        text: "anything",
        word: "",
      },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "text and word are required" });
  });
});
