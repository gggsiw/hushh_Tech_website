import { describe, expect, it } from "vitest";
import {
  getNdaGenerationUrl,
  getSupabaseRpcUrl,
  getSupabaseStoragePublicUrl,
} from "../src/services/runtime/mainWeb";

describe("main web runtime helpers", () => {
  it("builds RPC URLs from the active Supabase project", () => {
    const rpcUrl = getSupabaseRpcUrl("check_access_status");

    expect(rpcUrl).toContain("ibsisfnjxeowvdtvgzff.supabase.co");
    expect(rpcUrl).not.toContain("gsqmwxqgqrgzhlhmbscg");
    expect(rpcUrl).toContain("/rest/v1/rpc/check_access_status");
  });

  it("builds storage URLs from the active Supabase project", () => {
    const storageUrl = getSupabaseStoragePublicUrl(
      "website",
      "market-updates/example.png"
    );

    expect(storageUrl).toContain("ibsisfnjxeowvdtvgzff.supabase.co");
    expect(storageUrl).not.toContain("gsqmwxqgqrgzhlhmbscg");
    expect(storageUrl).toContain("/storage/v1/object/public/website/market-updates/example.png");
  });

  it("keeps the NDA generation service configurable with a Cloud Run default", () => {
    expect(getNdaGenerationUrl()).toContain(
      "hushhtech-nda-generation-53407187172.us-central1.run.app/generate-nda"
    );
  });
});
