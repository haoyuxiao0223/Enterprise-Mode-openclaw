/**
 * MemoryStorageBackend compliance test — validates the reference
 * implementation against the standard test suite.
 */

import { describe } from "vitest";
import { runStorageComplianceTests } from "../../kernel/storage.compliance-test.ts";
import { MemoryStorageBackend } from "./storage.ts";

describe("MemoryStorageBackend", () => {
  runStorageComplianceTests(() => new MemoryStorageBackend());
});
