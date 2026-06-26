# ai-paths Default Web

`ai-paths` is the default React frontend for the AI gateway management workspace in `web/default`.

## Overview

- Product name: `ai-paths`
- Purpose: AI interface aggregation, channel management, token management, billing, and system operations
- Style direction: rebuilt with the `animal-island-ui` visual language
- Stack: React + TypeScript + TanStack Router + Tailwind-based component system

## What Changed

- Reworked the default frontend into a warm `animal-island-ui` inspired interface with softer shadows, larger radii, and playful island-style surfaces.
- Replaced visible legacy branding in this frontend with `ai-paths`.
- Preserved original-project attribution and license-related references where they are legally relevant.

## Scope

This README only describes the `web/default` frontend. It does not modify the backend API contract or the `web/classic` frontend.

## Notes

- API request paths remain compatible with the existing backend.
- Runtime system name and runtime logo from server status still override the built-in defaults.
- Dependency installation was not available in the current workspace state, so build verification still needs to be run after installing the frontend workspace dependencies.
