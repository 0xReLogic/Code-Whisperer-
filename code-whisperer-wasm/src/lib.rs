use code_whisperer_core::wasm_interface::*;

// Re-export the main WASM interface
pub use code_whisperer_core::wasm_interface::{
    CodeWhispererEngine,
    EngineConfig,
    EditorContext,
    create_default_config,
    validate_syntax,
    init,
};

// WASM-specific utilities and optimizations
use wasm_bindgen::prelude::*;
use web_sys::{Performance, Window};
use std::collections::HashMap;

/// Performance monitor for WASM operations
#[wasm_bindgen]
pub struct WasmPerformanceMonitor {
    performance: Performance,
    start_times: HashMap<String, f64>,
}

#[wasm_bindgen]
impl WasmPerformanceMonitor {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<WasmPerformanceMonitor, JsValue> {
        let window = web_sys::window().ok_or("No global window object")?;
        let performance = window.performance().ok_or("Performance API not available")?;
        
        Ok(WasmPerformanceMonitor {
            performance,
            start_times: HashMap::new(),
        })
    }

    #[wasm_bindgen]
    pub fn start_timing(&mut self, operation: &str) {
        let now = self.performance.now();
        self.start_times.insert(operation.to_string(), now);
    }

    #[wasm_bindgen]
    pub fn end_timing(&mut self, operation: &str) -> Option<f64> {
        if let Some(start_time) = self.start_times.remove(operation) {
            let duration = self.performance.now() - start_time;
            web_sys::console::log_1(&format!("Operation '{}' took {:.2}ms", operation, duration).into());
            Some(duration)
        } else {
            None
        }
    }

    #[wasm_bindgen]
    pub fn get_memory_usage(&self) -> String {
        if let Some(memory) = js_sys::WebAssembly::Memory::from(wasm_bindgen::memory()) {
            let buffer = memory.buffer();
            let byte_length = buffer.byte_length();
            
            serde_json::to_string(&serde_json::json!({
                "allocated_bytes": byte_length,
                "allocated_mb": (byte_length as f64) / (1024.0 * 1024.0),
                "timestamp": self.performance.now()
            })).unwrap_or_default()
        } else {
            serde_json::to_string(&serde_json::json!({
                "error": "Unable to access WASM memory"
            })).unwrap_or_default()
        }
    }
}

/// WASM-optimized cache for frequently accessed data
#[wasm_bindgen]
pub struct WasmCache {
    cache: HashMap<String, String>,
    max_size: usize,
    access_count: HashMap<String, u32>,
}

#[wasm_bindgen]
impl WasmCache {
    #[wasm_bindgen(constructor)]
    pub fn new(max_size: usize) -> WasmCache {
        WasmCache {
            cache: HashMap::new(),
            max_size,
            access_count: HashMap::new(),
        }
    }

    #[wasm_bindgen]
    pub fn get(&mut self, key: &str) -> Option<String> {
        if let Some(value) = self.cache.get(key) {
            // Update access count for LRU eviction
            *self.access_count.entry(key.to_string()).or_insert(0) += 1;
            Some(value.clone())
        } else {
            None
        }
    }

    #[wasm_bindgen]
    pub fn set(&mut self, key: &str, value: &str) -> bool {
        // Check if we need to evict items
        if self.cache.len() >= self.max_size && !self.cache.contains_key(key) {
            self.evict_least_used();
        }

        self.cache.insert(key.to_string(), value.to_string());
        self.access_count.insert(key.to_string(), 1);
        true
    }

    #[wasm_bindgen]
    pub fn has(&self, key: &str) -> bool {
        self.cache.contains_key(key)
    }

    #[wasm_bindgen]
    pub fn clear(&mut self) {
        self.cache.clear();
        self.access_count.clear();
    }

    #[wasm_bindgen]
    pub fn size(&self) -> usize {
        self.cache.len()
    }

    #[wasm_bindgen]
    pub fn get_stats(&self) -> String {
        serde_json::to_string(&serde_json::json!({
            "current_size": self.cache.len(),
            "max_size": self.max_size,
            "total_keys": self.access_count.len(),
            "most_accessed": self.get_most_accessed_key()
        })).unwrap_or_default()
    }

    fn evict_least_used(&mut self) {
        if let Some((least_used_key, _)) = self.access_count.iter()
            .min_by_key(|(_, count)| *count) {
            let key_to_remove = least_used_key.clone();
            self.cache.remove(&key_to_remove);
            self.access_count.remove(&key_to_remove);
        }
    }

    fn get_most_accessed_key(&self) -> Option<String> {
        self.access_count.iter()
            .max_by_key(|(_, count)| *count)
            .map(|(key, _)| key.clone())
    }
}

/// Worker thread manager for background processing
#[wasm_bindgen]
pub struct WasmWorkerManager {
    workers: Vec<web_sys::Worker>,
    task_queue: Vec<String>,
}

#[wasm_bindgen]
impl WasmWorkerManager {
    #[wasm_bindgen(constructor)]
    pub fn new() -> WasmWorkerManager {
        WasmWorkerManager {
            workers: Vec::new(),
            task_queue: Vec::new(),
        }
    }

    #[wasm_bindgen]
    pub fn create_worker(&mut self, script_url: &str) -> Result<usize, JsValue> {
        let worker = web_sys::Worker::new(script_url)?;
        self.workers.push(worker);
        Ok(self.workers.len() - 1)
    }

    #[wasm_bindgen]
    pub fn post_message(&self, worker_id: usize, message: &str) -> Result<(), JsValue> {
        if let Some(worker) = self.workers.get(worker_id) {
            worker.post_message(&JsValue::from_str(message))?;
            Ok(())
        } else {
            Err(JsValue::from_str("Invalid worker ID"))
        }
    }

