import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-purchase-order',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './purchase-order.html',
  styleUrl: './purchase-order.sass',
})
export class PurchaseOrder {}
