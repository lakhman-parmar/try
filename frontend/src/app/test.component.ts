import { Component } from '@angular/core';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css'],
})
export class TestComponent {
  title: string = 'Test Component';
  count: number = 0;
  items: string[] = ['apple', 'banana', 'cherry'];

  constructor() {
    console.log('Component initialized');
  }

  incrementCount() {
    this.count++;
    console.log('Count:', this.count);
  }

  addItem(item: string) {
    if (item) {
      this.items.push(item);
    }
  }

  getItemList() {
    return this.items.join(',');
  }

  ngOnInit() {
    console.log('Component loaded');
  }
}