    #[wasm_bindgen]
    pub fn terminate_worker(&mut self, worker_id: usize) -> bool {
        if let Some(worker) = self.workers.get(worker_id) {
            worker.terminate();
            true
        } else {
            false
        }
    }

    #[wasm_bindgen]
    pub fn get_worker_count(&self) -> usize {
        self.workers.len()
    }
}

/// Lazy loading manager for WASM modules
#[wasm_bindgen]
pub struct WasmLazyLoader {
    loaded_modules: HashMap<String, bool>,
    loading_promises: HashMap<String, js_sys::Promise>,
}

#[wasm_bindgen]
impl WasmLazyLoader {
    #[wasm_bindgen(constructor)]
    pub fn new() -> WasmLazyLoader {
        WasmLazyLoader {
            loaded_modules: HashMap::new(),
            loading_promises: HashMap::new(),
        }
    }

    #[wasm_bindgen]
    pub fn is_module_loaded(&self, module_name: &str) -> bool {
        self.loaded_modules.get(module_name).copied().unwrap_or(false)
    }

    #[wasm_bindgen]
    pub fn mark_module_loaded(&mut self, module_name: &str) {
        self.loaded_modules.insert(module_name.to_string(), true);
        self.loading_promises.remove(module_name);
    }

    #[wasm_bindgen]
    pub fn get_loaded_modules(&self) -> Vec<String> {
        self.loaded_modules
            .iter()
            .filter(|(_, &loaded)| loaded)
            .map(|(name, _)| name.clone())
            .collect()
    }
}

/// Memory optimization utilities
#[wasm_bindgen]
pub struct WasmMemoryOptimizer;

#[wasm_bindgen]
impl WasmMemoryOptimizer {
    /// Force garbage collection (if available)
    #[wasm_bindgen]
    pub fn gc() {
        // Force a garbage collection cycle
        if let Ok(gc) = js_sys::Reflect::get(&js_sys::global(), &"gc".into()) {
            if gc.is_function() {
                let _ = js_sys::Function::from(gc).call0(&js_sys::global());
            }
        }
    }

    /// Get memory pressure information
    #[wasm_bindgen]
    pub fn get_memory_pressure() -> String {
        let memory = wasm_bindgen::memory();
        let buffer = js_sys::WebAssembly::Memory::from(memory).buffer();
        let byte_length = buffer.byte_length();
        
        // Estimate memory pressure based on usage
        let mb_used = (byte_length as f64) / (1024.0 * 1024.0);
        let pressure_level = if mb_used < 10.0 {
            "low"
        } else if mb_used < 50.0 {
            "medium"
        } else {
            "high"
        };

        serde_json::to_string(&serde_json::json!({
            "memory_used_mb": mb_used,
            "pressure_level": pressure_level,
            "byte_length": byte_length,
            "recommendation": match pressure_level {
                "high" => "Consider clearing caches or reducing concurrent operations",
                "medium" => "Monitor memory usage",
                "low" => "Memory usage is optimal",
                _ => "Unknown"
            }
        })).unwrap_or_default()
    }

    /// Optimize memory by clearing unnecessary data
    #[wasm_bindgen]
    pub fn optimize_memory() -> String {
        Self::gc();
        
        serde_json::to_string(&serde_json::json!({
            "action": "memory_optimization_triggered",
            "timestamp": js_sys::Date::now(),
            "status": "completed"
        })).unwrap_or_default()
    }
}

/// WASM module initialization with optimizations
#[wasm_bindgen(start)]
pub fn wasm_init() {
    // Set up panic hook for better error reporting
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();

    // Initialize performance monitoring
    web_sys::console::log_1(&"Code Whisperer WASM module initialized with optimizations".into());
    
    // Log memory information
    let memory = wasm_bindgen::memory();
    let buffer = js_sys::WebAssembly::Memory::from(memory).buffer();
    let initial_size = buffer.byte_length();
    
    web_sys::console::log_1(&format!(
        "Initial WASM memory: {:.2} MB", 
        (initial_size as f64) / (1024.0 * 1024.0)
    ).into());
}

/// Utility function to benchmark analysis performance
#[wasm_bindgen]
pub fn benchmark_analysis(code: &str, language: &str, iterations: usize) -> String {
    let mut performance_monitor = WasmPerformanceMonitor::new().unwrap();
    let config = create_default_config();
    let mut engine = CodeWhispererEngine::new(&config).unwrap();
    let context = EditorContext::new(
        "benchmark.txt".to_string(),
        language.to_string(),
        0,
    );

    performance_monitor.start_timing("total_benchmark");
    
    let mut durations = Vec::new();
    
    for i in 0..iterations {
        let operation_name = format!("iteration_{}", i);
        performance_monitor.start_timing(&operation_name);
        
        let _result = engine.analyze_and_suggest(code, &context, &config);
        
        if let Some(duration) = performance_monitor.end_timing(&operation_name) {
            durations.push(duration);
        }
    }

    performance_monitor.end_timing("total_benchmark");

    let avg_duration = durations.iter().sum::<f64>() / durations.len() as f64;
    let min_duration = durations.iter().fold(f64::INFINITY, |a, &b| a.min(b));
    let max_duration = durations.iter().fold(0.0, |a, &b| a.max(b));

    serde_json::to_string(&serde_json::json!({
        "iterations": iterations,
        "average_duration_ms": avg_duration,
        "min_duration_ms": min_duration,
        "max_duration_ms": max_duration,
        "total_duration_ms": durations.iter().sum::<f64>(),
        "memory_usage": performance_monitor.get_memory_usage()
    })).unwrap_or_default()
}
