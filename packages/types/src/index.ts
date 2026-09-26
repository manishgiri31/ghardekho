export type {
  InquiryCreateInput,
  LoginInput,
  PropertyCreateInput,
  PropertyCreateRequest,
  PropertySearchInput,
  PropertySearchRequest,
  OwnerPropertySearchInput,
  OwnerPropertySearchRequest,
  PropertyUpdateInput,
  PropertyUpdateRequest,
  RegistrationInput,
  VisitRequestCreateInput,
  VisitRequestCreateRequest,
  UserRole,
  PropertyType,
  ListingType,
  PropertyStatus,
} from "@ghardekho/validation";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiListSuccess<T> = {
  success: true;
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNextPage?: boolean };
};
export type OwnerPropertyListSuccess = ApiListSuccess<PropertyRecord> & {
  summary: { total: number; byStatus: Record<import("@ghardekho/validation").PropertyStatus, number> };
};
export type ApiFailure = { success: false; error: { code: string; message: string } };
export type PublicUser = {
  id: string;
  email: string;
  phone: string | null;
  role: "USER" | "AGENT" | "OWNER" | "ADMIN" | "SUPER_ADMIN";
  profile: { name: string; avatar: string | null; bio: string | null; city: string | null; state: string | null } | null;
};

export type PropertyRecord = {
  id: string;
  title: string;
  slug: string;
  description: string;
  propertyType: import("@ghardekho/validation").PropertyType;
  listingType: import("@ghardekho/validation").ListingType;
  status: import("@ghardekho/validation").PropertyStatus;
  price: string;
  area: string;
  areaUnit: "SQFT" | "SQM" | "ACRE";
  bedrooms: number | null;
  bathrooms: number | null;
  balconies: number | null;
  floorNumber: number | null;
  totalFloors: number | null;
  furnishing: "UNFURNISHED" | "SEMI_FURNISHED" | "FURNISHED" | null;
  possessionStatus: "READY_TO_MOVE" | "UNDER_CONSTRUCTION" | "NEW_LAUNCH" | null;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  latitude: string | null;
  longitude: string | null;
  ownerId: string;
  owner?: { id: string; profile: { name: string } | null };
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  media?: { id: string; url: string; type: "IMAGE" | "VIDEO"; sortOrder: number; altText: string | null; isPrimary: boolean }[];
  amenities?: { amenity: { id: string; name: string; slug: string } }[];
};

export type PublicPropertyRecord = Pick<PropertyRecord,
  "id" | "title" | "slug" | "propertyType" | "listingType" | "price" | "area" | "areaUnit" | "bedrooms" | "bathrooms" | "locality" | "city"
> & { media?: PropertyRecord["media"] };


export type PropertyDetailsRecord = Pick<PropertyRecord,
  "id" | "title" | "slug" | "description" | "propertyType" | "listingType" | "price" | "area" | "areaUnit" |
  "bedrooms" | "bathrooms" | "balconies" | "floorNumber" | "totalFloors" | "furnishing" | "possessionStatus" |
  "address" | "locality" | "city" | "state" | "pincode" | "latitude" | "longitude"
> & {
  status?: import("@ghardekho/validation").PropertyStatus;
  ownerId?: string;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  owner?: { profile: { name: string } | null };
  media?: PropertyRecord["media"];
  amenities?: PropertyRecord["amenities"];
};
