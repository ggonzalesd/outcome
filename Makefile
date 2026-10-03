.PHONY: help format format-check verify test test-unit test-integration typecheck docs-check harness-check pack-check

help:
	@echo "format format-check verify test test-unit test-integration typecheck docs-check harness-check pack-check"

format:
	bun run format

format-check:
	bun run format:check

verify:
	bun run verify

test:
	bun run test

test-unit:
	bun run test:unit

test-integration:
	bun run test:integration

typecheck:
	bun run typecheck

docs-check:
	bun run docs:check

harness-check:
	bun run harness:check

pack-check:
	bun run pack:check
