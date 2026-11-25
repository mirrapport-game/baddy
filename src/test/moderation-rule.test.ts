import { describe, expect, it } from "vitest";
import { submitBlockReason, type Product } from "@/lib/store";

const p = { steps: [{ title: "a", body: "b" }, { title: "c", body: "d" }], quiz: [{ q: "q", options: ["1", "2"], correct: 0 }] } as unknown as Product;

describe("submit to moderation", () => {
  it("blocks until the author passes 100% of steps", () => {
    expect(submitBlockReason(p, { done: [0], quizScore: 100 })).not.toBeNull();
  });
  it("blocks when quiz is below 80%", () => {
    expect(submitBlockReason(p, { done: [0, 1], quizScore: 79 })).not.toBeNull();
  });
  it("allows at 100% steps and quiz 80%", () => {
    expect(submitBlockReason(p, { done: [0, 1], quizScore: 80 })).toBeNull();
  });
});
