# Frontend Theme Maintenance

`src/index.css` is the theme source of truth.

## Update Order

1. Change semantic tokens under `:root` and `:root[data-theme="light"]`.
2. Keep shared primitives using those tokens.
3. Only add page-level styling when the pattern is genuinely unique.

## Core Tokens

- Colors: `--color-*`
- Shadows: `--shadow-*`
- Radius: `--radius-*`
- Layout spacing: `--space-*`

## Compatibility

Legacy `--lux-*` variables are aliases that point to the semantic tokens. Use the semantic tokens for new work. Keep the aliases only while older pages are being migrated.

## Shared UI Entry Points

- Page layout: `src/components/layout/page-container.tsx`
- Header shell: `src/components/shared/page-header.tsx`
- Filter shell: `src/components/shared/filter-toolbar.tsx`
- Form sections: `src/components/shared/form-section.tsx`
- Cards and tables: `src/components/shared/section-card.tsx`, `src/components/common/TableHeader.tsx`, `src/components/ui/data-table.tsx`
