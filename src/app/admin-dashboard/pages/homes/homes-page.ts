import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface HomeItem {
  id: string;
  name: string;
  address: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateHomeRequest {
  name: string;
  address: string;
}

@Component({
  selector: 'app-homes-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './homes-page.html',
  styleUrl: './homes-page.css'
})
export class HomesPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  homes: HomeItem[] = [];
  isLoading = false;
  isCreating = false;
  errorMessage = '';

  isCreateModalOpen = false;
  newHomeName = '';
  newHomeAddress = '';

  ngOnInit(): void {
    this.loadHomes();
  }

  loadHomes(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<HomeItem[]>('/api/homes/my').subscribe({
      next: (homes) => {
        this.homes = homes ?? [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load homes', error);
        this.errorMessage = 'Failed to load homes';
        this.homes = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openCreateModal(): void {
    this.newHomeName = '';
    this.newHomeAddress = '';
    this.errorMessage = '';
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.newHomeName = '';
    this.newHomeAddress = '';
  }

  createHome(): void {
    const trimmedName = this.newHomeName.trim();
    const trimmedAddress = this.newHomeAddress.trim();

    if (!trimmedName || this.isCreating) {
      return;
    }

    this.isCreating = true;
    this.errorMessage = '';

    const payload: CreateHomeRequest = {
      name: trimmedName,
      address: trimmedAddress
    };

    this.http.post<HomeItem>('/api/homes', payload).subscribe({
      next: () => {
        this.isCreating = false;
        this.closeCreateModal();
        this.loadHomes();
      },
      error: (error) => {
        console.error('Failed to create home', error);
        this.errorMessage = 'Failed to create home';
        this.isCreating = false;
        this.cdr.detectChanges();
      }
    });
  }

  trackByHome(index: number, home: HomeItem): string {
    return home.id;
  }

  formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  }
}
