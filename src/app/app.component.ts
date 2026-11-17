import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TripService, Recommendation, DestinationCatalog, ItineraryResponse, AiItineraryGuideResponse, AdminCatalogItem, AdminCatalogResponse } from './trip.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private readonly tripService = inject(TripService);
  adminMode = signal(false);
  adminUsername = '';
  adminPassword = '';
  adminCredentials = signal('');
  adminCatalog = signal<AdminCatalogResponse | null>(null);
  adminSelectedItem = signal<AdminCatalogItem | null>(null);
  adminLoading = signal(false);
  adminSaving = signal(false);
  adminError = signal('');
  adminSuccess = signal('');
  adminSearch = '';
  adminTypeFilter = 'ALL';
  adminStatusFilter = 'ALL';
  adminSourceName = '';
  adminSourceUrl = '';
  adminVerificationNotes = '';
  adminFieldSelection: Record<string, boolean> = {};
  readonly adminCoreFields = [
    { key: 'name', label: 'Nom', value: (item: AdminCatalogItem) => item.name },
    { key: 'category', label: 'Catégorie', value: (item: AdminCatalogItem) => item.category },
    { key: 'description', label: 'Description', value: (item: AdminCatalogItem) => item.description },
    { key: 'latitude', label: 'Latitude', value: (item: AdminCatalogItem) => item.latitude },
    { key: 'longitude', label: 'Longitude', value: (item: AdminCatalogItem) => item.longitude },
    { key: 'estimated_duration_minutes', label: 'Durée (minutes)', value: (item: AdminCatalogItem) => item.estimatedDurationMinutes }
  ];
  recommendations: Recommendation[] = [];
  selectedCatalog = signal<DestinationCatalog | null>(null);
  catalogLoading = signal(false);
  catalogError = signal('');
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
  itinerary = signal<ItineraryResponse | null>(null);
  itineraryLoading = signal(false);
  itineraryError = signal('');
  aiGuide = signal<AiItineraryGuideResponse | null>(null);
  aiGuideLoading = signal(false);
  aiGuideError = signal('');

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



  openAdmin(): void {
    this.adminMode.set(true);
    this.activeTab.set('Administration');
    this.adminError.set('');
    setTimeout(() => document.getElementById('catalog-admin')?.scrollIntoView({ behavior: 'smooth' }), 0);
  }

  async loadAdminCatalog(): Promise<void> {
    if (!this.adminUsername.trim() || !this.adminPassword) {
      this.adminError.set('Renseignez les identifiants administrateur configurés sur le backend.');
      return;
    }
    this.adminLoading.set(true);
    this.adminError.set('');
    this.adminSuccess.set('');
    const credentials = this.adminUsername.trim() + ':' + this.adminPassword;
    try {
      const catalog = await this.tripService.getAdminCatalog(credentials);
      this.adminCredentials.set(credentials);
      this.adminCatalog.set(catalog);
      this.adminSelectedItem.set(null);
    } catch (error: any) {
      this.adminError.set(error?.status === 401 || error?.status === 403
        ? 'Accès refusé. Vérifiez les identifiants administrateur.'
        : error?.error?.detail || error?.error?.message || 'Impossible de charger le catalogue administrateur.');
    } finally {
      this.adminLoading.set(false);
    }
  }

  get filteredAdminItems(): AdminCatalogItem[] {
    const items = this.adminCatalog()?.items ?? [];
    const query = this.adminSearch.trim().toLocaleLowerCase();
    return items.filter(item => {
      const matchesQuery = !query || [item.name, item.city, item.country, item.category]
        .some(value => (value ?? '').toLocaleLowerCase().includes(query));
      const matchesType = this.adminTypeFilter === 'ALL' || item.itemType === this.adminTypeFilter;
      const count = item.verifiedCoreFields?.length ?? 0;
      const status = count === 6 ? 'VERIFIED' : count > 0 ? 'PARTIAL' : 'UNVERIFIED';
      const matchesStatus = this.adminStatusFilter === 'ALL' || status === this.adminStatusFilter;
      return matchesQuery && matchesType && matchesStatus;
    });
  }

  selectAdminItem(item: AdminCatalogItem): void {
    this.adminSelectedItem.set(item);
    this.adminError.set('');
    this.adminSuccess.set('');
    this.adminSourceName = item.sourceName || item.latestEventSourceName || '';
    this.adminSourceUrl = item.sourceUrl || item.latestEventSourceUrl || '';
    this.adminVerificationNotes = '';
    this.adminFieldSelection = Object.fromEntries(
      this.adminCoreFields.map(field => [field.key, false])
    );
  }

  toggleAdminField(field: string, checked: boolean): void {
    this.adminFieldSelection = { ...this.adminFieldSelection, [field]: checked };
  }

  async submitCatalogVerification(): Promise<void> {
    const item = this.adminSelectedItem();
    const verifiedFields = Object.entries(this.adminFieldSelection)
      .filter(([, checked]) => checked).map(([field]) => field);
    if (!item || !verifiedFields.length) {
      this.adminError.set('Sélectionnez au moins un champ que vous avez réellement contrôlé.');
      return;
    }
    if (!this.adminSourceName.trim() || !this.adminSourceUrl.trim() || !this.adminVerificationNotes.trim()) {
      this.adminError.set('La source, son URL et les notes de vérification sont obligatoires.');
      return;
    }
    const merged = new Set([...(item.verifiedCoreFields ?? []), ...verifiedFields]);
    const verificationStatus = merged.size === 6 ? 'VERIFIED' : 'PARTIALLY_VERIFIED';
    this.adminSaving.set(true);
    this.adminError.set('');
    this.adminSuccess.set('');
    try {
      await this.tripService.verifyCatalogItem(item, {
        verificationStatus,
        verifiedFields,
        sourceName: this.adminSourceName.trim(),
        sourceUrl: this.adminSourceUrl.trim(),
        verificationNotes: this.adminVerificationNotes.trim()
      }, this.adminCredentials());
      await this.loadAdminCatalog();
      this.adminSuccess.set('Vérification enregistrée. Le statut est recalculé à partir des valeurs et de l’historique.');
      const refreshed = this.adminCatalog()?.items.find(candidate =>
        candidate.itemType === item.itemType && candidate.id === item.id
      );
      if (refreshed) this.selectAdminItem(refreshed);
    } catch (error: any) {
      this.adminError.set(error?.error?.detail || error?.error?.message || 'Échec de l’enregistrement de la vérification.');
    } finally {
      this.adminSaving.set(false);
    }
  }

  adminFieldValue(field: { key: string; label: string; value: (item: AdminCatalogItem) => unknown }, item: AdminCatalogItem): string {
    const value = field.value(item);
    return value == null || value === '' ? 'Valeur absente' : String(value);
  }

  toggleInterest(interest: string): void {
    this.selectedInterests = this.selectedInterests.includes(interest)
      ? this.selectedInterests.filter(item => item !== interest)
      : [...this.selectedInterests, interest];
  }

  async generateRecommendations(): Promise<void> {
    this.errorMessage.set('');
    this.itinerary.set(null);
    this.itineraryError.set('');
    this.aiGuide.set(null);
    this.aiGuideError.set('');
    this.selectedCatalog.set(null);
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

  async openDestinationCatalog(destination: Recommendation): Promise<void> {
    this.selectedCatalog.set(null);
    this.catalogError.set('');
    this.catalogLoading.set(true);
    try {
      const catalog = await this.tripService.getDestinationCatalog(destination.destinationId);
      this.selectedCatalog.set(catalog);
      setTimeout(() => document.getElementById('destination-catalog')?.scrollIntoView({ behavior: 'smooth' }), 0);
    } catch (error: any) {
      this.catalogError.set(error?.error?.detail || error?.error?.message || 'Impossible de charger le catalogue de cette destination.');
    } finally {
      this.catalogLoading.set(false);
    }
  }

  closeDestinationCatalog(): void { this.selectedCatalog.set(null); }

  async generateItinerary(destination: Recommendation): Promise<void> {
    const tripId = this.createdTripId();
    if (!tripId) {
      this.itineraryError.set('Créez d’abord un voyage avant de générer un itinéraire.');
      return;
    }
    this.itineraryLoading.set(true);
    this.itineraryError.set('');
    this.itinerary.set(null);
    this.aiGuide.set(null);
    this.aiGuideError.set('');
    try {
      const result = await this.tripService.generateItinerary(tripId, destination.destinationId);
      this.itinerary.set(result);
      setTimeout(() => document.getElementById('generated-itinerary')?.scrollIntoView({ behavior: 'smooth' }), 0);
    } catch (error: any) {
      this.itineraryError.set(error?.error?.detail || error?.error?.message || 'Impossible de générer cet itinéraire. Vérifiez que le backend est à jour.');
    } finally {
      this.itineraryLoading.set(false);
    }
  }

  async generateAiGuide(): Promise<void> {
    const itineraryId = this.itinerary()?.id;
    if (!itineraryId) return;
    this.aiGuideLoading.set(true);
    this.aiGuideError.set('');
    this.aiGuide.set(null);
    try {
      this.aiGuide.set(await this.tripService.generateAiGuide(itineraryId));
    } catch (error: any) {
      this.aiGuideError.set(error?.error?.detail || error?.error?.message || 'Le guide IA est indisponible. Vérifiez que APP_AI_ENABLED=true et que le fournisseur IA est configuré côté backend.');
    } finally {
      this.aiGuideLoading.set(false);
    }
  }

  dataStatusLabel(status?: string): string {
    if (status === 'VERIFIED') return 'Vérifié';
    if (status === 'UNVERIFIED') return 'Non vérifié';
    if (status === 'ESTIMATED') return 'Estimatif';
    return status || 'Statut non renseigné';
  }

  formatDuration(minutes?: number): string {
    if (minutes == null) return 'Durée non renseignée';
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return hours ? `${hours} h${remaining ? ` ${remaining} min` : ''}` : `${minutes} min`;
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
