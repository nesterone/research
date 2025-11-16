import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ToDo App';
  tasks: Task[] = [
    { id: 1, text: 'Learn Angular', completed: false },
    { id: 2, text: 'Build a ToDo app', completed: true }
  ];
  newTask = '';

  addTask(): void {
    if (this.newTask.trim()) {
      this.tasks.push({
        id: Date.now(),
        text: this.newTask,
        completed: false
      });
      this.newTask = '';
    }
  }

  toggleTask(task: Task): void {
    task.completed = !task.completed;
  }

  deleteTask(id: number): void {
    this.tasks = this.tasks.filter(task => task.id !== id);
  }

  get completedCount(): number {
    return this.tasks.filter(t => t.completed).length;
  }
}
