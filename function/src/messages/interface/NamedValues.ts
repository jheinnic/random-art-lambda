import { Nominal } from "./Nominal.js"

const CIDStringName: unique symbol = Symbol("CID name")
const LiteCIDStringName: unique symbol = Symbol("LiteCID name")

const ULIDName: unique symbol = Symbol("ULID name")

const WorkloadIdName: unique symbol = Symbol("Workload Id Name")
const ReleaseVersionName: unique symbol = Symbol("Release Version Name")
const BuildVersionName: unique symbol = Symbol("Build Version Name")

/**
 * A string that is intended to be a CID but has not yet been validated.
 * This is used in application-facing DTOs where CID format validation
 * is deferred to the framework (e.g., FlowProducer).
 *
 * The "Lite" prefix indicates this type carries intent without validation,
 * keeping application code free of multiformats dependency.
 */
export type LiteCIDString = Nominal<string, typeof LiteCIDStringName>

/**
 * A LiteCIDString that has been validated as a legitimate CID format.
 * Use CIDUtil.blessCID() to convert from LiteCIDString after validation.
 */
export type CIDString = Nominal<LiteCIDString, typeof CIDStringName>

export type ULIDString = Nominal<string, typeof ULIDName>

export type WorkloadId = Nominal<string, typeof WorkloadIdName>
export type ReleaseVersion = Nominal<string, typeof ReleaseVersionName>
export type BuildVersion = Nominal<string, typeof BuildVersionName>
