import { z } from "zod";

export const roleSchema = z.enum(["USER", "AGENT", "OWNER", "ADMIN", "SUPER_ADMIN"]);
export const propertyTypeSchema = z.enum(["APARTMENT", "HOUSE", "VILLA", "PLOT", "COMMERCIAL", "OFFICE", "SHOP", "WAREHOUSE", "OTHER"]);
export const listingTypeSchema = z.enum(["SALE", "RENT"]);
export const propertyStatusSchema = z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "SOLD", "RENTED", "ARCHIVED"]);
export const furnishingSchema = z.enum(["UNFURNISHED", "SEMI_FURNISHED", "FURNISHED"]);
export const possessionStatusSchema = z.enum(["READY_TO_MOVE", "UNDER_CONSTRUCTION", "NEW_LAUNCH"]);

const emailSchema = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const passwordSchema = z.string().min(12).max(128);
const phoneSchema = z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/).optional();

export const registrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(120),
  phone: phoneSchema,
}).strict();

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128) }).strict();

const moneySchema = z.number().finite().positive().max(100_000_000_000);
const measurementSchema = z.number().finite().positive().max(10_000_000);

const propertyFieldsSchema = z.object({
  title: z.string().trim().min(8).max(160),
  slug: z.string().trim().toLowerCase().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().trim().min(30).max(10_000),
  propertyType: propertyTypeSchema,
  listingType: listingTypeSchema,
  price: moneySchema,
  area: measurementSchema,
  areaUnit: z.enum(["SQFT", "SQM", "ACRE"]).default("SQFT"),
  bedrooms: z.number().int().min(0).max(30).optional(),
  bathrooms: z.number().int().min(0).max(30).optional(),
  balconies: z.number().int().min(0).max(30).optional(),
  floorNumber: z.number().int().min(-5).max(300).optional(),
  totalFloors: z.number().int().min(0).max(300).optional(),
  furnishing: furnishingSchema.optional(),
  possessionStatus: possessionStatusSchema.optional(),
  address: z.string().trim().min(3).max(240),
  locality: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/),
  latitude: z.number().finite().min(-90).max(90).optional(),
  longitude: z.number().finite().min(-180).max(180).optional(),
  amenityIds: z.array(z.string().uuid()).max(50).default([]),
}).strict();

export const propertyCreateSchema = propertyFieldsSchema.refine((value) => value.totalFloors === undefined || value.floorNumber === undefined || value.floorNumber <= value.totalFloors, {
  path: ["floorNumber"], message: "Floor number cannot exceed total floors.",
});

export const propertyUpdateSchema = propertyFieldsSchema.partial().omit({ amenityIds: true }).extend({ amenityIds: z.array(z.string().uuid()).max(50).optional() }).refine((value) => Object.keys(value).length > 0, {
  message: "At least one property field must be provided.",
}).refine((value) => value.totalFloors === undefined || value.floorNumber === undefined || value.floorNumber <= value.totalFloors, {
  path: ["floorNumber"], message: "Floor number cannot exceed total floors.",
});

export const propertySearchSchema = z.object({
  city: z.string().trim().min(2).max(100).optional(),
  locality: z.string().trim().min(2).max(120).optional(),
  propertyType: propertyTypeSchema.optional(),
  listingType: listingTypeSchema.optional(),
  minPrice: z.coerce.number().finite().nonnegative().optional(),
  maxPrice: z.coerce.number().finite().positive().optional(),
  bedrooms: z.coerce.number().int().min(0).max(30).optional(),
  furnishing: furnishingSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["newest", "price_asc", "price_desc", "area"]).default("newest"),
}).strict().refine((value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice, {
  path: ["maxPrice"], message: "Maximum price must be greater than or equal to minimum price.",
});

export const inquiryCreateSchema = z.object({
  message: z.string().trim().min(10).max(3000),
  phone: phoneSchema,
}).strict();

export const visitRequestCreateSchema = z.object({
  requestedAt: z.iso.datetime().transform((value) => new Date(value)),
  message: z.string().trim().max(1000).optional(),
}).strict().refine((value) => value.requestedAt.getTime() > Date.now(), {
  path: ["requestedAt"], message: "Visit time must be in the future.",
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UserRole = z.infer<typeof roleSchema>;
export type PropertyType = z.infer<typeof propertyTypeSchema>;
export type ListingType = z.infer<typeof listingTypeSchema>;
export type PropertyStatus = z.infer<typeof propertyStatusSchema>;
export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
export type PropertyCreateRequest = z.input<typeof propertyCreateSchema>;
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;
export type PropertyUpdateRequest = z.input<typeof propertyUpdateSchema>;
export type PropertySearchInput = z.infer<typeof propertySearchSchema>;
export type PropertySearchRequest = Partial<PropertySearchInput>;
export type InquiryCreateInput = z.infer<typeof inquiryCreateSchema>;
export type VisitRequestCreateInput = z.infer<typeof visitRequestCreateSchema>;
export type VisitRequestCreateRequest = z.input<typeof visitRequestCreateSchema>;
