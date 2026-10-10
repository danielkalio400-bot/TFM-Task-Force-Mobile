const fail = error => ({ ok:false, error });
const valid = (value,max=160) => typeof value === "string" &&
  value.length>0 && value.length<=max && value.trim()===value &&
  [...value].every(c=>c.charCodeAt(0)>=32);

/**
 * A verified identity is an unforgeable reference (WeakSet membership).
 * Verification is delegated to a trusted OIDC/JWT verifier, never to public
 * boolean claims, decoded unsigned JWTs or the /dev/validated-claims route.
 * The default verifier intentionally always denies.
 */
export class ObjectiveIdentityGate {
  #trusted = new WeakSet();
  #verify;
  #now;
  #issuer;
  #audience;

  constructor({verifyAccessToken=async()=>null,issuer="https://bazid.invalid",
    audience="tfm-game-client",now=()=>Date.now()}={}) {
    if (typeof verifyAccessToken!=="function" ||
      !valid(issuer,240) || !valid(audience,120))
      throw new TypeError("invalid_objective_identity_config");
    this.#verify=verifyAccessToken;
    this.#issuer=issuer;
    this.#audience=audience;
    this.#now=now;
  }

  async verify(token,expectedPlayerId) {
    if(!valid(token,8192)||!valid(expectedPlayerId))
      return fail("invalid_objective_access_request");
    let claims;
    try {claims=await this.#verify(token);}
    catch {return fail("objective_identity_verification_failed");}
    if(!claims || claims.verified!==true ||
      claims.issuer!==this.#issuer ||
      claims.audience!==this.#audience ||
      claims.subject!==expectedPlayerId ||
      !Number.isSafeInteger(claims.expiresAtMs) ||
      claims.expiresAtMs<=this.#now())
      return fail("objective_identity_not_verified");
    const principal=Object.freeze({subject:claims.subject,expiresAtMs:claims.expiresAtMs});
    this.#trusted.add(principal);
    return {ok:true,principal};
  }

  authorize(principal,playerId) {
    return Boolean(principal && this.#trusted.has(principal) &&
      principal.subject===playerId &&
      principal.expiresAtMs>this.#now());
  }
}
