import test from "node:test";
import assert from "node:assert/strict";
import { PlayerProfileAuthorityService } from "../src/services/player-profile-authority.mjs";
import { playerProfileAuthorityRuntime } from "../src/profile-authority-contracts.mjs";

test("profile authority stores stable game id plus external subject reference", () => {
  const service = new PlayerProfileAuthorityService();
  const first = service.linkExternalSubject({
    provider: "BazID",
    subjectReference: "subject-1",
    displayName: "Player One",
  });
  const second = service.linkExternalSubject({
    provider: "BazID",
    subjectReference: "subject-1",
  });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.profile.playerId, second.profile.playerId);
  assert.equal(second.created, false);
});

test("profile lifecycle can disable and mark deletion-request state", () => {
  const service = new PlayerProfileAuthorityService();
  const created = service.linkExternalSubject({
    subjectReference: "subject-2",
  });

  assert.equal(service.setLifecycleState(created.profile.playerId, "disabled").ok, true);
  assert.equal(service.updateDisplayName(created.profile.playerId, "Nope").error, "player_profile_not_active");
  assert.equal(service.setLifecycleState(created.profile.playerId, "deletion-requested").ok, true);
});

test("profile audit captures lifecycle changes without credentials", () => {
  const service = new PlayerProfileAuthorityService();
  const created = service.linkExternalSubject({
    subjectReference: "subject-3",
    displayName: "P3",
  });
  service.updateDisplayName(created.profile.playerId, "PThree");
  const events = service.audit(created.profile.playerId);
  assert.ok(events.length >= 2);
  assert.equal("password" in created.profile, false);
  assert.equal("token" in created.profile, false);
});

test("contract explicitly forbids credential storage in player profiles", () => {
  assert.match(playerProfileAuthorityRuntime.storageRule, /never store BazID passwords/i);
});
