import { getDistance } from "../utils/getDistance";

describe("getDistance", () => {
  it("returns 0 for identical points", () => {
    const point = { lng: 2.3522, lat: 48.8566 };
    const distance = getDistance(point, point);

    expect(distance).toBeCloseTo(0, 10);
  });

  it("is symmetric (A->B equals B->A)", () => {
    const paris = { lng: 2.3522, lat: 48.8566 };
    const london = { lng: -0.1276, lat: 51.5072 };

    const parisToLondon = getDistance(paris, london);
    const londonToParis = getDistance(london, paris);

    expect(parisToLondon).toBeCloseTo(londonToParis, 10);
  });

  it("returns an expected order of magnitude for Paris-London", () => {
    const paris = { lng: 2.3522, lat: 48.8566 };
    const london = { lng: -0.1276, lat: 51.5072 };

    const distance = getDistance(paris, london);

    expect(distance).toBeGreaterThan(330);
    expect(distance).toBeLessThan(360);
  });
});
