export type Role = 'TENANT' | 'LANDLORD' | 'ADMIN';
export type ListingStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type Language = 'EN' | 'AR';
export type Lang = 'en' | 'ar';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  landlordApproved: boolean;
  preferredLanguage: Language;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface ListingImage {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  fileId: string;
  listingId: string;
  createdAt: string;
}

export interface ListingLandlord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  createdAt: string;
  updatedAt: string;
  /** Localized projection added by the backend for the requested language. */
  name: string;
}

export interface State {
  id: string;
  nameEn: string;
  nameAr: string;
  createdAt: string;
  updatedAt: string;
  /** Localized projection added by the backend for the requested language. */
  name: string;
}

export interface City extends State {
  stateId: string;
}

export interface Listing {
  id: string;
  listingNumber: number;
  titleEn: string;
  titleAr: string;
  rent: number;
  locationEn: string;
  locationAr: string;
  descriptionEn: string;
  descriptionAr: string;
  status: ListingStatus;
  landlordId: string;
  landlord: ListingLandlord;
  categoryId: string | null;
  category: Category | null;
  stateId: string | null;
  state: State | null;
  cityId: string | null;
  city: City | null;
  images: ListingImage[];
  createdAt: string;
  updatedAt: string;
  /** Localized projections added by the backend for the requested language. */
  title: string;
  location: string;
  description: string;
  /** "<area>, <city>, <state>" composed by the backend. */
  fullAddress: string;
  language: Lang;
}

export interface Landlord {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  landlordApproved: boolean;
  createdAt: string;
  _count: { listings: number };
}

export interface EnquiryListing {
  id: string;
  listingNumber: number;
  titleEn: string;
  titleAr: string;
  locationEn: string;
  locationAr: string;
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  contacted: boolean;
  contactedAt: string | null;
  listingId: string;
  listing: EnquiryListing;
  createdAt: string;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}
