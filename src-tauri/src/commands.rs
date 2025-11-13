use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfo {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub modified: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectInfo {
    pub project_name: String,      // 从 cwd 提取的显示名称（如 "cc-viewer"）
    pub project_folder: String,     // 文件夹名称（如 "C--Users-qidi-chen-Desktop-Tools-cc-viewer"）
    pub cwd: String,               // 完整的 cwd 路径
    pub files: Vec<FileInfo>,      // 该项目下的所有文件
    pub last_modified: u64,        // 最后修改时间
}

/// 列出所有项目及其文件（按项目分组）
#[tauri::command]
pub fn list_jsonl_files(directory: String) -> Result<Vec<ProjectInfo>, String> {
    let dir = PathBuf::from(&directory);

    if !dir.exists() {
        return Err(format!("目录不存在: {}", directory));
    }

    if !dir.is_dir() {
        return Err(format!("路径不是目录: {}", directory));
    }

    let mut projects = Vec::new();

    // 遍历所有子目录
    for entry in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        // 只处理目录
        if path.is_dir() {
            // 扫描这个项目目录
            if let Ok(project_info) = scan_project_directory(&path) {
                projects.push(project_info);
            }
        }
    }

    // 按最后修改时间降序排序
    projects.sort_by(|a, b| b.last_modified.cmp(&a.last_modified));

    Ok(projects)
}

/// 扫描一个项目目录，获取项目信息
fn scan_project_directory(project_dir: &PathBuf) -> Result<ProjectInfo, String> {
    let mut files = Vec::new();
    let mut last_modified = 0u64;
    let mut cwd = String::new();

    // 收集所有 .jsonl 文件
    for entry in fs::read_dir(project_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.extension().and_then(|s| s.to_str()) == Some("jsonl") {
            let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
            let modified = metadata
                .modified()
                .map_err(|e| e.to_string())?
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64; // 使用毫秒而不是秒

            // 更新最后修改时间
            if modified > last_modified {
                last_modified = modified;
            }

            // 如果还没有读取 cwd，尝试从这个文件读取
            if cwd.is_empty() {
                if let Ok(extracted_cwd) = extract_cwd_from_jsonl(&path) {
                    cwd = extracted_cwd;
                }
            }

            files.push(FileInfo {
                path: path.to_string_lossy().to_string(),
                name: path
                    .file_name()
                    .and_then(|s| s.to_str())
                    .unwrap_or("unknown")
                    .to_string(),
                size: metadata.len(),
                modified,
            });
        }
    }

    // 如果没有找到文件，返回错误
    if files.is_empty() {
        return Err("No jsonl files found".to_string());
    }

    // 按修改时间降序排序
    files.sort_by(|a, b| b.modified.cmp(&a.modified));

    // 从 cwd 中提取项目名称
    let project_name = if !cwd.is_empty() {
        extract_basename_from_path(&cwd)
    } else {
        // 如果没有读取到 cwd，使用文件夹名称
        project_dir
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("Unknown")
            .to_string()
    };

    let project_folder = project_dir
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("Unknown")
        .to_string();

    Ok(ProjectInfo {
        project_name,
        project_folder,
        cwd,
        files,
        last_modified,
    })
}

/// 从 JSONL 文件中提取 cwd 字段
fn extract_cwd_from_jsonl(file_path: &PathBuf) -> Result<String, String> {
    let content = fs::read_to_string(file_path).map_err(|e| e.to_string())?;

    // 只读取第一行
    if let Some(first_line) = content.lines().next() {
        if let Ok(json) = serde_json::from_str::<Value>(first_line) {
            if let Some(cwd) = json.get("cwd").and_then(|v| v.as_str()) {
                return Ok(cwd.to_string());
            }
        }
    }

    Err("No cwd field found".to_string())
}

/// 从路径中提取 basename（最后一个路径组件）
fn extract_basename_from_path(path: &str) -> String {
    // 处理 Windows 和 Unix 路径
    let parts: Vec<&str> = path.split(&['\\', '/'][..]).collect();
    parts
        .last()
        .unwrap_or(&"Unknown")
        .to_string()
}

/// 读取文件内容
#[tauri::command]
pub fn read_file_content(file_path: String) -> Result<String, String> {
    fs::read_to_string(&file_path).map_err(|e| {
        format!("无法读取文件 {}: {}", file_path, e)
    })
}

/// 获取默认的 Claude Code 目录
#[tauri::command]
pub fn get_default_claude_dir() -> Result<String, String> {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|e| format!("无法获取用户主目录: {}", e))?;

    let claude_dir = PathBuf::from(home)
        .join(".claude")
        .join("projects");

    if !claude_dir.exists() {
        return Err(format!(
            "Claude Code 目录不存在: {}",
            claude_dir.to_string_lossy()
        ));
    }

    Ok(claude_dir.to_string_lossy().to_string())
}
