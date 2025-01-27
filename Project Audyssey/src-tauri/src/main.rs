// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ecs;
use ecs::*;

fn main() {
    project_audyssey_lib::run()
}
