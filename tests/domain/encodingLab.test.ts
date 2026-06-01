import { describe, expect, it } from "vitest";
import { compareEncodings, strictEncodeURIComponent } from "../../src/domain/encoding/encodingLab";

describe("encoding lab", () => {
  it("strictly encodes RFC 3986 reserved punctuation", () => {
    expect(strictEncodeURIComponent("!'()*")).toBe("%21%27%28%29%2A");
  });

  it("compares browser and form encodings", () => {
    expect(compareEncodings("a b").encodeURIComponent).toBe("a%20b");
    expect(compareEncodings("a b").form).toBe("a+b");
    expect(compareEncodings("~").strictRfc3986).toBe("~");
  });
});
