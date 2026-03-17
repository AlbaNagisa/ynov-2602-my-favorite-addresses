import { filter, map } from "../utils/arrayCallbacks";

describe("arrayCallbacks.map", () => {
  it("transforms each value and calls the callback with each item", () => {
    const transformSpy = jest.fn((item: number) => item * 10);

    const result = map([1, 2, 3], transformSpy);

    expect(result).toEqual([10, 20, 30]);
    expect(transformSpy).toHaveBeenCalledTimes(3);
    expect(transformSpy).toHaveBeenNthCalledWith(1, 1);
    expect(transformSpy).toHaveBeenNthCalledWith(2, 2);
    expect(transformSpy).toHaveBeenNthCalledWith(3, 3);
  });

  it("returns an empty array and never calls callback for empty input", () => {
    const transformSpy = jest.fn((item: number) => item * 2);

    const result = map([], transformSpy);

    expect(result).toEqual([]);
    expect(transformSpy).not.toHaveBeenCalled();
  });
});

describe("arrayCallbacks.filter", () => {
  it("keeps only items matching predicate and calls predicate for each item", () => {
    const predicateSpy = jest.fn((item: number) => item % 2 === 0);

    const result = filter([1, 2, 3, 4], predicateSpy);

    expect(result).toEqual([2, 4]);
    expect(predicateSpy).toHaveBeenCalledTimes(4);
    expect(predicateSpy).toHaveBeenNthCalledWith(1, 1);
    expect(predicateSpy).toHaveBeenNthCalledWith(2, 2);
    expect(predicateSpy).toHaveBeenNthCalledWith(3, 3);
    expect(predicateSpy).toHaveBeenNthCalledWith(4, 4);
  });

  it("returns an empty array when predicate never matches", () => {
    const predicateSpy = jest.fn((item: number) => item > 10);

    const result = filter([1, 2, 3], predicateSpy);

    expect(result).toEqual([]);
    expect(predicateSpy).toHaveBeenCalledTimes(3);
  });
});
