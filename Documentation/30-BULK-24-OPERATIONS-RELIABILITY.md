# Bulk 24 - Operations and reliability authority

This bulk implements the operations ownership and dedicated-multiplayer reliability requirements from the TFM blueprint.

## Added
- Service health composition.
- Availability-target windows.
- Deployment revision state.
- Rollback records.
- Crash-diagnostic aggregation.
- Regional-routing control state.
- Load-test summaries.
- Predictable degradation gates based on error rate and p95 latency.
- Privacy-minimized operations audit history.
- Client DTOs.
- Shared runtime contract, persistence tables, routes and tests.

## Blueprint alignment
The guide requires health checks, incident logs, rollback, telemetry and availability targets. Its dedicated-server section additionally calls for server health probes, deployment rollbacks, crash diagnostics, regional routing, realistic rate limits and load tests before increasing player counts.

## Privacy boundary
Operational logs are deliberately limited to service, region, build and deployment metadata. They do not contain player credentials, BazID subject references, direct-message content or private social data.

## Production boundary
This remains a local operations-state prototype. It does not deploy servers, perform real cloud rollback, ingest production crash dumps or enforce real SLOs.
