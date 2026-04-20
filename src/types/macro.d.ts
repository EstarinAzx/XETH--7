/**
 * Build-time constants injected by the bundler via --define.
 * These are replaced at compile time with literal values.
 */
declare const MACRO: {
  readonly VERSION: string
  readonly DISPLAY_VERSION?: string
  readonly PACKAGE_URL?: string
  readonly NATIVE_PACKAGE_URL?: string
  readonly VERSION_CHANGELOG: string[]
  readonly ISSUES_EXPLAINER: string
}
