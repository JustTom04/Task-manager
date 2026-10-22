import { secondsToReadable } from "@/frontend/utils";

describe("secondsToReadable utility", () => {
  it("returns '0s' when seconds is 0", () => {
    expect(secondsToReadable(0)).toBe("0s");
  });

  it("formats seconds under a minute correctly", () => {
    expect(secondsToReadable(45)).toBe("45s");
    expect(secondsToReadable(1)).toBe("1s");
  });

  it("converts seconds to minutes correctly", () => {
    expect(secondsToReadable(60)).toBe("1m");
    expect(secondsToReadable(65)).toBe("1m");
    expect(secondsToReadable(120)).toBe("2m");
    expect(secondsToReadable(3599)).toBe("59m");
  });

  it("converts seconds to hours correctly", () => {
    expect(secondsToReadable(3600)).toBe("1h");
    expect(secondsToReadable(7200)).toBe("2h");
  });

  it("converts seconds to days correctly", () => {
    expect(secondsToReadable(86400)).toBe("1d");
    expect(secondsToReadable(172800)).toBe("2d");
  });
});
