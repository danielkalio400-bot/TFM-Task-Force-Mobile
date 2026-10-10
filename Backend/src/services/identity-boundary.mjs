export class IdentityBoundaryService {
  constructor({ sessions, audit }) {
    this.sessions = sessions;
    this.audit = audit;
  }

  acceptValidatedClaims(input) {
    const issuer = String(input?.issuer || "").trim();
    const audience = String(input?.audience || "").trim();
    const subject = String(input?.subject || "").trim();
    const displayName = String(input?.displayName || "").trim().slice(0, 32);
    const expiresAt = input?.expiresAt ? Date.parse(String(input.expiresAt)) : NaN;
    const signatureValidated = input?.signatureValidated === true;

    if (!issuer || !audience || !subject || !Number.isFinite(expiresAt))
      return { ok: false, error: "invalid_identity_claims" };
    if (!signatureValidated)
      return { ok: false, error: "identity_signature_not_validated" };
    if (expiresAt <= Date.now())
      return { ok: false, error: "identity_claims_expired" };

    const linked = this.sessions.linkValidatedSubject(subject, displayName);
    if (!linked.ok) return linked;

    const issued = this.sessions.issueForValidatedSubject(subject, 900);
    if (!issued.ok) return issued;

    this.audit.record({
      type: "identity-session-issued",
      subjectRef: subject,
      playerId: issued.session.playerId,
      details: { issuer, audience },
    });

    return {
      ok: true,
      profile: linked.profile,
      session: issued.session,
      validation: {
        issuer,
        audience,
        signatureValidated: true,
        expiresAt: new Date(expiresAt).toISOString(),
        cryptographicVerificationPerformedBy: "external-trusted-validator-placeholder",
      },
    };
  }

  revokeSession(token, subjectRef = "") {
    const revoked = this.sessions.revoke(String(token || ""));
    this.audit.record({
      type: revoked ? "identity-session-revoked" : "identity-session-revoke-miss",
      subjectRef: String(subjectRef || ""),
      details: {},
    });
    return { ok: revoked };
  }
}
