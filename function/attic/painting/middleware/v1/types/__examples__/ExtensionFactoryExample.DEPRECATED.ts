/**
 * ⚠️ DEPRECATED - This example uses V1 ExtensionFactory pattern
 *
 * V1 has been superseded by V2 which uses explicit dependency injection.
 *
 * See instead:
 * - DiamondPatternExample.ts - Dependency injection with diamond pattern
 * - MiddlewareChainBuilderV2Example.ts - Full middleware chain example
 * - V2_ARCHITECTURE.md - Complete V2 documentation
 *
 * V1 issues:
 * - Non-deterministic initialization for peer extensions
 * - Implicit cross-extension dependencies
 * - No type safety for extension method calls
 * - Requires extensions to extend base model (coupling)
 *
 * V2 benefits:
 * - Explicit constructor-based dependency injection
 * - Predictable, deterministic initialization order
 * - Type-safe dependency contracts
 * - Diamond pattern support with idempotent base sharing
 * - Better testability (mock dependencies)
 */

import { defineExtension, createDelegate } from "../ExtensionFactory.js"
import * as crypto from "crypto"

// This file is kept for reference only and may not compile correctly.
// Use V2 examples for working code.

// ============================================================================
// Base Framework Model (provided by the framework)
// ============================================================================

interface BaseModel {
   buffer: Buffer
   jobId: string
   metadata: {
      width: number
      height: number
   }
}

// ============================================================================
// V1 Pattern (DEPRECATED)
// ============================================================================

// In V1, extension had to extend the base model
class CampaignExtension implements BaseModel {
   // Base properties (repeated from BaseModel - coupling!)
   buffer!: Buffer
   jobId!: string
   metadata!: { width: number; height: number }

   // Data properties
   campaignName: string = ""
   seedValue: number = 0

   // Methods
   getCampaignHash(): string {
      const content = this.campaignName + this.seedValue.toString()
      return crypto.createHash("sha256").update(content).digest("hex")
   }

   getShortHash(): string {
      return this.getCampaignHash().slice(0, 12)
   }

   getFilename(): string {
      const hash = this.getShortHash()
      return `${hash.slice(0, 2)}/${hash.slice(2)}.png`
   }

   getCampaignPrefix(): string {
      return `campaign_${this.campaignName}_${this.seedValue}`
   }
}

// ============================================================================
// V2 Pattern (RECOMMENDED - see DiamondPatternExample.ts)
// ============================================================================

/*
// In V2, use dependency injection:

interface ICampaign {
   campaignName: string
   seedValue: number
   getCampaignHash(): string
   getShortHash(): string
   getFilename(): string
}

class _Campaign implements ICampaign {
   constructor(private readonly base: BaseModel) {}

   campaignName = ""
   seedValue = 0

   getCampaignHash(): string {
      const content = this.campaignName + this.seedValue.toString()
      return crypto.createHash("sha256").update(content).digest("hex")
   }

   getShortHash(): string {
      return this.getCampaignHash().slice(0, 12)
   }

   getFilename(): string {
      const hash = this.getShortHash()
      return `${hash.slice(0, 2)}/${hash.slice(2)}.png`
   }
}

const CampaignExt = defineExtensionV2<BaseModel, _Campaign, ICampaign>(
   BaseModel,
   _Campaign,
   ["base"],
   [BaseModel]
)

// Now if another extension depends on Campaign:

interface IStorage {
   storageKey: string
   getStorageKey(): string
}

class _Storage implements IStorage {
   constructor(
      private readonly base: BaseModel,
      private readonly campaign: ICampaign  // Explicit dependency!
   ) {}

   storageKey = ""

   getStorageKey(): string {
      // Type-safe call to injected dependency
      return `${this.campaign.getCampaignHash()}/${this.storageKey}`
   }
}

const StorageExt = defineExtensionV2<BaseModel, _Storage, IStorage>(
   BaseModel,
   _Storage,
   ["base", "campaign"],
   [BaseModel, _Campaign]  // Explicit dependency types
)

// Benefits:
// - Predictable initialization order (Campaign before Storage)
// - Type-safe dependencies (TypeScript enforces ICampaign interface)
// - Testable (can mock ICampaign for Storage tests)
// - No coupling to base model structure
*/
