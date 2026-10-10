import { randomBytes, randomUUID } from "node:crypto";

function clean(value, max = 256) {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result.length > 0 && result.length <= max ? result : null;
}

export class GameSessionService {
  #sessions = new Map();
  #profiles = new Map();

  linkValidatedSubject(subject, displayName = "") {
    const normalized = clean(subject);
    if (!normalized) return { ok: false, error: "invalid_subject" };

    if (!this.#profiles.has(normalized)) {
      this.#profiles.set(normalized, {
        playerId: randomUUID(),
        subject: normalized,
        displayName: clean(displayName, 32) || "",
      });
    }

    return { ok: true, profile: { ...this.#profiles.get(normalized) } };
  }

  issueForValidatedSubject(subject, lifetimeSeconds = 900) {
    const linked = this.linkValidatedSubject(subject);
    if (!linked.ok) return linked;

    const sessionId = randomUUID();
    const token = randomBytes(32).toString("base64url");
    const session = {
      sessionId,
      playerId: linked.profile.playerId,
      token,
      expiresAt: new Date(Date.now() + Math.max(60, lifetimeSeconds) * 1000).toISOString(),
      revoked: false,
    };

    this.#sessions.set(token, session);
    return { ok: true, session: { ...session } };
  }

  validate(token) {
    const session = this.#sessions.get(token);
    if (!session) return { ok: false, error: "invalid_session" };
    if (session.revoked) return { ok: false, error: "revoked_session" };
    if (new Date(session.expiresAt).getTime() <= Date.now())
      return { ok: false, error: "expired_session" };
    return { ok: true, session: { ...session } };
  }

  revoke(token) {
    const session = this.#sessions.get(token);
    if (!session) return false;
    session.revoked = true;
    return true;
  }
}
