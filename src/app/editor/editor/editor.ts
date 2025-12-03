import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-editor',

  templateUrl: './editor.html',
  styleUrl: './editor.css',
})
export class Editor implements OnInit {
  roomId: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.roomId = params.get('roomId') || 'unknown';
      console.log('Active Room:', this.roomId);
    });
  }
}
