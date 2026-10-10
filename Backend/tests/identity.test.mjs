import test from "node:test";
import assert from "node:assert/strict";
import { GameSessionService } from "../src/services/sessions.mjs";
import { IdentityAuditService } from "../src/services/identity-audit.mjs";
import { IdentityBoundaryService } from "../src/services/identity-boundary.mjs";
import { DataDeletionRequestService } from "../src/services/data-deletion-requests.mjs";
import { bazIdAuthBoundary } from "../src/identity-contracts.mjs";

test("identity contract keeps BazID external and PKCE-based", () => {
  assert.equal(bazIdAuthBoundary.providerRole, "external-identity-provider");
  assert.equal(bazIdAuthBoundary.flow, "authorization-code-with-pkce");
  assert.match(bazIdAuthBoundary.productionBoundary, /not implemented/i);
});

test("identity boundary only accepts externally validated unexpired claims", () => {
  const sessions = new GameSessionService();
  const audit = new IdentityAuditService();
  const identity = new IdentityBoundaryService({ sessions, audit });

  assert.equal(identity.acceptValidatedClaims({
    issuer: "https://issuer.example",
    audience: "tfm-client",
    subject: "subject-1",
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    signatureValidated: false,
  }).error, "identity_signature_not_validated");

  const accepted = identity.acceptValidatedClaims({
    issuer: "https://issuer.example",
    audience: "tfm-client",
    subject: "subject-1",
    displayName: "Player",
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    signatureValidated: true,
  });
  assert.equal(accepted.ok, true);
  assert.ok(accepted.session.token);
  assert.equal(audit.recent().length, 1);
});

test("game session can be revoked through identity boundary", () => {
  const sessions = new GameSessionService();
  const audit = new IdentityAuditService();
  const identity = new IdentityBoundaryService({ sessions, audit });
  const accepted = identity.acceptValidatedClaims({
    issuer: "https://issuer.example",
    audience: "tfm-client",
    subject: "subject-2",
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    signatureValidated: true,
  });

  assert.equal(identity.revokeSession(accepted.session.token).ok, true);
  assert.equal(sessions.validate(accepted.session.token).error, "revoked_session");
});

test("data deletion request has controlled lifecycle", () => {
  const service = new DataDeletionRequestService();
  const created = service.create({ playerId: "p1" });
  assert.equal(created.ok, true);
  assert.equal(service.update(created.request.requestId, "reviewing").ok, true);
  assert.equal(service.update(created.request.requestId, "completed").request.state, "completed");
});
