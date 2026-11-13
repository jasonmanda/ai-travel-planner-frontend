import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TripService, Recommendation } from './trip.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private readonly tripService = inject(TripService);
  recommendations: Recommendation[] = [];
  readonly criterionLabels: Record<string, string> = {
    interests: 'Correspondance avec vos intérêts',
    budget: 'Adéquation du budget',
    travelStyle: 'Style de voyage',
    preferredDestination: 'Destination préférée'
  };
  readonly notEvaluatedLabels: Record<string, string> = {
    nationality_and_entry_formalities: 'Nationalité et formalités d’entrée',
    travel_period_and_seasonality: 'Période et saisonnalité',
    departure_transport_cost: 'Coût du transport depuis le départ',
    destination_scope: 'Périmètre géographique demandé'
  };
  errorMessage = signal('');
  createdTripId = signal<string | null>(null);
  activeTab = signal('Découvrir');
  showResults = signal(false);
  isGenerating = signal(false);
  mobileMenuOpen = signal(false);

  departureCity = 'Dakar, Sénégal';
  nationality = 'Sénégalaise';
  adults = 2;
  children = 0;
  budget = 1500000;
  duration = 7;
  travelPeriod = 'Dates flexibles';
  travelStyle = 'En couple';
  destinationScope = 'Afrique et monde';
  selectedInterests = ['Plage', 'Culture', 'Gastronomie'];

  readonly interests = [
    'Plage', 'Culture', 'Gastronomie', 'Nature', 'Aventure',
    'Shopping', 'Détente', 'Vie nocturne', 'Activités enfants'
  ];



  toggleInterest(interest: string): void {
    this.selectedInterests = this.selectedInterests.includes(interest)
      ? this.selectedInterests.filter(item => item !== interest)
      : [...this.selectedInterests, interest];
  }

  async generateRecommendations(): Promise<void> {
    this.errorMessage.set('');
    if (!this.departureCity.trim() || !this.nationality.trim() || this.budget <= 0 || this.duration < 1) {
      this.errorMessage.set('Veuillez vérifier votre ville de départ, votre nationalité, votre budget et la durée du séjour.');
      return;
    }
    this.isGenerating.set(true);
    this.showResults.set(false);
    try {
      const trip = await this.tripService.createTrip({
        departureCity: this.departureCity.trim(),
        nationality: this.nationality.trim(),
        adults: this.adults,
        children: this.children,
        budget: this.budget,
        currency: 'XOF',
        duration: this.duration,
        travelPeriod: this.travelPeriod,
        travelStyle: this.travelStyle,
        destinationScope: this.destinationScope,
        interests: this.selectedInterests
      });
      this.createdTripId.set(trip.id);
      this.recommendations = await this.tripService.generateRecommendations(trip.id);
      this.showResults.set(true);
      setTimeout(() => document.getElementById('recommendations')?.scrollIntoView({ behavior: 'smooth' }), 0);
    } catch (error: any) {
      const apiDetail = error?.error?.detail || error?.error?.message;
      this.errorMessage.set(apiDetail || 'Impossible de contacter le serveur. Vérifiez que le backend fonctionne sur http://localhost:8080.');
    } finally {
      this.isGenerating.set(false);
    }
  }

  scoreEntries(destination: Recommendation): { key: string; label: string; value: number }[] {
    return Object.entries(destination.scoreBreakdown ?? {}).map(([key, value]) => ({
      key,
      label: this.criterionLabels[key] ?? key,
      value
    }));
  }

  notEvaluatedLabelsFor(destination: Recommendation): string[] {
    return (destination.notEvaluatedCriteria ?? []).map(key => this.notEvaluatedLabels[key] ?? key);
  }

  budgetStatusLabel(status: string): string {
    if (status === 'WITHIN_BUDGET') return 'Dans le budget estimé';
    if (status === 'OVER_BUDGET_ESTIMATE') return 'Au-dessus du budget estimé';
    if (status === 'CURRENCY_NOT_COMPARABLE') return 'Comparaison impossible : devises différentes';
    return 'Budget à vérifier';
  }

  destinationImage(city: string): string {
    const images: Record<string, string> = {
      Zanzibar: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1000&q=85',
      Marrakech: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=1000&q=85',
      'Le Cap': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1000&q=85'
    };
    return images[city] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=85';
  }


  selectTab(tab: string): void {
    this.activeTab.set(tab);
    this.mobileMenuOpen.set(false);
    if (tab === 'Mon voyage') {
      document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'Découvrir') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  startOver(): void {
    this.showResults.set(false);
    document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' });
  }
}
