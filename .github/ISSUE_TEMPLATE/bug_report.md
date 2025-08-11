---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: 'bug'
assignees: ''

---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Initialize SDK with '...'
2. Call method '....'
3. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Code Example**
```javascript
// Minimal code example that reproduces the issue
const sdk = new SecretLinksSDK({
  pollingEndpoint: '/api/secret-links/poll'
});

// ... rest of the code
```

**Environment:**
 - SDK Version: [e.g. 1.0.0]
 - Framework: [e.g. React 18.2.0, Vue 3.x, Vanilla JS]
 - Browser: [e.g. Chrome 119, Firefox 120, Safari 17]
 - Node.js: [e.g. 18.17.0] (if applicable)

**Secret Links Information:**
 - Link Type: [ping/webhook]
 - Has Password: [yes/no]
 - Domain: [secret.annai.ai or custom domain]

**Additional context**
Add any other context about the problem here.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Console Output**
If there are any error messages or logs, please include them here:
```
[Paste console output here]
```