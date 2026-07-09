// Global vitest setup. Provides @testing-library/jest-dom matchers.
import '@testing-library/jest-dom/vitest';
// Initialize i18n once so components that use useTranslation() render with
// their English strings (the default) in tests. Without this, aria-labels
// and titles come back as the raw translation key and any test that queries
// by literal text (e.g. getByText('My Systems') or aria-label="Switch location")
// fails.
import '../i18n';
