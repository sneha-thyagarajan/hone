# Contributing to Hone

Thanks for your interest! Hone is an open-source project built for students, by students.

## Getting started

```bash
git clone https://github.com/<your-org>/hone.git
cd hone
pnpm install
cp .env.example .env  # optional – needed only for AI features
pnpm dev
```

## Before you submit a PR

```bash
pnpm lint         # must pass with no warnings
pnpm typecheck    # must pass
pnpm test         # all tests must pass
```

## Guidelines

- **One feature per PR.** Small, focused PRs are easier to review.
- **Tests required** for any new logic (scoring, parsing, AI pipeline, runner).
- **No new dependencies** without discussion in an issue first.
- Follow the existing code style – Prettier and ESLint enforce it.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, etc.).

## Project structure

See [docs/architecture.md](docs/architecture.md) for a full walkthrough.

## Reporting bugs

Open an issue with a minimal reproduction. Include browser/OS version.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
