# Hash Refresh Tokens

Srinil Stay stores only hashes of refresh tokens, never raw refresh-token values, so a database leak does not directly expose usable long-lived credentials. This means the rotation grace period can accept the immediately previous token without revoking the refresh-token family, but it cannot re-send the already-issued replacement refresh-token cookie because the raw replacement token is not available server-side.

## Considered Options

- Store raw refresh tokens so grace-period retries can receive the exact replacement cookie again.
- Store only refresh-token hashes and require the client to keep the replacement cookie from the successful rotation response.

## Consequences

Refresh-token storage remains safer under database disclosure, but a lost successful refresh response may still require the client to refresh again with the replacement cookie it received or eventually log in again if it never received that cookie.
