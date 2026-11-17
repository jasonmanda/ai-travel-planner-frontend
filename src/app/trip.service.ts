import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';

export interface CreateTripRequest {
  departureCity: string;
  nationality: string;
  adults: number;
  children: number;
  budget: number;
  currency: string;
  duration: number;
  travelPeriod: string;
  travelStyle: string;
  destinationScope: string;
  interests: string[];
  preferredDestination?: string;
}

export interface TripResponse {
  id: string;
  departureCity: string;
  nationality: string;
  adults: number;
  children: number;
  budget: number;
  currency: string;
  duration: number;
  travelPeriod: string;
  travelStyle: string;
  destinationScope: string;
  interests: string[];
  preferredDestination?: string;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  destinationId: number;
  city: string;
  country: string;
  countryCode?: string;
  score: number;
  scoreBreakdown?: {
    interests: number;
    budget: number;
    travelStyle: number;
    preferredDestination: number;
  };
  estimatedTripBudget: number;
  currency: string | null;
  requestedBudget?: number;
  requestedBudgetCurrency?: string;
  budgetStatus: 'WITHIN_BUDGET' | 'OVER_BUDGET_ESTIMATE' | 'CURRENCY_NOT_COMPARABLE' | string;
  explanation: string;
  matchedInterests: string[];
  estimateBasis?: string;
  estimateLimitations?: string;
  notEvaluatedCriteria?: string[];
  latitude?: number | null;
  longitude?: number | null;
  generatedAt: string;
}

export interface Destination {
  id: number;
  city: string;
  country: string;
  countryCode: string;
  description: string;
  estimatedDailyBudget: number;
  currency: string;
  tags: string[];
  latitude: number | null;
  longitude: number | null;
}


export interface CatalogItem {
  id?: number; name?: string; category?: string; description?: string;
  latitude?: number | null; longitude?: number | null;
  estimatedCost?: number | null; estimatedAmount?: number | null;
  estimatedDurationMinutes?: number | null; currency?: string | null;
  dataStatus?: string; sourceName?: string | null; sourceUrl?: string | null;
  suitableForFamilies?: boolean; minAgeYears?: number | null;
  componentKey?: string; label?: string; pricingBasis?: string;
  month?: number; seasonType?: string; summary?: string;
}

export interface DestinationCatalog {
  destination: Record<string, unknown>;
  attractions: CatalogItem[];
  activities: CatalogItem[];
  budget: CatalogItem[];
  seasons: CatalogItem[];
  dataPolicy: string;
}

export interface ItineraryItem {
  id: number;
  sequence: number;
  type: 'ATTRACTION' | 'ACTIVITY' | string;
  title: string;
  description?: string | null;
  estimatedDurationMinutes?: number | null;
  estimatedCost?: number | null;
  currency?: string | null;
  dataStatus?: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
  priceVerificationStatus?: string;
  preferenceReason?: string | null;
}

export interface ItineraryDay {
  id: number;
  dayNumber: number;
  title: string;
  summary: string;
  items: ItineraryItem[];
}

export interface ItineraryResponse {
  id: string;
  tripId: string;
  destinationId: number;
  title: string;
  city: string;
  country: string;
  countryCode: string;
  days: ItineraryDay[];
  planningWarnings: string[];
  estimateDisclaimer: string;
  planningPolicy: string;
  recommendationEligibility?: {
    candidateCount: number;
    eligibleCount: number;
    excludedCount: number;
    policy: string;
  };
}

export interface AdminCatalogItem {
  itemType: 'ACTIVITY' | 'ATTRACTION';
  id: number;
  countryCode: string;
  country: string;
  city: string;
  name: string;
  category: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  estimatedDurationMinutes: number | null;
  estimatedCost: number | null;
  currency: string | null;
  dataStatus: string;
  sourceName: string | null;
  sourceUrl: string | null;
  sourceType: string | null;
  sourceScope: string | null;
  verificationNotes: string | null;
  verifiedCoreFields: string[];
  latestEventId: number | null;
  latestEventStatus: string | null;
  latestEventSourceName: string | null;
  latestEventSourceUrl: string | null;
  latestEventNotes: string | null;
  latestVerifiedBy: string | null;
  latestVerifiedAt: string | null;
  verificationEventCount: number;
}

export interface AdminCatalogResponse {
  items: AdminCatalogItem[];
  total: number;
  fullyVerifiedCount: number;
  partiallyVerifiedCount: number;
  unverifiedCount: number;
  requiredCoreFields: string[];
  policy: string;
}

