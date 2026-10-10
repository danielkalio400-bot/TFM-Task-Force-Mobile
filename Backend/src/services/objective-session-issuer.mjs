const reject=error=>({ok:false,error});
export class ObjectiveSessionIssuer {
  constructor({identity,gateway}) {
    if(!identity||!gateway)throw new TypeError("objective_issuer_dependencies_missing");
    this.identity=identity;
    this.gateway=gateway;
  }

  async reissue(input) {
    const {accessToken,playerId,reconnectToken,lastRevision=0}=input||{};
    const checked=await this.identity.verify(accessToken,playerId);
    if(!checked.ok)return checked;
    const issued=this.gateway.issueReconnectedViewer({
      reconnectToken,playerId,lastRevision,principal:checked.principal
    });
    return issued.ok?issued:reject(issued.error);
  }

  async issue(input) {
    const {accessToken,playerId,assignmentId,joinCredential,matchId,
      lastRevision=0}=input||{};
    const checked=await this.identity.verify(accessToken,playerId);
    if(!checked.ok)return checked;
    const issued=this.gateway.issueViewer({
      playerId,assignmentId,joinCredential,matchId,lastRevision,
      principal:checked.principal
    });
    return issued.ok?issued:reject(issued.error);
  }
}
