package com.college.task.controller;

import com.college.task.model.Task;
import com.college.task.repository.TaskRepository;
import com.college.task.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @GetMapping
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        if (task.getEmployee() == null || task.getEmployee().getId() == null) {
            return ResponseEntity.badRequest().build();
        }
        return employeeRepository.findById(task.getEmployee().getId())
                .map(employee -> {
                    task.setEmployee(employee);
                    return ResponseEntity.ok(taskRepository.save(task));
                })
                .orElse(ResponseEntity.badRequest().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        return taskRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody Task taskDetails) {
        return taskRepository.findById(id)
                .map(task -> {
                    task.setTitle(taskDetails.getTitle());
                    task.setDescription(taskDetails.getDescription());
                    task.setStatus(taskDetails.getStatus());
                    task.setPriority(taskDetails.getPriority());
                    task.setDueDate(taskDetails.getDueDate());
                    
                    if (taskDetails.getEmployee() != null && taskDetails.getEmployee().getId() != null) {
                        employeeRepository.findById(taskDetails.getEmployee().getId())
                            .ifPresent(task::setEmployee);
                    }
                    
                    return ResponseEntity.ok(taskRepository.save(task));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id) {
        return taskRepository.findById(id)
                .map(task -> {
                    taskRepository.delete(task);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        List<Task> tasks = taskRepository.findAll();
        long totalEmployees = employeeRepository.count();
        long totalTasks = tasks.size();
        long pendingTasks = tasks.stream().filter(t -> "PENDING".equals(t.getStatus())).count();
        long completedTasks = tasks.stream().filter(t -> "COMPLETED".equals(t.getStatus())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalEmployees", totalEmployees);
        stats.put("totalTasks", totalTasks);
        stats.put("pendingTasks", pendingTasks);
        stats.put("completedTasks", completedTasks);

        return ResponseEntity.ok(stats);
    }
}
