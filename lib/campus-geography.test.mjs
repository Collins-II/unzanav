import assert from "node:assert/strict";
import { test } from "node:test";
import { campuses, campusFor } from "./campus-geography.ts";

test("student map geography recognizes both UNZA campuses", () => {
  for (const campus of campuses) assert.equal(campusFor({ latitude: campus.centre[0], longitude: campus.centre[1] })?.id, campus.id);
});
test("student map excludes city-centre, off-campus corners and invalid coordinates", () => {
  assert.equal(campusFor({ latitude: -15.4167, longitude: 28.2833 }), undefined);
  assert.equal(campusFor({ latitude: -15.402, longitude: 28.3227 }), undefined);
  assert.equal(campusFor({ latitude: NaN, longitude: 28.33 }), undefined);
});
test("outline vertices are accepted and each outline stays inside its map extent", () => {
  for (const campus of campuses) {
    for (const [longitude, latitude] of campus.polygon) {
      assert.equal(campusFor({ latitude, longitude })?.id, campus.id);
      assert.ok(latitude >= campus.bounds[0][0] && latitude <= campus.bounds[1][0]);
      assert.ok(longitude >= campus.bounds[0][1] && longitude <= campus.bounds[1][1]);
    }
  }
});
