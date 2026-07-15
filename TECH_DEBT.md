# Technical Debt

Items deferred for the hackathon because they do not block the demo, cause a build or runtime failure, violate the architecture, or introduce a demo-blocking security issue.

## Dependency reproducibility

Generate and commit `package-lock.json` after dependencies are installed with the supported Node and npm versions. This will make dependency resolution reproducible and support reliable vulnerability auditing.

## Server configuration validation

Validate the `PORT` environment variable before the API starts so invalid or out-of-range values fail with a clear configuration error.

## Express fingerprint header

Disable Express's `X-Powered-By` header before production deployment to reduce framework fingerprinting.