export interface CatalogVerificationPayload {
  verificationStatus: 'VERIFIED' | 'PARTIALLY_VERIFIED';
  verifiedFields: string[];
  sourceName: string;
  sourceUrl: string;
  verificationNotes: string;
}

export interface AiItineraryGuideResponse {
  overview: string;
  dayGuidance: { dayNumber: number; focus: string; rationale: string }[];
  reminders: string[];
  disclaimer: string;
}

@Injectable({ providedIn: 'root' })
export class TripService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private adminHeaders(credentials: string): HttpHeaders {
    return new HttpHeaders({ Authorization: 'Basic ' + btoa(credentials) });
  }

  /** GET /api/v1/admin/catalog/items : queue de vérification, protégée par HTTP Basic. */
  getAdminCatalog(credentials: string): Promise<AdminCatalogResponse> {
    return firstValueFrom(this.http.get<AdminCatalogResponse>(
      `${this.apiUrl}/admin/catalog/items`,
      { headers: this.adminHeaders(credentials) }
    ));
  }

  /** POST /api/v1/admin/catalog/{type}/{id}/verifications : snapshot des valeurs courantes. */
  verifyCatalogItem(
    item: AdminCatalogItem,
    payload: CatalogVerificationPayload,
    credentials: string
  ): Promise<Record<string, unknown>> {
    const type = item.itemType === 'ATTRACTION' ? 'attractions' : 'activities';
    return firstValueFrom(this.http.post<Record<string, unknown>>(
      `${this.apiUrl}/admin/catalog/${type}/${item.id}/verifications`,
      payload,
      { headers: this.adminHeaders(credentials) }
    ));
  }

  /** GET /api/v1/destinations */
  getDestinations(): Promise<Destination[]> {
    return firstValueFrom(
      this.http.get<Destination[]>(`${this.apiUrl}/destinations`)
    );
  }

  /** GET /api/v1/destinations/{cityId}/catalog : détails du catalogue d'une ville. */
  getDestinationCatalog(cityId: number): Promise<DestinationCatalog> {
    return firstValueFrom(
      this.http.get<DestinationCatalog>(`${this.apiUrl}/destinations/${cityId}/catalog`)
    );
  }

  /** POST /api/v1/trips : crée et persiste une demande de voyage. */
  createTrip(request: CreateTripRequest): Promise<TripResponse> {
    return firstValueFrom(
      this.http.post<TripResponse>(`${this.apiUrl}/trips`, request)
    );
  }

  /** GET /api/v1/trips/{id} : récupère une demande de voyage. */
  getTrip(tripId: string): Promise<TripResponse> {
    return firstValueFrom(
      this.http.get<TripResponse>(`${this.apiUrl}/trips/${encodeURIComponent(tripId)}`)
    );
  }

  /** POST /api/v1/trips/{id}/recommendations : calcule et sauvegarde les recommandations. */
  generateRecommendations(tripId: string): Promise<Recommendation[]> {
    return firstValueFrom(
      this.http.post<Recommendation[]>(
        `${this.apiUrl}/trips/${encodeURIComponent(tripId)}/recommendations`,
        null
      )
    );
  }

  /** GET /api/v1/trips/{id}/recommendations : relit les recommandations sauvegardées. */
  getRecommendations(tripId: string): Promise<Recommendation[]> {
    return firstValueFrom(
      this.http.get<Recommendation[]>(
        `${this.apiUrl}/trips/${encodeURIComponent(tripId)}/recommendations`
      )
    );
  }

  /** POST /api/v1/trips/{id}/itinerary?destinationId=... : génère un itinéraire déterministe. */
  generateItinerary(tripId: string, destinationId: number): Promise<ItineraryResponse> {
    return firstValueFrom(
      this.http.post<ItineraryResponse>(
        `${this.apiUrl}/trips/${encodeURIComponent(tripId)}/itinerary`,
        null,
        { params: { destinationId: String(destinationId) } }
      )
    );
  }

  /** POST /api/v1/itineraries/{id}/ai-guide : demande le guide IA facultatif. */
  generateAiGuide(itineraryId: string): Promise<AiItineraryGuideResponse> {
    return firstValueFrom(
      this.http.post<AiItineraryGuideResponse>(
        `${this.apiUrl}/itineraries/${encodeURIComponent(itineraryId)}/ai-guide`,
        null
      )
    );
  }
}
