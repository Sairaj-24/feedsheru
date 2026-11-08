# Security Policy

## Supported versions

This project is early-stage. Security fixes are applied on the latest `main` branch.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security problems.

Instead, email the maintainer at **sairajm2402@gmail.com** with:

- A short description of the issue
- Steps to reproduce
- Impact (what an attacker could do)
- Any suggested fix (optional)

You should receive an acknowledgment within a few days. Please give us reasonable time to fix and release before any public disclosure.

## Please never commit

- `.env`, `.env.local`, or real database URLs
- Production `AUTH_SECRET` values
- User personal data exports
- Private keys or PEM files
