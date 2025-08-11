# Contributing to Secret Links SDK

Thank you for your interest in contributing to the Secret Links SDK! This document provides guidelines and information for contributors.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/eldarski/secret-links-sdk.git
   cd sdk
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development build**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Strategy
- `main` - Production releases
- `develop` - Development branch for next release
- `feature/[name]` - Feature branches
- `fix/[name]` - Bug fix branches

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm run lint          # Check code style
   npm run type-check    # Check TypeScript
   npm test              # Run tests
   npm run build         # Test build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Use conventional commit messages:
   - `feat:` - New features
   - `fix:` - Bug fixes
   - `docs:` - Documentation changes
   - `test:` - Adding tests
   - `refactor:` - Code refactoring
   - `perf:` - Performance improvements

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Code Style

### TypeScript Guidelines
- Use strict TypeScript configuration
- Avoid `any` types - use proper types or `unknown`
- Export interfaces and types that might be useful to consumers
- Add JSDoc comments for public APIs

### Code Structure
- Keep files under 300 lines when possible
- Use meaningful variable and function names
- Group related functionality together
- Separate concerns (validation, polling, error handling)

### Testing
- Write unit tests for all new functionality
- Use descriptive test names
- Mock external dependencies
- Aim for >80% code coverage

## API Design Principles

### Backward Compatibility
- Never break existing public APIs without major version bump
- Add new optional parameters instead of changing signatures
- Deprecate old APIs before removing them

### Error Handling
- Use specific error types
- Provide helpful error messages
- Don't expose sensitive information in errors
- Handle network errors gracefully

### Performance
- Minimize memory usage
- Use efficient polling strategies
- Avoid blocking the main thread
- Optimize bundle size

## Testing

### Running Tests
```bash
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run with coverage report
```

### Test Structure
```javascript
describe('SecretLinksSDK', () => {
  describe('validateLink', () => {
    it('should validate valid Secret Links URLs', () => {
      // Test implementation
    });
    
    it('should reject invalid URLs', () => {
      // Test implementation
    });
  });
});
```

### Integration Testing
Test the SDK with real Secret Links URLs in development:
1. Create test links at https://secret.annai.ai
2. Use the examples in `/examples` directory
3. Test across different browsers and environments

## Documentation

### Code Documentation
- Add JSDoc comments for all public APIs
- Include parameter types and return types
- Provide usage examples in comments
- Document complex algorithms or business logic

### README Updates
- Update installation instructions if needed
- Add new features to the feature list
- Update examples if API changes
- Keep the quick start guide current

### Examples
- Update examples when adding new features
- Test all examples to ensure they work
- Add framework-specific examples when relevant

## Release Process

### Version Numbering
We use [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)

### Release Checklist
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated
- [ ] Version number is bumped
- [ ] Examples are tested
- [ ] Build artifacts are clean

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/eldarski/secret-links-sdk/issues)
- **Discussions**: [GitHub Discussions](https://github.com/eldarski/secret-links-sdk/discussions)
- **Documentation**: [README.md](README.md) and inline code docs

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and contribute
- Follow GitHub's community guidelines

## License

By contributing, you agree that your contributions will be licensed under the MIT License.