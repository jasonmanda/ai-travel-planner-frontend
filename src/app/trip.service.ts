import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  score: number;
  estimatedTripBudget: number;
  currency: string;
  budgetStatus: 'WITHIN_BUDGET' | 'OVER_BUDGET_ESTIMATE' | string;
  explanation: string;
  matchedInterests: string[];
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

@Injectable({ providedIn: 'root' })
export class TripService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** GET /api/v1/destinations */
  getDestinations(): Promise<Destination[]> {
    return firstValueFrom(
      this.http.get<Destination[]>(`${this.apiUrl}/destinations`)
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
}
