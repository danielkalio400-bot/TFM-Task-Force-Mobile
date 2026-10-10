import test from "node:test";
import assert from "node:assert/strict";
import { FriendsService } from "../src/services/friends.mjs";
import { PrivacyService } from "../src/services/privacy.mjs";
import { ClanService } from "../src/services/clans.mjs";
import { SocialPolicyService } from "../src/services/social-policy.mjs";
import { socialPrivacyRuntime } from "../src/social-contracts.mjs";

test("social contract is explicitly privacy and moderation aware", () => {
  assert.ok(socialPrivacyRuntime.systems.includes("friend-requests"));
  assert.ok(socialPrivacyRuntime.systems.includes("player-blocks"));
  assert.ok(socialPrivacyRuntime.systems.includes("clans"));
  assert.match(socialPrivacyRuntime.rule, /privacy settings/i);
});

test("friend request respects recipient privacy and block state", () => {
  const friends = new FriendsService();
  const privacy = new PrivacyService();

  privacy.update("p2", { allowFriendRequests: false });
  assert.equal(friends.sendRequest("p1", "p2", privacy.get("p2")).error, "friend_requests_disabled");

  privacy.update("p2", { allowFriendRequests: true });
  friends.block("p2", "p1");
  assert.equal(friends.sendRequest("p1", "p2", privacy.get("p2")).error, "friend_request_blocked");
});

test("accepted friends can see presence unless target disables it", () => {
  const friends = new FriendsService();
  const privacy = new PrivacyService();
  const clans = new ClanService();
  const policy = new SocialPolicyService({ friends, clans, privacy });

  const request = friends.sendRequest("p1", "p2", privacy.get("p2"));
  friends.respond(request.request.requestId, "p2", true);
  assert.equal(policy.canSeePresence("p1", "p2"), true);

  privacy.update("p2", { showOnlineStatus: false });
  assert.equal(policy.canSeePresence("p1", "p2"), false);
});

test("clan membership supports role checks without bypassing owner transfer", () => {
  const clans = new ClanService();
  const created = clans.create({ ownerPlayerId: "owner", name: "Prime", tag: "PRM" });
  assert.equal(created.ok, true);
  assert.equal(clans.addMember(created.clan.clanId, "p2", "member").ok, true);
  assert.equal(clans.setRole(created.clan.clanId, "owner", "p2", "officer").ok, true);
  assert.equal(clans.removeMember(created.clan.clanId, "owner").error, "owner_transfer_required");
});
